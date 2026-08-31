import {
  mkdirSync,
  rmSync,
} from "fs";

import path from "path";

import {
  spawnSync,
} from "child_process";


const root =
  process.cwd();

const testRoot =
  path.join(
    root,
    ".test-data",
    "backup-test"
  );

const databasePath =
  path.join(
    testRoot,
    "source.db"
  );

const backupDir =
  path.join(
    testRoot,
    "backups"
  );


const env = {
  ...process.env,

  NODE_ENV:
    "test",

  DB_STORAGE:
    databasePath,

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


function main() {
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


  try {
    runNode(
      "server/scripts/prepare-test-db.js",
      "Prepare isolated source database"
    );

    runNode(
      "server/scripts/backup-db.js",
      "Create SQLite backup"
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


try {
  main();
} catch (error) {
  console.error("");
  console.error(
    "❌ BACKUP / RESTORE TEST FAILED"
  );

  console.error(
    error
  );

  process.exitCode = 1;
}