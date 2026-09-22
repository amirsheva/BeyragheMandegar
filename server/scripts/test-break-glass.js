import assert from "node:assert/strict";
import {
  existsSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  randomBytes,
  scryptSync,
} from "node:crypto";


const dbPath = path.join(
  os.tmpdir(),
  `beyragh-break-glass-${process.pid}-${Date.now()}.db`
);

const password =
  "BreakGlass-Test-Password-2026!";

const salt =
  randomBytes(16)
    .toString("hex");

const passwordHash =
  scryptSync(
    password,
    salt,
    64
  ).toString("hex");


process.env.NODE_ENV =
  "test";

process.env.DB_STORAGE =
  dbPath;

process.env.PII_ENCRYPTION_ENABLED =
  "true";

process.env.PII_ENCRYPTION_KEY =
  randomBytes(32)
    .toString("base64");

process.env.BREAK_GLASS_ENABLED =
  "true";

process.env.BREAK_GLASS_OWNER_USERNAME =
  "owner";

process.env.BREAK_GLASS_PASSWORD_HASH =
  `${salt}:${passwordHash}`;

process.env.BREAK_GLASS_TTL_SECONDS =
  "120";

process.env.BREAK_GLASS_MAX_REVEALS =
  "2";


const {
  sequelize,
} = await import(
  "../models.js"
);

const {
  BreakGlassError,
  getBreakGlassStatus,
  revokeBreakGlassGrant,
  unlockBreakGlass,
  validateBreakGlassGrant,
} = await import(
  "../break-glass.js"
);


async function run() {
  await sequelize.sync({
    force: true,
  });

  const status =
    getBreakGlassStatus(
      "owner"
    );

  assert.equal(
    status.enabled,
    true
  );

  assert.equal(
    status.maxReveals,
    2
  );

  let wrongPasswordRejected =
    false;

  try {
    await unlockBreakGlass({
      username:
        "owner",
      password:
        "wrong-password",
      reasonCode:
        "security-incident",
      ip:
        "127.0.0.1",
      userAgent:
        "test",
    });
  } catch (error) {
    wrongPasswordRejected =
      error instanceof
        BreakGlassError &&
      error.statusCode ===
        401;
  }

  assert.equal(
    wrongPasswordRejected,
    true
  );

  const unlocked =
    await unlockBreakGlass({
      username:
        "owner",
      password,
      reasonCode:
        "security-incident",
      ip:
        "127.0.0.1",
      userAgent:
        "test",
    });

  assert.ok(
    unlocked.grant
  );

  const grant =
    validateBreakGlassGrant({
      token:
        unlocked.grant,
      username:
        "owner",
    });

  assert.equal(
    grant.reasonCode,
    "security-incident"
  );

  let ownerMismatchRejected =
    false;

  try {
    validateBreakGlassGrant({
      token:
        unlocked.grant,
      username:
        "other-admin",
    });
  } catch (error) {
    ownerMismatchRejected =
      error instanceof
        BreakGlassError &&
      error.statusCode ===
        403;
  }

  assert.equal(
    ownerMismatchRejected,
    true
  );

  const revokeResult =
    await revokeBreakGlassGrant({
      token:
        unlocked.grant,
      username:
        "owner",
      ip:
        "127.0.0.1",
      userAgent:
        "test",
    });

  assert.equal(
    revokeResult.revoked,
    true
  );

  let revokedRejected =
    false;

  try {
    validateBreakGlassGrant({
      token:
        unlocked.grant,
      username:
        "owner",
    });
  } catch (error) {
    revokedRejected =
      error instanceof
        BreakGlassError &&
      error.statusCode ===
        401;
  }

  assert.equal(
    revokedRejected,
    true
  );

  const [rows] =
    await sequelize.query(`
      SELECT
        actor,
        action,
        reason_code,
        status_code
      FROM pii_access_logs
      ORDER BY id ASC
    `);

  assert.ok(
    rows.some(
      (row) =>
        row.action ===
          "unlock.denied" &&
        Number(
          row.status_code
        ) === 401
    )
  );

  assert.ok(
    rows.some(
      (row) =>
        row.action ===
          "unlock.granted" &&
        Number(
          row.status_code
        ) === 200
    )
  );

  assert.ok(
    rows.some(
      (row) =>
        row.action ===
          "lock" &&
        Number(
          row.status_code
        ) === 200
    )
  );

  assert.equal(
    JSON.stringify(rows)
      .includes(password),
    false
  );

  console.log(
    "✅ Break-glass security tests passed"
  );
}


try {
  await run();

} finally {
  await sequelize.close();

  for (
    const file
    of [
      dbPath,
      `${dbPath}-shm`,
      `${dbPath}-wal`,
    ]
  ) {
    if (
      existsSync(file)
    ) {
      rmSync(
        file,
        {
          force: true,
        }
      );
    }
  }
}
