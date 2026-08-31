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
let blockerReservation = null;
let server = null;


function line() {
  console.log(
    "────────────────────────────────"
  );
}


async function patchStatus(
  baseUrl,
  reservationId,
  status
) {
  const response = await fetch(
    `${baseUrl}/api/admin/reservations/${reservationId}/status`,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        status,
      }),
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {}

  return {
    status: response.status,
    data,
  };
}


async function getState() {
  await performance.reload();
  await reservation.reload();

  return {
    reservationStatus:
      reservation.status,

    remainingCapacity:
      Number(
        performance.remaining_capacity
      ),
  };
}


async function cleanup() {
  if (performance) {
    await Reservation.destroy({
      where: {
        performance_id:
          performance.id,
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
    "🧪 تست Cancel / Restore رزرو"
  );

  line();


  const production =
    await Production.findOne({
      order: [["id", "ASC"]],
    });


  if (!production) {
    throw new Error(
      "هیچ Productionای پیدا نشد."
    );
  }


  /*
   * ظرفیت کل = 2
   *
   * یک رزرو Confirmed با count=1 داریم،
   * بنابراین remaining باید 1 باشد.
   */
  performance =
    await Performance.create({
      production_id:
        production.id,

      date: "1499/02/01",

      time: "04:44",

      capacity: 2,

      remaining_capacity: 1,

      status: "active",

      booking_enabled: true,

      label:
        "TEST - CANCEL RESTORE",
    });


  reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "تست لغو و بازیابی",

      phone:
        "09120000003",

      national_id:
        "0012345680",

      count: 1,

      tracking_code:
        `TEST-CR-${Date.now()}`,

      status:
        "confirmed",
    });


  console.log(
    `✅ Performance ID: ${performance.id}`
  );

  console.log(
    `✅ Reservation ID: ${reservation.id}`
  );


  // ---------------------------------
  // Local temporary Express instance
  // ---------------------------------

  const app = express();

  app.use(express.json());

  /*
   * عمداً فقط Router واقعی Admin را
   * برای تست Business Logic mount می‌کنیم.
   *
   * هیچ Authenticationای در برنامه اصلی
   * تغییر نمی‌کند.
   */
  app.use(
    "/api/admin",
    adminApiRouter
  );


  server = await new Promise(
    (resolve) => {
      const instance = app.listen(
        0,
        "127.0.0.1",

        () => {
          resolve(instance);
        }
      );
    }
  );


  const address =
    server.address();

  const baseUrl =
    `http://127.0.0.1:${address.port}`;


  // ================================
  // TEST 1 — CANCEL
  // ================================

  console.log("");
  console.log(
    "1️⃣ Cancel رزرو..."
  );


  const cancelResult =
    await patchStatus(
      baseUrl,
      reservation.id,
      "cancelled"
    );


  const afterCancel =
    await getState();


  console.log(
  "HTTP:",
  cancelResult.status,
  cancelResult.data
);

  console.log(
    "Reservation:",
    afterCancel.reservationStatus
  );

  console.log(
    "Remaining:",
    afterCancel.remainingCapacity
  );


  const cancelPassed =
    cancelResult.status === 200 &&
    afterCancel.reservationStatus ===
      "cancelled" &&
    afterCancel.remainingCapacity ===
      2;


  if (!cancelPassed) {
    throw new Error(
      "Cancel ظرفیت را صحیح برنگرداند."
    );
  }


  console.log(
    "✅ Cancel PASS — ظرفیت 1 → 2"
  );


  // ================================
  // TEST 2 — RESTORE
  // ================================

  console.log("");
  console.log(
    "2️⃣ Restore رزرو..."
  );


  const restoreResult =
    await patchStatus(
      baseUrl,
      reservation.id,
      "confirmed"
    );


  const afterRestore =
    await getState();


  console.log(
    "HTTP:",
    restoreResult.status
  );

  console.log(
    "Reservation:",
    afterRestore.reservationStatus
  );

  console.log(
    "Remaining:",
    afterRestore.remainingCapacity
  );


  const restorePassed =
    restoreResult.status === 200 &&
    afterRestore.reservationStatus ===
      "confirmed" &&
    afterRestore.remainingCapacity ===
      1;


  if (!restorePassed) {
    throw new Error(
      "Restore ظرفیت را صحیح کم نکرد."
    );
  }


  console.log(
    "✅ Restore PASS — ظرفیت 2 → 1"
  );


  // ================================
  // TEST 3 — IDEMPOTENCY
  // ================================

  console.log("");
  console.log(
    "3️⃣ Restore دوباره همان رزرو..."
  );


  const duplicateRestore =
    await patchStatus(
      baseUrl,
      reservation.id,
      "confirmed"
    );


  const afterDuplicate =
    await getState();


  console.log(
    "HTTP:",
    duplicateRestore.status
  );

  console.log(
    "Remaining:",
    afterDuplicate.remainingCapacity
  );


  if (
    duplicateRestore.status !== 200 ||
    afterDuplicate.remainingCapacity !==
      1
  ) {
    throw new Error(
      "Restore تکراری ظرفیت را دوباره کم کرد."
    );
  }


  console.log(
    "✅ Idempotency PASS"
  );


  // ================================
  // TEST 4 — RESTORE WITHOUT CAPACITY
  // ================================

  console.log("");
  console.log(
    "4️⃣ Restore بدون ظرفیت..."
  );


  // original reservation را cancel می‌کنیم.
  await patchStatus(
    baseUrl,
    reservation.id,
    "cancelled"
  );


  await performance.reload();


  /*
   * حالا remaining=2 است.
   * یک رزرو blocker با 2 بلیت ایجاد می‌کنیم.
   */
  blockerReservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "Blocker Test",

      phone:
        "09120000004",

      national_id:
        "0012345681",

      count: 2,

      tracking_code:
        `TEST-BLOCK-${Date.now()}`,

      status:
        "confirmed",
    });


  performance.remaining_capacity = 0;

  await performance.save();


  const blockedRestore =
    await patchStatus(
      baseUrl,
      reservation.id,
      "confirmed"
    );


  const blockedState =
    await getState();


  console.log(
    "HTTP:",
    blockedRestore.status
  );

  console.log(
    "Reservation:",
    blockedState.reservationStatus
  );

  console.log(
    "Remaining:",
    blockedState.remainingCapacity
  );


  const blockedPassed =
    blockedRestore.status === 409 &&
    blockedState.reservationStatus ===
      "cancelled" &&
    blockedState.remainingCapacity ===
      0;


  if (!blockedPassed) {
    throw new Error(
      "Restore بدون ظرفیت باید 409 می‌داد."
    );
  }


  console.log(
    "✅ Capacity Guard PASS — Restore با ظرفیت صفر رد شد."
  );


  console.log("");
  line();

  console.log(
    "✅ ALL CANCEL / RESTORE TESTS PASSED"
  );

  line();
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
