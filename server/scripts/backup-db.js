import "dotenv/config";

import fs from "fs";
import path from "path";

import {
  getDbConfig,
  runPgTool,
} from "./pg-tools.js";


const root =
  process.cwd();

const backupDir =
  path.resolve(
    process.env.BACKUP_DIR ||
    path.join(
      root,
      "backups"
    )
  );


function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}


async function run() {
  console.log("");
  console.log(
    "💾 Postgres Backup"
  );

  console.log(
    "────────────────────────────"
  );


  const config =
    getDbConfig();


  fs.mkdirSync(
    backupDir,
    {
      recursive: true,
    }
  );


  const destination =
    path.join(
      backupDir,
      `reservations-${timestamp()}.dump`
    );


  try {
    /*
     * pg_dump یک Snapshot مستقل و Consistent
     * (در یک Transaction) از دیتابیس می‌سازد.
     * Custom format فشرده است و با pg_restore بازیابی می‌شود.
     */
    await runPgTool(
      "pg_dump",
      [
        "--format=custom",
        "--no-owner",
        "--no-privileges",
        config.database,
      ],
      {
        config,
        output: destination,
      }
    );


    /*
     * pg_restore --list کل Archive را می‌خواند؛
     * فایل ناقص یا خراب اینجا خطا می‌دهد.
     */
    await runPgTool(
      "pg_restore",
      [
        "--list",
      ],
      {
        config,
        input: destination,
      }
    );
  } catch (error) {
    fs.rmSync(
      destination,
      {
        force: true,
      }
    );

    throw error;
  }


  const stats =
    fs.statSync(
      destination
    );


  console.log(
    "✅ Backup created"
  );

  console.log(
    `📁 ${destination}`
  );

  console.log(
    `📦 ${stats.size} bytes`
  );

  console.log(
    "✅ pg_restore --list = ok"
  );
}


run()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ BACKUP FAILED:"
    );

    console.error(
      error.message || error
    );

    process.exitCode = 1;
  });
