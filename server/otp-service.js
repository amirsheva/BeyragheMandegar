import {
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "crypto";

import {
  QueryTypes,
} from "sequelize";

import {
  sequelize,
} from "./models.js";

import noopProvider
  from "./sms/providers/noop-provider.js";

import smsirProvider
  from "./sms/providers/smsir-provider.js";


const PURPOSE_RESERVATION =
  "reservation";


const DEFAULT_CODE_TTL_SECONDS =
  180;

const DEFAULT_GRANT_TTL_SECONDS =
  600;

const DEFAULT_RESEND_COOLDOWN_SECONDS =
  60;

const DEFAULT_MAX_ATTEMPTS =
  5;

const DEFAULT_PHONE_WINDOW_SECONDS =
  900;

const DEFAULT_PHONE_MAX_REQUESTS =
  5;


let ephemeralSecret =
  null;

let ephemeralWarningShown =
  false;


class OtpError extends Error {
  constructor(
    message,
    {
      status = 400,
      code = "OTP_ERROR",
      retryAfterSeconds = null,
    } = {}
  ) {
    super(message);

    this.name =
      "OtpError";

    this.status =
      status;

    this.code =
      code;

    this.retryAfterSeconds =
      retryAfterSeconds;
  }
}


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


function isProduction() {
  return (
    process.env.NODE_ENV ===
    "production"
  );
}


function isReservationOtpRequired() {
  /*
   * IMPORTANT:
   *
   * Foundation phase defaults to OFF.
   * We explicitly enable it only after
   * Booking UI is wired in the next phase.
   */
  return readBoolean(
    "OTP_RESERVATION_REQUIRED",
    false
  );
}


function otpProviderName() {
  return String(
    process.env.OTP_PROVIDER ||
    (
      isProduction()
        ? "smsir"
        : "noop"
    )
  )
    .trim()
    .toLowerCase();
}


function getOtpSecret() {
  const configured =
    String(
      process.env.OTP_SECRET ||
      ""
    ).trim();


  if (
    configured.length >= 32
  ) {
    return configured;
  }


  if (
    isProduction() &&
    isReservationOtpRequired()
  ) {
    throw new Error(
      "OTP_SECRET در Production باید حداقل ۳۲ کاراکتر باشد."
    );
  }


  if (!ephemeralSecret) {
    ephemeralSecret =
      randomBytes(32)
        .toString(
          "base64url"
        );
  }


  if (
    !ephemeralWarningShown &&
    process.env.NODE_ENV !==
      "test"
  ) {
    ephemeralWarningShown =
      true;

    console.warn(
      "⚠️ OTP uses an ephemeral development secret. Configure OTP_SECRET before production."
    );
  }


  return ephemeralSecret;
}


function assertOtpConfigured() {
  if (
    !isReservationOtpRequired()
  ) {
    return;
  }


  getOtpSecret();


  if (!isProduction()) {
    return;
  }


  const provider =
    otpProviderName();


  if (
    provider !== "smsir"
  ) {
    throw new Error(
      "Production OTP_PROVIDER باید smsir باشد."
    );
  }


  if (
    !String(
      process.env.SMSIR_API_KEY ||
      ""
    ).trim()
  ) {
    throw new Error(
      "SMSIR_API_KEY برای OTP تنظیم نشده است."
    );
  }


  const templateId =
    Number(
      process.env
        .OTP_SMSIR_TEMPLATE_ID ||
      process.env
        .SMSIR_SANDBOX_VERIFY_TEMPLATE_ID
    );


  if (
    !Number.isSafeInteger(
      templateId
    ) ||
    templateId <= 0
  ) {
    throw new Error(
      "OTP_SMSIR_TEMPLATE_ID برای Production تنظیم نشده است."
    );
  }


  if (
    readBoolean(
      "OTP_DEV_EXPOSE_CODE",
      false
    )
  ) {
    throw new Error(
      "OTP_DEV_EXPOSE_CODE در Production باید false باشد."
    );
  }
}


function normalizeDigits(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /[۰-۹]/g,
      (char) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹"
            .indexOf(
              char
            )
        )
    )
    .replace(
      /[٠-٩]/g,
      (char) =>
        String(
          "٠١٢٣٤٥٦٧٨٩"
            .indexOf(
              char
            )
        )
    );
}


