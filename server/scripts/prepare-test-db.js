import "../sms/models.js";

import {
  sequelize,
  Production,
} from "../models.js";


async function run() {
  /*
   * sync({ force: true }) همه جدول‌ها را Drop می‌کند؛
   * فقط روی دیتابیس‌هایی که نامشان به _test ختم می‌شود.
   */
  if (
    !process.env.DB_NAME ||
    !process.env.DB_NAME.endsWith(
      "_test"
    )
  ) {
    throw new Error(
      "Refusing to prepare a non-test database."
    );
  }

  await sequelize.sync({
    force: true,
  });

  await Production.create({
    title:
      "بیرق ماندگار — تست خودکار",

    slug:
      "beyragh-ci-test",

    subtitle:
      "Automated Test Production",

    status:
      "published",
  });

  console.log(
    "✅ Isolated test database prepared."
  );
}


run()
  .catch((error) => {
    console.error(
      "❌ Test DB preparation failed:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });