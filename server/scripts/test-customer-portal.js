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
    "customer-portal.db"
  );


process.env.NODE_ENV =
  "test";

process.env.DB_STORAGE =
  databasePath;

process.env.PII_ENCRYPTION_ENABLED =
  "true";

process.env.PII_ENCRYPTION_KEY =
  Buffer.from(
    "0123456789abcdef0123456789abcdef",
    "utf8"
  ).toString(
    "base64"
  );

process.env.CUSTOMER_PORTAL_ENABLED =
  "true";

process.env.CUSTOMER_SESSION_SECRET =
  "customer-session-test-secret-2026-beyragh-mandegar";

process.env.CUSTOMER_LOOKUP_SECRET =
  "customer-lookup-test-secret-2026-beyragh-mandegar";

process.env.CUSTOMER_SESSION_TTL_SECONDS =
  "3600";

process.env.OTP_PROVIDER =
  "noop";

process.env.OTP_SECRET =
  "customer-otp-test-secret-2026-beyragh-mandegar";

process.env.OTP_DEV_EXPOSE_CODE =
  "true";


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
  Production,
  Performance,
  Reservation,
} =
  await import(
    "../models.js"
  );

const {
  createCustomerSessionToken,
  customerPhoneLookup,
  ensureCustomerPortalSchema,
  verifyCustomerSessionToken,
} =
  await import(
    "../customer-auth.js"
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
    "👤 Customer Portal Test"
  );
  console.log(
    "────────────────────────────"
  );

  await sequelize.sync({
    force:
      true,
  });

  await ensureCustomerPortalSchema();

  const production =
    await Production.create({
      title:
        "Test Production",

      slug:
        "customer-test-production",

      status:
        "published",
    });

  const performance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1405/08/01",

      time:
        "20:00",

      capacity:
        100,

      remaining_capacity:
        99,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "Test Performance",
    });

  const phone =
    "09121234567";

  const reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "Test Customer",

      phone,

      national_id:
        "0013546789",

      count:
        1,

      tracking_code:
        "BM-CUSTOMER-TEST-001",

      status:
        "confirmed",

      phone_lookup:
        null,
    });

  await ensureCustomerPortalSchema();

  const refreshed =
    await Reservation.findByPk(
      reservation.id
    );

  const expectedLookup =
    customerPhoneLookup(
      phone
    );

  assert(
    refreshed.phone_lookup ===
      expectedLookup,
    "Existing reservation phone lookup backfilled"
  );

  assert(
    /^[a-f0-9]{64}$/.test(
      expectedLookup
    ),
    "Phone lookup is HMAC digest"
  );

  const sessionToken =
    createCustomerSessionToken(
      phone
    );

  const payloadPart =
    sessionToken.split(
      "."
    )[0];

  const payload =
    JSON.parse(
      Buffer.from(
        payloadPart,
        "base64url"
      ).toString(
        "utf8"
      )
    );

  assert(
    payload.sub ===
      expectedLookup,
    "Customer session bound to phone lookup"
  );

  assert(
    !JSON.stringify(
      payload
    ).includes(
      phone
    ),
    "Raw phone not stored in customer session payload"
  );

  const verified =
    verifyCustomerSessionToken(
      sessionToken
    );

  assert(
    verified
      ?.phoneLookup ===
      expectedLookup,
    "Valid customer session accepted"
  );

  const tampered =
    `${sessionToken.slice(
      0,
      -1
    )}${
      sessionToken.endsWith(
        "a"
      )
        ? "b"
        : "a"
    }`;

  assert(
    verifyCustomerSessionToken(
      tampered
    ) === null,
    "Tampered customer session rejected"
  );

  console.log("");
  console.log(
    "✅ CUSTOMER PORTAL TEST PASSED"
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
    "🧹 Customer portal test database removed"
  );
}