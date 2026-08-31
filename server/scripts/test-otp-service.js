import {
  mkdirSync,
  rmSync,
} from "fs";

import path
  from "path";


const root =
  process.cwd();

const testRoot =
  path.join(
    root,
    ".test-data",
    "otp-service"
  );

const databasePath =
  path.join(
    testRoot,
    "otp.db"
  );


rmSync(
  testRoot,
  {
    recursive:
      true,

    force:
      true,
  }
);

mkdirSync(
  testRoot,
  {
    recursive:
      true,
  }
);


process.env.NODE_ENV =
  "development";

process.env.DB_STORAGE =
  databasePath;

process.env.OTP_RESERVATION_REQUIRED =
  "true";

process.env.OTP_PROVIDER =
  "noop";

process.env.OTP_DEV_EXPOSE_CODE =
  "true";

process.env.OTP_SECRET =
  "otp-test-secret-0123456789-abcdefghijklmnopqrstuvwxyz";

process.env.OTP_RESEND_COOLDOWN_SECONDS =
  "10";

process.env.OTP_PHONE_MAX_REQUESTS =
  "10";

process.env.PII_ENCRYPTION_ENABLED =
  "false";


const {
  sequelize,
} =
  await import(
    "../models.js"
  );

const {
  OtpError,
  ensureOtpSchema,
  requestReservationOtp,
  verifyReservationOtp,
  validateReservationOtpGrant,
  consumeReservationOtpGrant,
} =
  await import(
    "../otp-service.js"
  );


function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      message
    );
  }
}


async function expectOtpError(
  action,
  expectedCode
) {
  try {
    await action();

  } catch (error) {
    if (
      error instanceof
        OtpError &&
      error.code ===
        expectedCode
    ) {
      return;
    }


    throw error;
  }


  throw new Error(
    `Expected OTP error: ${expectedCode}`
  );
}


async function run() {
  console.log("");
  console.log(
    "🔐 OTP Service Test"
  );
  console.log(
    "────────────────────────────"
  );


  await ensureOtpSchema();


  const firstPhone =
    "09121234567";


  const request =
    await requestReservationOtp({
      phone:
        firstPhone,
    });


  assert(
    Boolean(
      request.challengeId
    ),
    "Challenge ID missing"
  );

  assert(
    /^\d{6}$/.test(
      request.devCode ||
      ""
    ),
    "Development OTP code missing"
  );


  console.log(
    "✅ OTP challenge created"
  );


  /*
   * Verify that neither raw phone nor
   * plaintext OTP exists in otp_challenges.
   */
  const [
    rawRows,
  ] =
    await sequelize.query(
      `
        SELECT *
        FROM otp_challenges
      `
    );


  const rawText =
    JSON.stringify(
      rawRows
    );


  assert(
    !rawText.includes(
      firstPhone
    ),
    "Raw phone leaked into OTP table"
  );

  assert(
    !rawText.includes(
      request.devCode
    ),
    "Plaintext OTP leaked into OTP table"
  );


  console.log(
    "✅ Raw phone not stored"
  );

  console.log(
    "✅ Plaintext OTP not stored"
  );


  const wrongCode =
    request.devCode ===
      "000000"
      ? "111111"
      : "000000";


  await expectOtpError(
    () =>
      verifyReservationOtp({
        challengeId:
          request.challengeId,

        code:
          wrongCode,
      }),
    "OTP_INCORRECT"
  );


  console.log(
    "✅ Wrong OTP rejected"
  );


  const verified =
    await verifyReservationOtp({
      challengeId:
        request.challengeId,

      code:
        request.devCode,
    });


  assert(
    Boolean(
      verified.verificationToken
    ),
    "Verification grant missing"
  );


  console.log(
    "✅ Correct OTP verified"
  );


  const grant =
    await validateReservationOtpGrant({
      verificationToken:
        verified.verificationToken,

      phone:
        firstPhone,
    });


  assert(
    grant.challengeId ===
      request.challengeId,
    "Grant challenge mismatch"
  );


  console.log(
    "✅ Verification grant valid"
  );


  await expectOtpError(
    () =>
      validateReservationOtpGrant({
        verificationToken:
          verified.verificationToken,

        phone:
          "09121111111",
      }),
    "OTP_PHONE_MISMATCH"
  );


  console.log(
    "✅ Grant bound to verified phone"
  );


  const transaction =
    await sequelize.transaction({
      type:
        "IMMEDIATE",
    });


  try {
    await consumeReservationOtpGrant({
      challengeId:
        grant.challengeId,

      transaction,
    });

    await transaction.commit();

  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }


  console.log(
    "✅ Grant consumed once"
  );


  await expectOtpError(
    () =>
      validateReservationOtpGrant({
        verificationToken:
          verified.verificationToken,

        phone:
          firstPhone,
      }),
    "OTP_USED"
  );


  console.log(
    "✅ Grant reuse rejected"
  );


  const expiredRequest =
    await requestReservationOtp({
      phone:
        "09123334455",
    });


  await sequelize.query(
    `
      UPDATE otp_challenges
      SET expires_at = :expired
      WHERE id = :id
    `,
    {
      replacements: {
        expired:
          Date.now() -
          1000,

        id:
          expiredRequest
            .challengeId,
      },
    }
  );


  await expectOtpError(
    () =>
      verifyReservationOtp({
        challengeId:
          expiredRequest
            .challengeId,

        code:
          expiredRequest
            .devCode,
      }),
    "OTP_EXPIRED"
  );


  console.log(
    "✅ Expired OTP rejected"
  );


  console.log("");
  console.log(
    "✅ OTP SERVICE TEST PASSED"
  );
}


try {
  await run();

} finally {
  await sequelize.close();

  rmSync(
    testRoot,
    {
      recursive:
        true,

      force:
        true,
    }
  );

  console.log(
    "🧹 OTP test database removed"
  );
}