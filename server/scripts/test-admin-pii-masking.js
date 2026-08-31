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

const TEST_PHONE = "09123456789";
const TEST_NATIONAL_ID = "0084575948";


async function cleanup() {
  if (!performance) return;

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


async function run() {
  console.log("");
  console.log(
    "🧪 تست PII Masking پنل ادمین"
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
      production_id:
        production.id,

      date:
        "1499/06/01",

      time:
        "08:08",

      capacity:
        10,

      remaining_capacity:
        9,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - PII MASKING",
    });


  reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "کاربر تست امنیت",

      phone:
        TEST_PHONE,

      national_id:
        TEST_NATIONAL_ID,

      count:
        1,

      tracking_code:
        `TEST-PII-${Date.now()}`,

      status:
        "confirmed",
    });


  const app = express();

  app.use(express.json());

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
      `http://127.0.0.1:${address.port}/api/admin/reservations`
    );


  const data =
    await response.json();


  console.log(
    "HTTP:",
    response.status
  );


  if (!Array.isArray(data)) {
    throw new Error(
      "خروجی Reservations آرایه نیست."
    );
  }


  const item =
    data.find(
      (row) =>
        Number(row.id) ===
        Number(reservation.id)
    );


  if (!item) {
    throw new Error(
      "Reservation تست در خروجی Admin پیدا نشد."
    );
  }


  console.log("");
  console.log(
    "Returned phone:",
    item.phone
  );

  console.log(
    "Returned national_id:",
    item.national_id
  );


  const rawPhoneExposed =
    String(item.phone) ===
    TEST_PHONE;

  const rawNationalIdExposed =
    String(item.national_id) ===
    TEST_NATIONAL_ID;


  console.log("");
  console.log(
    "Raw phone exposed:",
    rawPhoneExposed
  );

  console.log(
    "Raw national ID exposed:",
    rawNationalIdExposed
  );


  if (
    rawPhoneExposed ||
    rawNationalIdExposed
  ) {
    console.error("");
    console.error(
      "❌ FAIL — اطلاعات حساس کامل از Admin API خارج می‌شود."
    );

    process.exitCode = 1;

    return;
  }


  console.log("");
  console.log(
    "✅ PASS — شماره موبایل Mask شده است."
  );

  console.log(
    "✅ PASS — کد ملی Mask شده است."
  );

  console.log(
    "✅ PII MASKING PASSED"
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
