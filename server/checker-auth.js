import "dotenv/config";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  getActiveCheckerForSession,
  markCheckerLogin,
  migrateEnvCheckerUsers,
  verifyCheckerPassword,
} from "./checker-user-service.js";


const COOKIE_NAME =
  "bm_checker_session";

const SESSION_TTL_SECONDS =
  10 * 60 * 60;


function safeEqual(
  left,
  right
) {
  const a =
    Buffer.from(
      String(
        left
      )
    );

  const b =
    Buffer.from(
      String(
        right
      )
    );

  if (
    a.length !==
    b.length
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
    .filter(
      Boolean
    )
    .reduce(
      (
        output,
        item
      ) => {
        const separator =
          item.indexOf("=");

        if (
          separator ===
          -1
        ) {
          return output;
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

        output[key] =
          decodeURIComponent(
            value
          );

        return output;
      },
      {}
    );
}


function getSessionSecret() {
  const secret =
    String(
      process.env
        .TICKET_CHECKER_SESSION_SECRET ||
      ""
    );

  if (
    secret.length < 32
  ) {
    return null;
  }

  return secret;
}


function sign(
  payload
) {
  const secret =
    getSessionSecret();

  if (!secret) {
    throw new Error(
      "Ticket checker session is not configured."
    );
  }

  return createHmac(
    "sha256",
    secret
  )
    .update(
      payload
    )
    .digest(
      "base64url"
    );
}


export async function verifyCheckerCredentials(
  username,
  password
) {
  /*
   * Safe idempotent seed: existing DB records always win because
   * migration uses INSERT OR IGNORE. This also keeps isolated tests
   * and first-login startup robust if the server seed has not run yet.
   */
  await migrateEnvCheckerUsers();


  const user =
    await verifyCheckerPassword(
      username,
      password
    );

  if (!user) {
    return null;
  }


  await markCheckerLogin(
    user.username
  );


  return {
    username:
      user.username,

    displayName:
      user.displayName ||
      user.username,

    role:
      "ticket_checker",
  };
}


export function createCheckerSession(
  user
) {
  const now =
    Math.floor(
      Date.now() /
      1000
    );

  const payload =
    Buffer.from(
      JSON.stringify({
        sub:
          user.username,

        displayName:
          user.displayName,

        role:
          "ticket_checker",

        iat:
          now,

        exp:
          now +
          SESSION_TTL_SECONDS,
      })
    ).toString(
      "base64url"
    );

  return (
    payload +
    "." +
    sign(
      payload
    )
  );
}


export function verifyCheckerSession(
  token
) {
  try {
    if (!token) {
      return null;
    }

    const [
      payload,
      signature,
    ] =
      String(
        token
      ).split(".");

    if (
      !payload ||
      !signature
    ) {
      return null;
    }

    if (
      !safeEqual(
        signature,
        sign(
          payload
        )
      )
    ) {
      return null;
    }

    const data =
      JSON.parse(
        Buffer.from(
          payload,
          "base64url"
        ).toString(
          "utf8"
        )
      );

    const now =
      Math.floor(
        Date.now() /
        1000
      );

    if (
      !data.exp ||
      data.exp <=
        now ||
      data.role !==
        "ticket_checker"
    ) {
      return null;
    }

    return {
      username:
        data.sub,

      displayName:
        data.displayName ||
        data.sub,

      role:
        "ticket_checker",
    };

  } catch {
    return null;
  }
}


export function setCheckerCookie(
  res,
  token
) {
  res.cookie(
    COOKIE_NAME,
    token,
    {
      httpOnly:
        true,

      sameSite:
        "strict",

      secure:
        process.env
          .NODE_ENV ===
        "production",

      maxAge:
        SESSION_TTL_SECONDS *
        1000,

      path:
        "/",
    }
  );
}


export function clearCheckerCookie(
  res
) {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly:
        true,

      sameSite:
        "strict",

      secure:
        process.env
          .NODE_ENV ===
        "production",

      path:
        "/",
    }
  );
}


export async function requireChecker(
  req,
  res,
  next
) {
  try {
    const cookies =
      parseCookies(
        req
      );

    const session =
      verifyCheckerSession(
        cookies[
          COOKIE_NAME
        ]
      );

    if (!session) {
      return res
        .status(401)
        .json({
          message:
            "برای کنترل بلیت وارد شوید.",
        });
    }


    const current =
      await getActiveCheckerForSession(
        session.username
      );


    if (!current) {
      clearCheckerCookie(
        res
      );

      return res
        .status(401)
        .json({
          message:
            "حساب مسئول کنترل بلیت غیرفعال یا حذف شده است.",
        });
    }


    req.checker = {
      username:
        current.username,

      displayName:
        current.displayName,

      role:
        "ticket_checker",
    };


    return next();

  } catch (error) {
    return next(
      error
    );
  }
}


export function requireCheckerOrigin(
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

  if (!origin) {
    return next();
  }

  const allowed =
    new Set(
      [
        process.env
          .CHECKER_ORIGIN,

        process.env
          .PUBLIC_ORIGIN,

        "http://localhost:5173",
        "http://localhost:4000",
      ].filter(
        Boolean
      )
    );

  if (
    !allowed.has(
      origin
    )
  ) {
    return res
      .status(403)
      .json({
        message:
          "مبدأ درخواست کنترل بلیت مجاز نیست.",
      });
  }

  return next();
}