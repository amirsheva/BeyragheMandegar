import "dotenv/config";

import fs from "fs";
import path from "path";
import {
  QueryTypes,
} from "sequelize";

import {
  connect,
  getDbConfig,
  quoteIdent,
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


function getLatestBackup() {
  if (
    !fs.existsSync(
      backupDir
    )
  ) {
    return null;
  }


  const files =
    fs.readdirSync(
      backupDir
    )
      .filter(
        (name) =>
          /^reservations-.*\.dump$/.test(
            name
          )
      )
      .map((name) => {
        const filePath =
          path.join(
            backupDir,
            name
          );

        return {
          name,
          path: filePath,
          mtime:
            fs.statSync(
              filePath
            ).mtimeMs,
        };
      })
      .sort(
        (a, b) =>
          b.mtime - a.mtime
      );


  return files[0] || null;
}


async function run() {
  console.log("");
  console.log(
    "🧪 Postgres Restore Test"
  );

  console.log(
    "────────────────────────────"
  );


  const backup =
    getLatestBackup();


  if (!backup) {
    throw new Error(
      "هیچ Backupای پیدا نشد."
    );
  }


  console.log(
    `Backup: ${backup.name}`
  );


  const config =
    getDbConfig();

  const restoreConfig = {
    ...config,
    database:
      `${config.database}_restore_${Date.now()}`,
  };


  /*
   * Backup در یک دیتابیس موقت جدا بازیابی می‌شود؛
   * دیتابیس اصلی دست نمی‌خورد.
   * کاربر دیتابیس باید دسترسی CREATEDB داشته باشد.
   */
  const admin =
    connect(config);

  await admin.query(
    `CREATE DATABASE ${quoteIdent(restoreConfig.database)}`
  );


  let db = null;

  try {
    await runPgTool(
      "pg_restore",
      [
        "--no-owner",
        "--no-privileges",
        "--exit-on-error",
        "--dbname",
        restoreConfig.database,
      ],
      {
        config: restoreConfig,
        input: backup.path,
      }
    );

    console.log(
      "✅ pg_restore completed"
    );


    db =
      connect(restoreConfig);

    await db.authenticate();


    const tables =
      await db.query(
        `
          SELECT table_name AS name
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE'
        `,
        {
          type:
            QueryTypes.SELECT,
        }
      );


    const tableNames =
      new Set(
        tables.map(
          (item) =>
            item.name
        )
      );


    const requiredTables = [
      "productions",
      "performances",
      "reservations",
    ];


    for (
      const table
      of requiredTables
    ) {
      if (
        !tableNames.has(table)
      ) {
        throw new Error(
          `جدول ${table} در Backup وجود ندارد.`
        );
      }

      console.log(
        `✅ ${table} table`
      );
    }


    if (
      tableNames.has(
        "audit_logs"
      )
    ) {
      console.log(
        "✅ audit_logs table"
      );
    } else {
      console.log(
        "⚠️ audit_logs table هنوز در Backup وجود ندارد."
      );
    }


    const [
      productionCount,
      performanceCount,
      reservationCount,
    ] = await Promise.all([
      db.query(
        `
          SELECT COUNT(*) AS count
          FROM productions
        `,
        {
          type:
            QueryTypes.SELECT,
        }
      ),

      db.query(
        `
          SELECT COUNT(*) AS count
          FROM performances
        `,
        {
          type:
            QueryTypes.SELECT,
        }
      ),

      db.query(
        `
          SELECT COUNT(*) AS count
          FROM reservations
        `,
        {
          type:
            QueryTypes.SELECT,
        }
      ),
    ]);


    console.log("");
    console.log(
      "Production rows:",
      productionCount[0].count
    );

    console.log(
      "Performance rows:",
      performanceCount[0].count
    );

    console.log(
      "Reservation rows:",
      reservationCount[0].count
    );


    console.log("");
    console.log(
      "✅ RESTORE TEST PASSED"
    );

    console.log(
      "✅ Backup قابل بازشدن و بازیابی است."
    );

    console.log(
      "✅ دیتابیس اصلی تغییر نکرد."
    );

  } finally {
    await db?.close();

    await admin.query(
      `DROP DATABASE IF EXISTS ${quoteIdent(restoreConfig.database)}`
    );

    await admin.close();
  }
}


run().catch((error) => {
  console.error("");
  console.error(
    "❌ RESTORE TEST FAILED:"
  );

  console.error(
    error.message || error
  );

  process.exitCode = 1;
});
