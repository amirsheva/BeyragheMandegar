import {
  mkdir,
  rm,
} from "fs/promises";

import path
  from "path";


const root =
  process.cwd();

const testDir =
  path.join(
    root,
    ".test-data"
  );

const databasePath =
  path.join(
    testDir,
    "admin-test-otp.db"
  );


process.env.NODE_ENV =
  "test";

process.env.DB_STORAGE =
  databasePath;

process.env.OTP_PROVIDER =
  "noop";

process.env.OTP_SECRET =
  "admin-test-otp-secret-2026-beyragh-mandegar";

process.env.OTP_DEV_EXPOSE_CODE =
  "false";

process.env.CUSTOMER_PORTAL_ENABLED =
  "true";

process.env.ADMIN_TEST_OTP_ENABLED =
  "true";

process.env.ADMIN_TEST_OTP_TTL_SECONDS =
  "300";


await mkdir(
  testDir,
  {
    recursive:
      true,
  }
);

await rm(
  databasePath,
  {
    force:
      true,
  }
);


const {
  sequelize,
} =
  await import(
    "../models.js"
  );

const {
  ensureOtpSchema,
  requestReservationOtp,
  verifyReservationOtp,
} =
  await import(
    "../otp-service.js"
  );

const {
  AdminTestOtpError,
  getAdminTestOtpStatus,
  issueAdminTestOtp,
} =
  await import(
    "../admin-test-otp.js"
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

  console.log(
    `✅ ${message}`
  );
}


try {
  console.log("");
  console.log(
    "🔑 Admin Test OTP"
  );
  console.log(
    "────────────────────────────"
  );

  await ensureOtpSchema();

  const phone =
    "09121234567";

  const requested =
    await requestReservationOtp({
      phone,
    });

  assert(
    requested.challengeId,
    "OTP challenge created"
  );

  assert(
    !Object.prototype
      .hasOwnProperty.call(
        requested,
        "devCode"
      ),
    "Public response does not expose OTP"
  );

  const status =
    getAdminTestOtpStatus();

  assert(
    status.enabled ===
      true,
    "Admin test OTP feature flag enabled"
  );

  assert(
    status.provider ===
      "noop",
    "Admin test OTP restricted to noop provider"
  );

  const issued =
    await issueAdminTestOtp({
      phone,
    });

  assert(
    issued.challengeId ===
      requested.challengeId,
    "Latest challenge selected"
  );

  assert(
    /^\d{6}$/.test(
      issued.code
    ),
    "Six-digit test OTP generated"
  );

  const [
    rows,
  ] =
    await sequelize.query(
      `
        SELECT code_hash
        FROM otp_challenges
        WHERE id = :id
        LIMIT 1
      `,
      {
        replacements: {
          id:
            issued.challengeId,
        },
      }
    );

  assert(
    /^[a-f0-9]{64}$/i.test(
      String(
        rows[0]
          ?.code_hash ||
        ""
      )
    ),
    "Database stores OTP hash"
  );

  assert(
    String(
      rows[0]
        ?.code_hash ||
      ""
    ) !==
      issued.code,
    "Plain test OTP not stored in database"
  );

  const verified =
    await verifyReservationOtp({
      challengeId:
        issued.challengeId,

      code:
        issued.code,
    });

  assert(
    Boolean(
      verified
        ?.verificationToken
    ),
    "Generated admin OTP accepted by normal verifier"
  );

  let closedRejected =
    false;

  try {
    await issueAdminTestOtp({
      phone,
    });

  } catch (error) {
    closedRejected =
      error instanceof
        AdminTestOtpError &&
      error.code ===
        "ADMIN_TEST_OTP_CHALLENGE_CLOSED";
  }

  assert(
    closedRejected,
    "Verified challenge cannot be reopened"
  );

  process.env
    .ADMIN_TEST_OTP_ENABLED =
      "false";

  let disabledRejected =
    false;

  try {
    await issueAdminTestOtp({
      phone,
    });

  } catch (error) {
    disabledRejected =
      error instanceof
        AdminTestOtpError &&
      error.code ===
        "ADMIN_TEST_OTP_DISABLED";
  }

  assert(
    disabledRejected,
    "Disabled feature flag blocks test OTP"
  );

  process.env
    .ADMIN_TEST_OTP_ENABLED =
      "true";

  process.env
    .OTP_PROVIDER =
      "smsir";

  let providerRejected =
    false;

  try {
    await issueAdminTestOtp({
      phone,
    });

  } catch (error) {
    providerRejected =
      error instanceof
        AdminTestOtpError &&
      error.code ===
        "ADMIN_TEST_OTP_PROVIDER_NOT_NOOP";
  }

  assert(
    providerRejected,
    "Non-noop OTP provider blocks test generator"
  );

  console.log("");
  console.log(
    "✅ ADMIN TEST OTP PASSED"
  );

} finally {
  await sequelize
    .close()
    .catch(
      () => {}
    );

  const files = [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    `${databasePath}-journal`,
  ];

  for (
    const file
    of files
  ) {
    await rm(
      file,
      {
        force:
          true,
      }
    ).catch(
      () => {}
    );
  }

  console.log(
    "🧹 Admin test OTP database removed"
  );
}
