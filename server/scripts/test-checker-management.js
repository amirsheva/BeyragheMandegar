import {
  randomBytes,
  scryptSync,
} from "node:crypto";

import {
  rm,
} from "node:fs/promises";


const db =
  ".test-data/checker-management-test.db";


for (
  const suffix of [
    "",
    "-wal",
    "-shm",
    "-journal",
  ]
) {
  await rm(
    db +
    suffix,
    {
      force:
        true,
    }
  ).catch(
    () => {}
  );
}


process.env.DB_STORAGE =
  db;

process.env.TICKET_QR_SECRET =
  "checker-management-qr-secret-12345678901234567890";

process.env.TICKET_CHECKER_SESSION_SECRET =
  "checker-management-session-secret-12345678901234567890";


const legacyPassword =
  "LegacyChecker123";

const legacySalt =
  randomBytes(
    16
  ).toString(
    "hex"
  );

const legacyHash =
  legacySalt +
  ":" +
  scryptSync(
    legacyPassword,
    legacySalt,
    64
  ).toString(
    "hex"
  );


process.env.TICKET_CHECKER_USERS_JSON =
  JSON.stringify([
    {
      username:
        "legacychecker",

      displayName:
        "مسئول قدیمی",

      passwordHash:
        legacyHash,

      active:
        true,
    },
  ]);


const {
  sequelize,
  Production,
  Performance,
} =
  await import(
    "../models.js"
  );


const {
  ensureCheckinSchema,
} =
  await import(
    "../checkin-service.js"
  );


const {
  createCheckerUser,
  ensureCheckerUserSchema,
  getActiveCheckerForSession,
  isCheckerAllowedForPerformance,
  listCheckerUsersAdmin,
  migrateEnvCheckerUsers,
  resetCheckerPassword,
  updateCheckerUser,
  verifyCheckerPassword,
} =
  await import(
    "../checker-user-service.js"
  );


console.log("");
console.log(
  "👮 Ticket Checker Management Test"
);

console.log(
  "────────────────────────────────"
);


try {
  await sequelize.sync({
    force:
      true,
  });


  await ensureCheckinSchema();
  await ensureCheckerUserSchema();


  const production =
    await Production.create({
      title:
        "بیرق ماندگار",

      slug:
        "checker-management-test",

      status:
        "published",
    });


  const firstPerformance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1405/08/10",

      time:
        "19:00",

      capacity:
        10,

      remaining_capacity:
        10,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "شب اول",
    });


  const secondPerformance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1405/08/11",

      time:
        "19:00",

      capacity:
        10,

      remaining_capacity:
        10,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "شب دوم",
    });


  const migration =
    await migrateEnvCheckerUsers();


  if (
    migration.found !==
      1 ||
    migration.migrated !==
      1
  ) {
    throw new Error(
      `Legacy env checker migration mismatch: found=${migration.found}, migrated=${migration.migrated}`
    );
  }


  const secondMigration =
    await migrateEnvCheckerUsers();


  if (
    secondMigration.migrated !==
    0
  ) {
    throw new Error(
      "Legacy env migration is not idempotent."
    );
  }


  console.log(
    "✅ Legacy env migration is idempotent"
  );


  const legacyUser =
    await verifyCheckerPassword(
      "legacychecker",
      legacyPassword
    );


  if (
    !legacyUser ||
    !legacyUser
      .allPerformances
  ) {
    throw new Error(
      "Legacy checker credentials/access were not preserved."
    );
  }


  console.log(
    "✅ Existing env checker migrated to DB with all-performance access"
  );


  const created =
    await createCheckerUser({
      username:
        "door-east",

      displayName:
        "مسئول ورودی شرقی",

      password:
        "StrongChecker123",

      active:
        true,

      allPerformances:
        false,

      performanceIds: [
        firstPerformance.id,
      ],
    });


  if (
    !created ||
    created.username !==
      "door-east"
  ) {
    throw new Error(
      "Checker creation failed."
    );
  }


  console.log(
    "✅ DB checker account created"
  );


  const goodLogin =
    await verifyCheckerPassword(
      "door-east",
      "StrongChecker123"
    );


  const badLogin =
    await verifyCheckerPassword(
      "door-east",
      "WrongPassword123"
    );


  if (
    !goodLogin ||
    badLogin
  ) {
    throw new Error(
      "Checker password verification failed."
    );
  }


  console.log(
    "✅ Password hash verification works"
  );


  const allowedFirst =
    await isCheckerAllowedForPerformance(
      "door-east",
      firstPerformance.id
    );


  const deniedSecond =
    await isCheckerAllowedForPerformance(
      "door-east",
      secondPerformance.id
    );


  if (
    !allowedFirst ||
    deniedSecond
  ) {
    throw new Error(
      "Per-performance checker access failed."
    );
  }


  console.log(
    "✅ Per-performance access enforced"
  );


  await updateCheckerUser(
    created.id,
    {
      displayName:
        "مسئول ورودی اصلی",

      active:
        true,

      allPerformances:
        true,

      performanceIds:
        [],
    }
  );


  const allowedSecond =
    await isCheckerAllowedForPerformance(
      "door-east",
      secondPerformance.id
    );


  if (
    !allowedSecond
  ) {
    throw new Error(
      "All-performance access failed."
    );
  }


  console.log(
    "✅ All-performance access works"
  );


  await resetCheckerPassword(
    created.id,
    "NewCheckerPassword123"
  );


  const oldAfterReset =
    await verifyCheckerPassword(
      "door-east",
      "StrongChecker123"
    );


  const newAfterReset =
    await verifyCheckerPassword(
      "door-east",
      "NewCheckerPassword123"
    );


  if (
    oldAfterReset ||
    !newAfterReset
  ) {
    throw new Error(
      "Password reset failed."
    );
  }


  console.log(
    "✅ Password reset invalidates old password"
  );


  await updateCheckerUser(
    created.id,
    {
      displayName:
        "مسئول ورودی اصلی",

      active:
        false,

      allPerformances:
        true,
    }
  );


  const disabledLogin =
    await verifyCheckerPassword(
      "door-east",
      "NewCheckerPassword123"
    );


  const disabledSession =
    await getActiveCheckerForSession(
      "door-east"
    );


  if (
    disabledLogin ||
    disabledSession
  ) {
    throw new Error(
      "Disabled checker still has access."
    );
  }


  console.log(
    "✅ Deactivation blocks login and existing session validation"
  );


  const users =
    await listCheckerUsersAdmin();


  const serialized =
    JSON.stringify(
      users
    );


  if (
    serialized.includes(
      "password_hash"
    ) ||
    serialized.includes(
      "NewCheckerPassword123"
    ) ||
    serialized.includes(
      legacyHash
    )
  ) {
    throw new Error(
      "Password material leaked in Admin checker list."
    );
  }


  console.log(
    "✅ Admin list contains no password material"
  );


  console.log("");
  console.log(
    "✅ TICKET CHECKER MANAGEMENT TEST PASSED"
  );

} finally {
  await sequelize
    .close()
    .catch(
      () => {}
    );


  for (
    const suffix of [
      "",
      "-wal",
      "-shm",
      "-journal",
    ]
  ) {
    await rm(
      db +
      suffix,
      {
        force:
          true,
      }
    ).catch(
      () => {}
    );
  }


  console.log(
    "🧹 Checker management test database removed"
  );
}