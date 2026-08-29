import express from "express";

import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";

import adminApiRouter from "../admin-api.js";


let production = null;
let performance = null;
let reservation = null;
let server = null;


async function cleanup() {
  if (!production) return;

  const performances =
    await Performance.findAll({
      where: {
        production_id: production.id,
      },
    });

  for (const item of performances) {
    await Reservation.destroy({
      where: {
        performance_id: item.id,
      },
    });

    await item.destroy();
  }

  const existingProduction =
    await Production.findByPk(
      production.id
    );

  if (existingProduction) {
    await existingProduction.destroy();
  }
}


async function run() {
  console.log("");
  console.log(
    "🧪 تست محافظت از حذف نمایش"
  );

  console.log(
    "────────────────────────────"
  );


  production =
    await Production.create({
      title:
        "TEST - PRODUCTION DELETE GUARD",

      slug:
        `test-production-delete-${Date.now()}`,

      subtitle:
        "Temporary test",

      status:
        "published",
    });


  performance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1499/04/01",

      time:
        "06:06",

      capacity:
        10,

      remaining_capacity:
        9,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - PRODUCTION DELETE GUARD",
    });


  reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "تست محافظت حذف نمایش",

      phone:
        "09120000006",

      national_id:
        "0012345683",

      count:
        1,

      tracking_code:
        `TEST-PROD-${Date.now()}`,

      status:
        "confirmed",
    });


  console.log(
    `✅ Production ID: ${production.id}`
  );

  console.log(
    `✅ Performance ID: ${performance.id}`
  );

  console.log(
    `✅ Reservation ID: ${reservation.id}`
  );


  const app = express();

  app.use(
    express.json()
  );

  app.use(
    "/api/admin",
    adminApiRouter
  );


  server =
    await new Promise(
      (resolve) => {
        const instance =
          app.listen(
            0,
            "127.0.0.1",
            () =>
              resolve(instance)
          );
      }
    );


  const address =
    server.address();


  const response =
    await fetch(
      `http://127.0.0.1:${address.port}/api/admin/shows/${production.id}`,
      {
        method:
          "DELETE",
      }
    );


  let data = {};

  try {
    data =
      await response.json();
  } catch {}


  console.log("");
  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "Response:",
    data
  );


  const productionExists =
    await Production.findByPk(
      production.id
    );

  const performanceExists =
    await Performance.findByPk(
      performance.id
    );

  const reservationExists =
    await Reservation.findByPk(
      reservation.id
    );


  console.log("");
  console.log(
    "Production exists:",
    Boolean(productionExists)
  );

  console.log(
    "Performance exists:",
    Boolean(performanceExists)
  );

  console.log(
    "Reservation exists:",
    Boolean(reservationExists)
  );


  const passed =
    response.status === 409 &&
    Boolean(productionExists) &&
    Boolean(performanceExists) &&
    Boolean(reservationExists);


  console.log("");


  if (!passed) {
    console.error(
      "❌ FAIL — حذف Production ایمن نیست."
    );

    if (
      !productionExists ||
      !performanceExists ||
      !reservationExists
    ) {
      console.error(
        "🚨 CRITICAL — حذف نمایش باعث حذف داده رزرو شده است."
      );
    }

    process.exitCode = 1;

    return;
  }


  console.log(
    "✅ PASS — نمایش دارای رزرو حذف نشد."
  );

  console.log(
    "✅ PASS — Performance محفوظ ماند."
  );

  console.log(
    "✅ PASS — Reservation محفوظ ماند."
  );
}


run()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ TEST FAILED:"
    );

    console.error(error);

    process.exitCode = 1;
  })

  .finally(async () => {
    try {
      if (server) {
        await new Promise(
          (resolve) =>
            server.close(resolve)
        );
      }

      await cleanup();

      console.log("");
      console.log(
        "🧹 داده‌های تست پاک شدند."
      );
    } catch (error) {
      console.error(
        "⚠️ Cleanup failed:",
        error
      );
    }

    await sequelize.close();
  });
