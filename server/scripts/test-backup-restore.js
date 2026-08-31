import "dotenv/config";

import fs from "fs";
import os from "os";
import path from "path";
import {
  Sequelize,
  QueryTypes,
} from "sequelize";


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
          /^reservations-.*\.db$/.test(
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
    "🧪 SQLite Restore Test"
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


  const restorePath =
    path.join(
      os.tmpdir(),
      `beyragh-restore-test-${Date.now()}.db`
    );


  fs.copyFileSync(
    backup.path,
    restorePath
  );


  const db =
    new Sequelize({
      dialect: "sqlite",
      storage: restorePath,
      logging: false,
    });


  try {
    await db.authenticate();


    const [integrityRows] =
      await db.query(
        "PRAGMA integrity_check;"
      );


    const integrity =
      integrityRows?.[0]
        ? Object.values(
            integrityRows[0]
          )[0]
        : null;


    console.log(
      "Integrity:",
      integrity
    );


    if (integrity !== "ok") {
      throw new Error(
        "Restore database integrity failed."
      );
    }


    const tables =
      await db.query(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
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
    await db.close();

    if (
      fs.existsSync(
        restorePath
      )
    ) {
      fs.unlinkSync(
        restorePath
      );
    }
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
