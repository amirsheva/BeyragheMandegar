import {
  mkdirSync,
  rmSync,
} from "fs";

import path from "path";

import {
  spawn,
  spawnSync,
} from "child_process";

import {
  scryptSync,
} from "crypto";


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
    "core-tests.db"
  );

const port =
  "4017";

const baseUrl =
  `http://127.0.0.1:${port}`;

const adminPassword =
  "CI-Test-Password-2026";

const salt =
  "ci-test-salt";

const adminHash =
  scryptSync(
    adminPassword,
    salt,
    64
  ).toString(
    "hex"
  );


const env = {
  ...process.env,

  NODE_ENV:
    "test",

  PORT:
    port,

  DB_STORAGE:
    databasePath,

  PII_ENCRYPTION_ENABLED:
    "true",

  PII_ENCRYPTION_KEY:
    Buffer.from(
      "0123456789abcdef0123456789abcdef",
      "utf8"
    ).toString(
      "base64"
    ),

  TEST_BASE_URL:
    baseUrl,

  ADMIN_ORIGIN:
    baseUrl,

  ADMIN_USERNAME:
    "ci-admin",

  ADMIN_PASSWORD_HASH:
    `${salt}:${adminHash}`,

  ADMIN_SESSION_SECRET:
    "ci-session-secret-2026-beyragh-mandegar-very-long-secret",

  TEST_ADMIN_PASSWORD:
    adminPassword,

  SMS_PROVIDER:
    "noop",

  SMS_TRANSACTIONAL_ENABLED:
    "false",

  OTP_RESERVATION_REQUIRED:
    "false",

  OTP_PROVIDER:
    "noop",

  OTP_DEV_EXPOSE_CODE:
    "true",

  CUSTOMER_PORTAL_ENABLED:
    "false",
};


function runNode(
  script,
  label
) {
  console.log("");
  console.log(
    `▶ ${label}`
  );

  const result =
    spawnSync(
      process.execPath,
      [
        script,
      ],
      {
        cwd:
          root,

        env,

        stdio:
          "inherit",
      }
    );

  if (
    result.status !== 0
  ) {
    throw new Error(
      `${label} failed with exit code ${result.status}`
    );
  }
}


async function waitForServer() {
  const deadline =
    Date.now() +
    20_000;

  while (
    Date.now() <
    deadline
  ) {
    try {
      const response =
        await fetch(
          `${baseUrl}/api/health`
        );

      if (
        response.ok
      ) {
        const data =
          await response.json();

        if (
          data.ok &&
          data.database ===
            "ready"
        ) {
          return;
        }
      }
    } catch {}

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          300
        )
    );
  }

  throw new Error(
    "Test server did not become healthy."
  );
}


async function stopServer(
  child
) {
  if (
    !child ||
    child.killed
  ) {
    return;
  }

  child.kill();

  await new Promise(
    (resolve) => {
      const timeout =
        setTimeout(
          resolve,
          3000
        );

      child.once(
        "exit",
        () => {
          clearTimeout(
            timeout
          );

          resolve();
        }
      );
    }
  );
}


async function main() {
  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "🧪 BEYRAGH CORE TEST SUITE"
  );

  console.log(
    "========================================"
  );


  rmSync(
    testDir,
    {
      recursive:
        true,

      force:
        true,
    }
  );

  mkdirSync(
    testDir,
    {
      recursive:
        true,
    }
  );


  runNode(
    "server/scripts/prepare-test-db.js",
    "Prepare isolated database"
  );


  runNode(
    "server/scripts/test-access-log-redaction.js",
    "Access-log redaction"
  );


  runNode(
    "server/scripts/test-pii-encryption.js",
    "PII encryption at rest"
  );


  console.log("");
  console.log(
    `▶ Starting isolated API on ${baseUrl}`
  );


  const server =
    spawn(
      process.execPath,
      [
        "server/index.js",
      ],
      {
        cwd:
          root,

        env,

        stdio: [
          "ignore",
          "inherit",
          "inherit",
        ],
      }
    );


  try {
    await waitForServer();

    console.log(
      "✅ Test API health check passed."
    );


    runNode(
      "server/scripts/test-reservation-validation.js",
      "Reservation validation"
    );


    runNode(
      "server/scripts/test-persian-digits.js",
      "Persian digit normalization"
    );


    runNode(
      "server/scripts/test-oversell.js",
      "Atomic oversell protection"
    );


    runNode(
      "server/scripts/test-cancel-restore.js",
      "Cancel / restore capacity"
    );


    runNode(
      "server/scripts/test-admin-pii-masking.js",
      "Admin PII masking"
    );


    runNode(
      "server/scripts/test-admin-auth.js",
      "Admin authentication"
    );


    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      "✅ ALL CORE TESTS PASSED"
    );

    console.log(
      "✅ Production database was NOT used"
    );

    console.log(
      "========================================"
    );

  } finally {
    await stopServer(
      server
    );

    rmSync(
      testDir,
      {
        recursive:
          true,

        force:
          true,
      }
    );
  }
}


main().catch((error) => {
  console.error("");
  console.error(
    "❌ CORE TEST SUITE FAILED"
  );

  console.error(
    error
  );

  process.exitCode = 1;
});