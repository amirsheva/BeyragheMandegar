import fs from "fs";
import path from "path";
import { Sequelize } from "sequelize";

import {
  sequelize,
} from "../models.js";


const root =
  process.cwd();

const source =
  path.join(
    root,
    "reservations.db"
  );

const backupDir =
  path.join(
    root,
    "backups"
  );


function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}


function escapeSqlitePath(value) {
  return String(value)
    .replace(/'/g, "''");
}


async function run() {
  console.log("");
  console.log(
    "💾 SQLite Backup"
  );

  console.log(
    "────────────────────────────"
  );


  if (!fs.existsSync(source)) {
    throw new Error(
      "reservations.db پیدا نشد."
    );
  }


  fs.mkdirSync(
    backupDir,
    {
      recursive: true,
    }
  );


  const destination =
    path.join(
      backupDir,
      `reservations-${timestamp()}.db`
    );


  await sequelize.authenticate();


  /*
   * VACUUM INTO یک Snapshot مستقل
   * و Consistent از دیتابیس SQLite می‌سازد.
   */
  await sequelize.query(
    `VACUUM INTO '${escapeSqlitePath(destination)}';`
  );


  const backupDb =
    new Sequelize({
      dialect: "sqlite",
      storage: destination,
      logging: false,
    });


  try {
    const [rows] =
      await backupDb.query(
        "PRAGMA integrity_check;"
      );


    const integrity =
      rows?.[0]
        ? Object.values(
            rows[0]
          )[0]
        : null;


    if (integrity !== "ok") {
      throw new Error(
        `Integrity check failed: ${integrity}`
      );
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
      "✅ PRAGMA integrity_check = ok"
    );

  } finally {
    await backupDb.close();
  }
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
  })

  .finally(async () => {
    await sequelize.close();
  });
