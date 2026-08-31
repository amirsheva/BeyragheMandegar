import {
  createHmac,
  timingSafeEqual,
} from "crypto";

import {
  QueryTypes,
} from "sequelize";

import {
  sequelize,
  Reservation,
} from "./models.js";

import {
  normalizePhone,
} from "./otp-service.js";


const CUSTOMER_COOKIE_NAME =
  "bm_customer_session";

const DEFAULT_SESSION_TTL_SECONDS =
  7 * 24 * 60 * 60;


function readBoolean(
  name,
  fallback = false
) {
  const raw =
    process.env[name];

  if (
    raw === undefined ||
    raw === null ||
    String(raw).trim() === ""
  ) {
    return fallback;
  }

  return [
    "1",
    "true",
    "yes",
    "on",
  ].includes(
    String(raw)
      .trim()
      .toLowerCase()
  );
}


function readInteger(
  name,
  fallback,
  {
    min = 1,
    max = Number.MAX_SAFE_INTEGER,
  } = {}
) {
  const value =
    Number(
      process.env[name]
    );

  if (
    !Number.isSafeInteger(
      value
    ) ||
    value < min ||
    value > max
  ) {
    return fallback;
  }

  return value;
}


function safeEqual(
  left,
  right
) {
  const a =
    Buffer.from(
      String(left || ""),
      "utf8"
    );

  const b =
    Buffer.from(
      String(right || ""),
      "utf8"
    );

  if (
    a.length === 0 ||
    b.length === 0 ||
    a.length !== b.length
  ) {
    return false;
  }

  return timingSafeEqual(
    a,
    b
  );
}


function parseCookies(
  req
) {
  const header =
    req.headers.cookie ||
    "";

  return header
    .split(";")
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean)
    .reduce(
      (
        cookies,
        item
      ) => {
        const separator =
          item.indexOf("=");

        if (
          separator === -1
        ) {
          return cookies;
        }

        const key =
          item.slice(
            0,
            separator
          );

        const value =
          item.slice(
            separator + 1
          );

        cookies[key] =
          decodeURIComponent(
            value
          );

        return cookies;
      },
      {}
    );
}


function getRequiredSecret(
  name
) {
  const value =
    String(
      process.env[name] ||
      ""
    ).trim();

  if (
    value.length < 32
  ) {
    throw new Error(
      `${name} must be at least 32 characters`
    );
  }

  return value;
}


function sessionTtlSeconds() {
  return readInteger(
    "CUSTOMER_SESSION_TTL_SECONDS",
    DEFAULT_SESSION_TTL_SECONDS,
    {
      min:
        15 * 60,
      max:
        30 * 24 * 60 * 60,
    }
  );
}


