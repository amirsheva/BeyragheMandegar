import "dotenv/config";

import {
  mkdirSync,
  rmSync,
} from "fs";

import path from "path";

import {
  spawnSync,
} from "child_process";

import {
  connect,
  getDbConfig,
  quoteIdent,
} from "./pg-tools.js";


const root =
  process.cwd();

const testRoot =
  path.join(
    root,
    ".test-data",
    "backup-test"
  );

/*
 * Pipeline روی یک دیتابیس Postgres جدا
 * (<DB_NAME>_backup_test) اجرا می‌شود؛
 * prepare-test-db فقط دیتابیس‌های *_test را
 * پاک می‌کند.
 */
const dbConfig =
  getDbConfig();

const testDatabase =
  `${dbConfig.database}_backup_test`;

const backupDir =
  path.join(
    testRoot,
    "backups"
  );


const env = {
  ...process.env,

  NODE_ENV:
    "test",

  DB_NAME:
    testDatabase,

  BACKUP_DIR:
    backupDir,

  SMS_PROVIDER:
    "noop",

  SMS_TRANSACTIONAL_ENABLED:
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


async function main() {
  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "💾 ISOLATED BACKUP / RESTORE TEST"
  );

  console.log(
    "========================================"
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


  const admin =
    connect(dbConfig);

  await admin.query(
    `DROP DATABASE IF EXISTS ${quoteIdent(testDatabase)}`
  );

  await admin.query(
    `CREATE DATABASE ${quoteIdent(testDatabase)}`
  );


  try {
    runNode(
      "server/scripts/prepare-test-db.js",
      "Prepare isolated source database"
    );

    runNode(
      "server/scripts/backup-db.js",
      "Create Postgres backup"
    );

    runNode(
      "server/scripts/test-backup-restore.js",
      "Verify restored backup"
    );


    console.log("");
    console.log(
      "========================================"
    );

    console.log(
      "✅ BACKUP / RESTORE PIPELINE PASSED"
    );

    console.log(
      "✅ Production database was NOT used"
    );

    console.log(
      "========================================"
    );

  } finally {
    await admin.query(
      `DROP DATABASE IF EXISTS ${quoteIdent(testDatabase)}`
    );

    await admin.close();

    rmSync(
      testRoot,
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
    "❌ BACKUP / RESTORE TEST FAILED"
  );

  console.error(
    error
  );

  process.exitCode = 1;
});