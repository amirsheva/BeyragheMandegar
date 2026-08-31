import {
  sequelize,
} from "../models.js";

async function run() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      cover TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      published_at DATETIME,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);

  console.log(
    "✅ news table ready"
  );
}

run()
  .then(async () => {
    await sequelize.close();
  })
  .catch(async (error) => {
    console.error(
      "❌ News migration failed:",
      error
    );

    await sequelize.close();
    process.exitCode = 1;
  });