function hmac(
  secret,
  namespace,
  value
) {
  return createHmac(
    "sha256",
    secret
  )
    .update(
      `${namespace}:${value}`,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function signSessionPayload(
  payload
) {
  return hmac(
    getRequiredSecret(
      "CUSTOMER_SESSION_SECRET"
    ),
    "customer-session",
    payload
  );
}


function encodePayload(
  data
) {
  return Buffer.from(
    JSON.stringify(
      data
    ),
    "utf8"
  ).toString(
    "base64url"
  );
}


function decodePayload(
  payload
) {
  return JSON.parse(
    Buffer.from(
      payload,
      "base64url"
    ).toString(
      "utf8"
    )
  );
}


function isCustomerPortalEnabled() {
  return readBoolean(
    "CUSTOMER_PORTAL_ENABLED",
    false
  );
}


function assertCustomerPortalConfigured() {
  if (
    !isCustomerPortalEnabled()
  ) {
    return;
  }

  getRequiredSecret(
    "CUSTOMER_SESSION_SECRET"
  );

  getRequiredSecret(
    "CUSTOMER_LOOKUP_SECRET"
  );
}


function customerPhoneLookup(
  phone
) {
  const cleanPhone =
    normalizePhone(
      phone
    );

  return hmac(
    getRequiredSecret(
      "CUSTOMER_LOOKUP_SECRET"
    ),
    "customer-phone",
    cleanPhone
  );
}


function createCustomerSessionToken(
  phone
) {
  const now =
    Math.floor(
      Date.now() /
      1000
    );

  const payload =
    encodePayload({
      sub:
        customerPhoneLookup(
          phone
        ),

      iat:
        now,

      exp:
        now +
        sessionTtlSeconds(),
    });

  const signature =
    signSessionPayload(
      payload
    );

  return `${payload}.${signature}`;
}


function verifyCustomerSessionToken(
  token
) {
  try {
    const raw =
      String(
        token ||
        ""
      ).trim();

    if (!raw) {
      return null;
    }

    const parts =
      raw.split(".");

    if (
      parts.length !== 2
    ) {
      return null;
    }

    const [
      payload,
      signature,
    ] =
      parts;

    const expected =
      signSessionPayload(
        payload
      );

    if (
      !safeEqual(
        signature,
        expected
      )
    ) {
      return null;
    }

    const data =
      decodePayload(
        payload
      );

    const now =
      Math.floor(
        Date.now() /
        1000
      );

    if (
      !data?.sub ||
      !/^[a-f0-9]{64}$/i.test(
        data.sub
      ) ||
      !Number.isFinite(
        Number(
          data.exp
        )
      ) ||
      Number(
        data.exp
      ) <= now
    ) {
      return null;
    }

    return {
      phoneLookup:
        String(
          data.sub
        ).toLowerCase(),

      issuedAt:
        Number(
          data.iat ||
          0
        ),

      expiresAt:
        Number(
          data.exp
        ),
    };

  } catch {
    return null;
  }
}


function readCustomerSession(
  req
) {
  const cookies =
    parseCookies(
      req
    );

  return verifyCustomerSessionToken(
    cookies[
      CUSTOMER_COOKIE_NAME
    ]
  );
}


function setCustomerCookie(
  res,
  token
) {
  res.cookie(
    CUSTOMER_COOKIE_NAME,
    token,
    {
      httpOnly:
        true,

      sameSite:
        "strict",

      secure:
        process.env.NODE_ENV ===
        "production",

      maxAge:
        sessionTtlSeconds() *
        1000,

      path:
        "/",
    }
  );
}


function clearCustomerCookie(
  res
) {
  res.clearCookie(
    CUSTOMER_COOKIE_NAME,
    {
      httpOnly:
        true,

      sameSite:
        "strict",

      secure:
        process.env.NODE_ENV ===
        "production",

      path:
        "/",
    }
  );
}


function requireCustomer(
  req,
  res,
  next
) {
  const session =
    readCustomerSession(
      req
    );

  if (!session) {
    return res
      .status(401)
      .json({
        message:
          "برای مشاهده رزروهای خود ابتدا شماره موبایل را تأیید کنید.",

        code:
          "CUSTOMER_AUTH_REQUIRED",
      });
  }

  req.customer =
    session;

  return next();
}


function requireCustomerOrigin(
  req,
  res,
  next
) {
  if (
    [
      "GET",
      "HEAD",
      "OPTIONS",
    ].includes(
      req.method
    )
  ) {
    return next();
  }

  const origin =
    req.get(
      "origin"
    );

  const expected =
    String(
      process.env
        .CUSTOMER_ORIGIN ||
      "http://localhost:5173"
    ).trim();

  if (
    origin &&
    origin !== expected
  ) {
    return res
      .status(403)
      .json({
        message:
          "درخواست از مبدأ غیرمجاز ارسال شده است.",

        code:
          "CUSTOMER_ORIGIN_DENIED",
      });
  }

  return next();
}


async function ensureCustomerPortalSchema() {
  const columns =
    await sequelize.query(
      "PRAGMA table_info(reservations)",
      {
        type:
          QueryTypes.SELECT,
      }
    );

  const hasPhoneLookup =
    columns.some(
      (column) =>
        String(
          column?.name ||
          ""
        ) ===
        "phone_lookup"
    );

  if (
    !hasPhoneLookup
  ) {
    await sequelize.query(
      `
        ALTER TABLE reservations
        ADD COLUMN phone_lookup TEXT
      `
    );
  }

  await sequelize.query(
    `
      CREATE INDEX IF NOT EXISTS
        idx_reservations_phone_lookup
      ON reservations (
        phone_lookup
      )
    `
  );

  if (
    !isCustomerPortalEnabled()
  ) {
    return {
      backfilled:
        0,
    };
  }

  assertCustomerPortalConfigured();

  const reservations =
    await Reservation.findAll({
      attributes: [
        "id",
        "phone",
        "phone_lookup",
      ],
    });

  let backfilled =
    0;

  for (
    const reservation
    of reservations
  ) {
    if (
      String(
        reservation.phone_lookup ||
        ""
      ).trim()
    ) {
      continue;
    }

    const lookup =
      customerPhoneLookup(
        reservation.phone
      );

    await sequelize.query(
      `
        UPDATE reservations
        SET phone_lookup = :lookup
        WHERE id = :id
      `,
      {
        replacements: {
          lookup,

          id:
            reservation.id,
        },
      }
    );

    backfilled +=
      1;
  }

  if (
    backfilled > 0
  ) {
    console.log(
      `✅ Customer reservation lookup backfilled: ${backfilled}`
    );
  }

  return {
    backfilled,
  };
}


export {
  CUSTOMER_COOKIE_NAME,
  assertCustomerPortalConfigured,
  clearCustomerCookie,
  createCustomerSessionToken,
  customerPhoneLookup,
  ensureCustomerPortalSchema,
  isCustomerPortalEnabled,
  readCustomerSession,
  requireCustomer,
  requireCustomerOrigin,
  setCustomerCookie,
  verifyCustomerSessionToken,
};