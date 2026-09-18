import {
  createHmac,
  randomInt,
} from "crypto";

import {
  QueryTypes,
} from "sequelize";

import {
  sequelize,
} from "./models.js";

import {
  ensureOtpSchema,
  normalizePhone,
} from "./otp-service.js";


const PURPOSE_RESERVATION =
  "reservation";


class AdminTestOtpError extends Error {
  constructor(
    message,
    {
      status = 400,
      code =
        "ADMIN_TEST_OTP_ERROR",
    } = {}
  ) {
    super(message);

    this.name =
      "AdminTestOtpError";

    this.status =
      status;

    this.code =
      code;
  }
}


function readBoolean(
  name,
  fallback = false
) {
  const value =
    process.env[name];

  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return fallback;
  }

  return [
    "1",
    "true",
    "yes",
    "on",
  ].includes(
    String(value)
      .trim()
      .toLowerCase()
  );
}


function readInteger(
  name,
  fallback,
  {
    min = 1,
    max =
      Number.MAX_SAFE_INTEGER,
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


function otpProviderName() {
  return String(
    process.env.OTP_PROVIDER ||
    (
      process.env.NODE_ENV ===
        "production"
        ? "smsir"
        : "noop"
    )
  )
    .trim()
    .toLowerCase();
}


function getOtpSecret() {
  const value =
    String(
      process.env.OTP_SECRET ||
      ""
    ).trim();

  if (
    value.length < 32
  ) {
    throw new AdminTestOtpError(
      "OTP_SECRET برای ابزار تست معتبر نیست.",
      {
        status: 503,
        code:
          "ADMIN_TEST_OTP_SECRET_INVALID",
      }
    );
  }

  return value;
}


function digest(
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
  return digest(
    "phone",
    phone
  );
}


function codeDigest(
  challengeId,
  code
) {
  return digest(
    "code",
    `${challengeId}:${code}`
  );
}


function maskPhone(
  phone
) {
  return (
    phone.slice(
      0,
      4
    ) +
    "***" +
    phone.slice(
      -4
    )
  );
}


function getAdminTestOtpStatus() {
  return {
    enabled:
      readBoolean(
        "ADMIN_TEST_OTP_ENABLED",
        false
      ),

    provider:
      otpProviderName(),

    customerPortalEnabled:
      readBoolean(
        "CUSTOMER_PORTAL_ENABLED",
        false
      ),

    ttlSeconds:
      readInteger(
        "ADMIN_TEST_OTP_TTL_SECONDS",
        300,
        {
          min: 60,
          max: 900,
        }
      ),
  };
}


async function issueAdminTestOtp({
  phone,
}) {
  await ensureOtpSchema();

  const status =
    getAdminTestOtpStatus();

  if (!status.enabled) {
    throw new AdminTestOtpError(
      "ابزار OTP تست در پنل مدیریت غیرفعال است.",
      {
        status: 403,
        code:
          "ADMIN_TEST_OTP_DISABLED",
      }
    );
  }

  if (
    !status
      .customerPortalEnabled
  ) {
    throw new AdminTestOtpError(
      "ابتدا بخش «رزروهای من» را فعال کنید.",
      {
        status: 409,
        code:
          "ADMIN_TEST_OTP_PORTAL_DISABLED",
      }
    );
  }

  if (
    status.provider !==
    "noop"
  ) {
    throw new AdminTestOtpError(
      "ساخت OTP تست فقط زمانی مجاز است که OTP_PROVIDER=noop باشد.",
      {
        status: 409,
        code:
          "ADMIN_TEST_OTP_PROVIDER_NOT_NOOP",
      }
    );
  }

  let cleanPhone;

  try {
    cleanPhone =
      normalizePhone(
        phone
      );

  } catch {
    throw new AdminTestOtpError(
      "شماره موبایل معتبر نیست.",
      {
        status: 400,
        code:
          "ADMIN_TEST_OTP_PHONE_INVALID",
      }
    );
  }

  const rows =
    await sequelize.query(
      `
        SELECT
          id,
          provider,
          verified_at,
          used_at,
          created_at
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
            phoneDigest(
              cleanPhone
            ),

          purpose:
            PURPOSE_RESERVATION,
        },

        type:
          QueryTypes.SELECT,
      }
    );

  const challenge =
    rows[0];

  if (!challenge) {
    throw new AdminTestOtpError(
      "برای این شماره درخواست کد تأیید فعالی پیدا نشد. ابتدا در «رزروهای من» روی دریافت کد تأیید بزنید.",
      {
        status: 404,
        code:
          "ADMIN_TEST_OTP_CHALLENGE_NOT_FOUND",
      }
    );
  }

  if (
    String(
      challenge.provider ||
      ""
    ).toLowerCase() !==
    "noop"
  ) {
    throw new AdminTestOtpError(
      "این درخواست OTP با Provider تست ساخته نشده است.",
      {
        status: 409,
        code:
          "ADMIN_TEST_OTP_CHALLENGE_PROVIDER_INVALID",
      }
    );
  }

  if (
    challenge.verified_at ||
    challenge.used_at
  ) {
    throw new AdminTestOtpError(
      "این درخواست قبلاً استفاده یا تأیید شده است. ابتدا از صفحه «رزروهای من» یک کد جدید درخواست کنید.",
      {
        status: 409,
        code:
          "ADMIN_TEST_OTP_CHALLENGE_CLOSED",
      }
    );
  }

  const code =
    String(
      randomInt(
        100000,
        1000000
      )
    );

  const ttlSeconds =
    status.ttlSeconds;

  const expiresAt =
    Date.now() +
    ttlSeconds *
      1000;

  await sequelize.query(
    `
      UPDATE otp_challenges
      SET
        code_hash = :codeHash,
        expires_at = :expiresAt,
        attempts = 0,
        verified_at = NULL,
        grant_hash = NULL,
        grant_expires_at = NULL
      WHERE id = :id
    `,
    {
      replacements: {
        codeHash:
          codeDigest(
            challenge.id,
            code
          ),

        expiresAt,

        id:
          challenge.id,
      },
    }
  );

  return {
    challengeId:
      challenge.id,

    code,

    expiresInSeconds:
      ttlSeconds,

    phoneMasked:
      maskPhone(
        cleanPhone
      ),
  };
}


export {
  AdminTestOtpError,
  getAdminTestOtpStatus,
  issueAdminTestOtp,
};