function normalizePhone(
  value
) {
  let phone =
    normalizeDigits(
      value
    )
      .trim()
      .replace(
        /[\s()-]/g,
        ""
      );


  if (
    phone.startsWith(
      "+98"
    )
  ) {
    phone =
      "0" +
      phone.slice(3);
  }


  if (
    phone.startsWith(
      "98"
    ) &&
    phone.length === 12
  ) {
    phone =
      "0" +
      phone.slice(2);
  }


  if (
    !/^09\d{9}$/.test(
      phone
    )
  ) {
    throw new OtpError(
      "شماره موبایل معتبر نیست.",
      {
        status: 400,
        code:
          "OTP_PHONE_INVALID",
      }
    );
  }


  return phone;
}


function normalizeCode(
  value
) {
  const code =
    normalizeDigits(
      value
    )
      .replace(
        /\D/g,
        ""
      );


  if (
    !/^\d{6}$/.test(
      code
    )
  ) {
    throw new OtpError(
      "کد تأیید باید ۶ رقم باشد.",
      {
        status: 400,
        code:
          "OTP_CODE_INVALID",
      }
    );
  }


  return code;
}


function hmac(
  namespace,
  value
) {
  return createHmac(
    "sha256",
    getOtpSecret()
  )
    .update(
      `${namespace}:${value}`,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function phoneDigest(
  phone
) {
  return hmac(
    "phone",
    phone
  );
}


function codeDigest(
  challengeId,
  code
) {
  return hmac(
    "code",
    `${challengeId}:${code}`
  );
}


function grantDigest(
  token
) {
  return hmac(
    "grant",
    token
  );
}


function safeHexEqual(
  left,
  right
) {
  try {
    const a =
      Buffer.from(
        String(left || ""),
        "hex"
      );

    const b =
      Buffer.from(
        String(right || ""),
        "hex"
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

  } catch {
    return false;
  }
}


async function ensureOtpSchema() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS otp_challenges (
      id TEXT PRIMARY KEY NOT NULL,
      phone_digest TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code_hash TEXT,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      verified_at INTEGER,
      grant_hash TEXT,
      grant_expires_at INTEGER,
      used_at INTEGER,
      provider TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);


  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      idx_otp_phone_purpose_created
    ON otp_challenges (
      phone_digest,
      purpose,
      created_at
    )
  `);


  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      idx_otp_grant_hash
    ON otp_challenges (
      grant_hash
    )
  `);
}


async function cleanupOtpRows() {
  const cutoff =
    Date.now() -
    24 * 60 * 60 * 1000;


  await sequelize.query(
    `
      DELETE FROM otp_challenges
      WHERE created_at < :cutoff
    `,
    {
      replacements: {
        cutoff,
      },
    }
  );
}


async function deliverOtp({
  phone,
  code,
}) {
  const provider =
    otpProviderName();


  if (
    provider === "noop"
  ) {
    /*
     * Deliberately DO NOT put the OTP
     * in the noop message/log.
     */
    await noopProvider.send({
      phone,
      message:
        "OTP verification request",
    });


    return {
      provider,
      providerMessageId:
        null,
    };
  }


  if (
    provider === "smsir"
  ) {
    const templateId =
      Number(
        process.env
          .OTP_SMSIR_TEMPLATE_ID ||
        process.env
          .SMSIR_SANDBOX_VERIFY_TEMPLATE_ID
      );


    if (
      !Number.isSafeInteger(
        templateId
      ) ||
      templateId <= 0
    ) {
      throw new OtpError(
        "قالب OTP در SMS.ir تنظیم نشده است.",
        {
          status: 503,
          code:
            "OTP_PROVIDER_CONFIG",
        }
      );
    }


    const parameterName =
      String(
        process.env
          .OTP_SMSIR_CODE_PARAMETER ||
        "Code"
      ).trim() ||
      "Code";


    const result =
      await smsirProvider
        .sendVerify({
          mobile:
            phone,

          templateId,

          parameters: [
            {
              name:
                parameterName,

              value:
                code,
            },
          ],
        });


    return {
      provider,

      providerMessageId:
        result.messageId !==
          undefined &&
        result.messageId !==
          null
          ? String(
              result.messageId
            )
          : null,
    };
  }


  throw new OtpError(
    "سرویس ارسال OTP پشتیبانی نمی‌شود.",
    {
      status: 503,
      code:
        "OTP_PROVIDER_INVALID",
    }
  );
}


async function requestReservationOtp({
  phone,
}) {
  await ensureOtpSchema();

  await cleanupOtpRows();


  const cleanPhone =
    normalizePhone(
      phone
    );

  const digest =
    phoneDigest(
      cleanPhone
    );

  const now =
    Date.now();

  const cooldownSeconds =
    readInteger(
      "OTP_RESEND_COOLDOWN_SECONDS",
      DEFAULT_RESEND_COOLDOWN_SECONDS,
      {
        min: 10,
        max: 600,
      }
    );

  const windowSeconds =
    readInteger(
      "OTP_PHONE_WINDOW_SECONDS",
      DEFAULT_PHONE_WINDOW_SECONDS,
      {
        min: 60,
        max: 86400,
      }
    );

  const phoneMaxRequests =
    readInteger(
      "OTP_PHONE_MAX_REQUESTS",
      DEFAULT_PHONE_MAX_REQUESTS,
      {
        min: 1,
        max: 50,
      }
    );


  const latestRows =
    await sequelize.query(
      `
        SELECT created_at
        FROM otp_challenges
        WHERE
          phone_digest = :phoneDigest
          AND purpose = :purpose
        ORDER BY created_at DESC
        LIMIT 1
      `,
      {
        replacements: {
          phoneDigest:
            digest,

          purpose:
            PURPOSE_RESERVATION,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const latest =
    latestRows[0];


  if (latest) {
    const elapsedMs =
      now -
      Number(
        latest.created_at ||
        0
      );

    const cooldownMs =
      cooldownSeconds *
      1000;


    if (
      elapsedMs <
      cooldownMs
    ) {
      const retryAfterSeconds =
        Math.max(
          1,
          Math.ceil(
            (
              cooldownMs -
              elapsedMs
            ) /
            1000
          )
        );


      throw new OtpError(
        `برای ارسال مجدد ${retryAfterSeconds} ثانیه صبر کنید.`,
        {
          status: 429,
          code:
            "OTP_COOLDOWN",

          retryAfterSeconds,
        }
      );
    }
  }


  const windowStart =
    now -
    windowSeconds *
      1000;


  const countRows =
    await sequelize.query(
      `
        SELECT COUNT(*) AS count
        FROM otp_challenges
        WHERE
          phone_digest = :phoneDigest
          AND purpose = :purpose
          AND created_at >= :windowStart
      `,
      {
        replacements: {
          phoneDigest:
            digest,

          purpose:
            PURPOSE_RESERVATION,

          windowStart,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const requestCount =
    Number(
      countRows[0]
        ?.count ||
      0
    );


  if (
    requestCount >=
    phoneMaxRequests
  ) {
    throw new OtpError(
      "تعداد درخواست کد تأیید برای این شماره بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
      {
        status: 429,
        code:
          "OTP_PHONE_RATE_LIMIT",
      }
    );
  }


  const challengeId =
    randomUUID();

  const code =
    String(
      randomInt(
        100000,
        1000000
      )
    );

  const ttlSeconds =
    readInteger(
      "OTP_CODE_TTL_SECONDS",
      DEFAULT_CODE_TTL_SECONDS,
      {
        min: 60,
        max: 900,
      }
    );

  const maxAttempts =
    readInteger(
      "OTP_MAX_ATTEMPTS",
      DEFAULT_MAX_ATTEMPTS,
      {
        min: 3,
        max: 10,
      }
    );

  const expiresAt =
    now +
    ttlSeconds *
      1000;

  const provider =
    otpProviderName();


  await sequelize.query(
    `
      INSERT INTO otp_challenges (
        id,
        phone_digest,
        purpose,
        code_hash,
        expires_at,
        attempts,
        max_attempts,
        provider,
        created_at
      )
      VALUES (
        :id,
        :phoneDigest,
        :purpose,
        :codeHash,
        :expiresAt,
        0,
        :maxAttempts,
        :provider,
        :createdAt
      )
    `,
    {
      replacements: {
        id:
          challengeId,

        phoneDigest:
          digest,

        purpose:
          PURPOSE_RESERVATION,

        codeHash:
          codeDigest(
            challengeId,
            code
          ),

        expiresAt,

        maxAttempts,

        provider,

        createdAt:
          now,
      },
    }
  );


  try {
    await deliverOtp({
      phone:
        cleanPhone,

      code,
    });

  } catch (error) {
    await sequelize.query(
      `
        DELETE FROM otp_challenges
        WHERE id = :id
      `,
      {
        replacements: {
          id:
            challengeId,
        },
      }
    );


    if (
      error instanceof
      OtpError
    ) {
      throw error;
    }


    throw new OtpError(
      "ارسال کد تأیید انجام نشد. کمی بعد دوباره تلاش کنید.",
      {
        status: 502,
        code:
          "OTP_DELIVERY_FAILED",
      }
    );
  }


  const exposeDevCode =
    process.env.NODE_ENV ===
      "development" &&
    provider === "noop" &&
    readBoolean(
      "OTP_DEV_EXPOSE_CODE",
      true
    );


  return {
    challengeId,

    expiresInSeconds:
      ttlSeconds,

    resendAfterSeconds:
      cooldownSeconds,

    ...(exposeDevCode
      ? {
          devCode:
            code,
        }
      : {}),
  };
}


async function getChallenge(
  challengeId,
  {
    transaction = null,
  } = {}
) {
  const id =
    String(
      challengeId ||
      ""
    ).trim();


  if (!id) {
    throw new OtpError(
      "شناسه درخواست کد تأیید معتبر نیست.",
      {
        status: 400,
        code:
          "OTP_CHALLENGE_INVALID",
      }
    );
  }


  const rows =
    await sequelize.query(
      `
        SELECT *
        FROM otp_challenges
        WHERE id = :id
        LIMIT 1
      `,
      {
        replacements: {
          id,
        },

        type:
          QueryTypes.SELECT,

        transaction,
      }
    );


  if (!rows[0]) {
    throw new OtpError(
      "درخواست کد تأیید یافت نشد یا منقضی شده است.",
      {
        status: 404,
        code:
          "OTP_CHALLENGE_NOT_FOUND",
      }
    );
  }


  return rows[0];
}


async function verifyReservationOtp({
  challengeId,
  code,
}) {
  await ensureOtpSchema();


  const cleanCode =
    normalizeCode(
      code
    );

  const challenge =
    await getChallenge(
      challengeId
    );

  const now =
    Date.now();


  if (
    challenge.purpose !==
    PURPOSE_RESERVATION
  ) {
    throw new OtpError(
      "نوع درخواست OTP نامعتبر است.",
      {
        status: 400,
        code:
          "OTP_PURPOSE_INVALID",
      }
    );
  }


  if (
    challenge.used_at
  ) {
    throw new OtpError(
      "این تأیید قبلاً استفاده شده است.",
      {
        status: 409,
        code:
          "OTP_USED",
      }
    );
  }


  if (
    challenge.verified_at
  ) {
    throw new OtpError(
      "این کد قبلاً تأیید شده است.",
      {
        status: 409,
        code:
          "OTP_ALREADY_VERIFIED",
      }
    );
  }


  if (
    now >
    Number(
      challenge.expires_at
    )
  ) {
    throw new OtpError(
      "کد تأیید منقضی شده است. کد جدید دریافت کنید.",
      {
        status: 410,
        code:
          "OTP_EXPIRED",
      }
    );
  }


  const attempts =
    Number(
      challenge.attempts ||
      0
    );

  const maxAttempts =
    Number(
      challenge.max_attempts ||
      DEFAULT_MAX_ATTEMPTS
    );


  if (
    attempts >=
    maxAttempts
  ) {
    throw new OtpError(
      "تعداد تلاش‌های ورود کد بیش از حد مجاز است. کد جدید دریافت کنید.",
      {
        status: 429,
        code:
          "OTP_LOCKED",
      }
    );
  }


  const expected =
    codeDigest(
      challenge.id,
      cleanCode
    );


  if (
    !safeHexEqual(
      challenge.code_hash,
      expected
    )
  ) {
    const nextAttempts =
      attempts +
      1;


    await sequelize.query(
      `
        UPDATE otp_challenges
        SET attempts = :attempts
        WHERE id = :id
      `,
      {
        replacements: {
          attempts:
            nextAttempts,

          id:
            challenge.id,
        },
      }
    );


    if (
      nextAttempts >=
      maxAttempts
    ) {
      throw new OtpError(
        "تعداد تلاش‌های ورود کد بیش از حد مجاز است. کد جدید دریافت کنید.",
        {
          status: 429,
          code:
            "OTP_LOCKED",
        }
      );
    }


    throw new OtpError(
      "کد تأیید صحیح نیست.",
      {
        status: 400,
        code:
          "OTP_INCORRECT",
      }
    );
  }


  const verificationToken =
    randomBytes(32)
      .toString(
        "base64url"
      );

  const grantTtlSeconds =
    readInteger(
      "OTP_GRANT_TTL_SECONDS",
      DEFAULT_GRANT_TTL_SECONDS,
      {
        min: 60,
        max: 3600,
      }
    );

  const grantExpiresAt =
    now +
    grantTtlSeconds *
      1000;


  await sequelize.query(
    `
      UPDATE otp_challenges
      SET
        verified_at = :verifiedAt,
        grant_hash = :grantHash,
        grant_expires_at = :grantExpiresAt,
        code_hash = NULL
      WHERE id = :id
    `,
    {
      replacements: {
        verifiedAt:
          now,

        grantHash:
          grantDigest(
            verificationToken
          ),

        grantExpiresAt,

        id:
          challenge.id,
      },
    }
  );


  return {
    verificationToken,

    expiresInSeconds:
      grantTtlSeconds,
  };
}


async function validateReservationOtpGrant({
  verificationToken,
  phone,
}) {
  await ensureOtpSchema();


  const token =
    String(
      verificationToken ||
      ""
    ).trim();


  if (
    token.length < 20 ||
    token.length > 200
  ) {
    throw new OtpError(
      "تأیید شماره موبایل لازم است.",
      {
        status: 401,
        code:
          "OTP_REQUIRED",
      }
    );
  }


  const cleanPhone =
    normalizePhone(
      phone
    );

  const expectedPhoneDigest =
    phoneDigest(
      cleanPhone
    );

  const tokenDigest =
    grantDigest(
      token
    );


  const rows =
    await sequelize.query(
      `
        SELECT *
        FROM otp_challenges
        WHERE grant_hash = :grantHash
        LIMIT 1
      `,
      {
        replacements: {
          grantHash:
            tokenDigest,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const challenge =
    rows[0];


  if (
    !challenge ||
    challenge.purpose !==
      PURPOSE_RESERVATION ||
    !challenge.verified_at
  ) {
    throw new OtpError(
      "تأیید شماره موبایل معتبر نیست.",
      {
        status: 401,
        code:
          "OTP_INVALID",
      }
    );
  }


  if (
    challenge.used_at
  ) {
    throw new OtpError(
      "این تأیید قبلاً برای یک رزرو استفاده شده است.",
      {
        status: 409,
        code:
          "OTP_USED",
      }
    );
  }


  if (
    Date.now() >
    Number(
      challenge.grant_expires_at ||
      0
    )
  ) {
    throw new OtpError(
      "اعتبار تأیید شماره موبایل تمام شده است. دوباره کد دریافت کنید.",
      {
        status: 410,
        code:
          "OTP_GRANT_EXPIRED",
      }
    );
  }


  if (
    !safeHexEqual(
      challenge.phone_digest,
      expectedPhoneDigest
    )
  ) {
    throw new OtpError(
      "شماره موبایل با تأیید انجام‌شده مطابقت ندارد.",
      {
        status: 401,
        code:
          "OTP_PHONE_MISMATCH",
      }
    );
  }


  return {
    challengeId:
      challenge.id,

    phone:
      cleanPhone,
  };
}


async function consumeReservationOtpGrant({
  challengeId,
  transaction,
}) {
  if (!challengeId) {
    return;
  }


  const challenge =
    await getChallenge(
      challengeId,
      {
        transaction,
      }
    );


  if (
    challenge.used_at
  ) {
    throw new OtpError(
      "این تأیید قبلاً استفاده شده است.",
      {
        status: 409,
        code:
          "OTP_USED",
      }
    );
  }


  if (
    !challenge.verified_at ||
    Date.now() >
      Number(
        challenge.grant_expires_at ||
        0
      )
  ) {
    throw new OtpError(
      "اعتبار تأیید شماره موبایل تمام شده است.",
      {
        status: 410,
        code:
          "OTP_GRANT_EXPIRED",
      }
    );
  }


  await sequelize.query(
    `
      UPDATE otp_challenges
      SET used_at = :usedAt
      WHERE id = :id
    `,
    {
      replacements: {
        usedAt:
          Date.now(),

        id:
          challenge.id,
      },

      transaction,
    }
  );
}


export {
  OtpError,
  assertOtpConfigured,
  ensureOtpSchema,
  isReservationOtpRequired,
  normalizePhone,
  requestReservationOtp,
  verifyReservationOtp,
  validateReservationOtpGrant,
  consumeReservationOtpGrant,
};