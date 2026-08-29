import express from "express";

import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";

import adminApiRouter from "../admin-api.js";


let performance = null;
let reservation = null;
let server = null;


async function cleanup() {
  if (performance) {
    await Reservation.destroy({
      where: {
        performance_id: performance.id,
      },
    });

    await Performance.destroy({
      where: {
        id: performance.id,
      },
    });
  }
}


async function run() {
  console.log("");
  console.log(
    "🧪 تست محافظت از حذف اجرا"
  );
  console.log(
    "────────────────────────────"
  );


  const production =
    await Production.findOne({
      order: [["id", "ASC"]],
    });


  if (!production) {
    throw new Error(
      "Production پیدا نشد."
    );
  }


  performance =
    await Performance.create({
      production_id: production.id,
      date: "1499/03/01",
      time: "05:55",
      capacity: 10,
      remaining_capacity: 9,
      status: "active",
      booking_enabled: true,
      label: "TEST - DELETE GUARD",
    });


  reservation =
    await Reservation.create({
      performance_id: performance.id,
      name: "تست Delete Guard",
      phone: "09120000005",
      national_id: "0012345682",
      count: 1,
      tracking_code:
        `TEST-DELETE-${Date.now()}`,
      status: "confirmed",
    });


  console.log(
    `✅ Performance ID: ${performance.id}`
  );

  console.log(
    `✅ Reservation ID: ${reservation.id}`
  );


  const app = express();

  app.use(express.json());

  app.use(
    "/api/admin",
    adminApiRouter
  );


  server = await new Promise(
    (resolve) => {
      const instance = app.listen(
        0,
        "127.0.0.1",
        () => resolve(instance)
      );
    }
  );


  const address =
    server.address();

  const response = await fetch(
    `http://127.0.0.1:${address.port}/api/admin/performances/${performance.id}`,
    {
      method: "DELETE",
    }
  );


  const data =
    await response.json();


  console.log("");
  console.log(
    "HTTP:",
    response.status
  );

  console.log(
    "Response:",
    data
  );


  const performanceStillExists =
    await Performance.findByPk(
      performance.id
    );


  const reservationStillExists =
    await Reservation.findByPk(
      reservation.id
    );


  console.log("");
  console.log(
    "Performance exists:",
    Boolean(performanceStillExists)
  );

  console.log(
    "Reservation exists:",
    Boolean(reservationStillExists)
  );


  const passed =
    response.status === 409 &&
    Boolean(performanceStillExists) &&
    Boolean(reservationStillExists);


  if (!passed) {
    throw new Error(
      "Delete Guard صحیح عمل نکرد."
    );
  }


  console.log("");
  console.log(
    "✅ PASS — اجرای دارای رزرو حذف نشد."
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
