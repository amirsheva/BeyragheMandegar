import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";


const BASE_URL =
  "http://localhost:4000";

let performance = null;


async function cleanup() {
  if (!performance) {
    return;
  }

  await Reservation.destroy({
    where: {
      performance_id:
        performance.id,
    },
  });

  await Performance.destroy({
    where: {
      id:
        performance.id,
    },
  });
}


async function sendReservation({
  name,
  phone,
  nationalId,
}) {
  const response =
    await fetch(
      `${BASE_URL}/api/reservations`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            name,
            phone,
            nationalId,
            count: 1,

            showtime: {
              showtimeId:
                performance.id,
            },
          }),
      }
    );


  let data = {};

  try {
    data =
      await response.json();
  } catch {}


  return {
    status:
      response.status,

    data,
  };
}


async function run() {
  console.log("");
  console.log(
    "🧪 تست همزمان آخرین صندلی"
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
        "1499/09/01",

      time:
        "10:10",

      capacity:
        1,

      remaining_capacity:
        1,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - OVERSELL",
    });


  console.log(
    `✅ اجرای تست ساخته شد: ID ${performance.id}`
  );

  console.log(
    "🚀 ارسال دو رزرو دقیقاً همزمان..."
  );


  /*
   * هر دو کد ملی زیر checksum معتبر دارند.
   * هدف این تست Validation نیست؛
   * هر دو درخواست باید تا Capacity Guard برسند.
   */
  const [
    first,
    second,
  ] = await Promise.all([
    sendReservation({
      name:
        "تست همزمان اول",

      phone:
        "09120000001",

      nationalId:
        "0084575948",
    }),

    sendReservation({
      name:
        "تست همزمان دوم",

      phone:
        "09120000002",

      nationalId:
        "0012345687",
    }),
  ]);


  console.log("");
  console.log(
    "نتیجه درخواست اول:",
    first.status,
    first.data
  );

  console.log(
    "نتیجه درخواست دوم:",
    second.status,
    second.data
  );


  await performance.reload();


  const confirmedReservations =
    await Reservation.findAll({
      where: {
        performance_id:
          performance.id,

        status:
          "confirmed",
      },
    });


  const reservedTickets =
    confirmedReservations.reduce(
      (total, item) =>
        total +
        Number(item.count || 0),
      0
    );


  console.log("");
  console.log(
    "────────────────────────────"
  );

  console.log(
    "Remaining capacity:",
    performance.remaining_capacity
  );

  console.log(
    "Confirmed reservations:",
    confirmedReservations.length
  );

  console.log(
    "Reserved tickets:",
    reservedTickets
  );


  const statuses = [
    first.status,
    second.status,
  ].sort(
    (a, b) =>
      a - b
  );


  const passed =
    statuses[0] === 201 &&
    statuses[1] === 409 &&
    Number(
      performance.remaining_capacity
    ) === 0 &&
    confirmedReservations.length === 1 &&
    reservedTickets === 1;


  console.log("");


  if (passed) {
    console.log(
      "✅ PASS — فقط یک رزرو موفق شد."
    );

    console.log(
      "✅ PASS — درخواست دوم با 409 رد شد."
    );

    console.log(
      "✅ PASS — Overbooking جلوگیری شد."
    );

    return;
  }


  console.error(
    "❌ FAIL — رفتار رزرو همزمان صحیح نیست."
  );


  if (
    first.status === 429 ||
    second.status === 429
  ) {
    console.error(
      "⚠️ Rate Limit فعال بوده؛ Backend را Restart کن و تست را دوباره اجرا کن."
    );
  }


  if (
    first.status === 400 ||
    second.status === 400
  ) {
    console.error(
      "⚠️ یکی از Payloadهای تست قبل از رسیدن به Capacity Guard رد شده است."
    );
  }


  if (
    first.status === 500 ||
    second.status === 500
  ) {
    console.error(
      "⚠️ یکی از درخواست‌ها 500 گرفته؛ Log سرور را بررسی کن."
    );
  }


  process.exitCode = 1;
}


run()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ TEST CRASHED:"
    );

    console.error(error);

    process.exitCode = 1;
  })

  .finally(async () => {
    try {
      await cleanup();

      console.log("");
      console.log(
        "🧹 داده تست پاک شد."
      );

    } catch (error) {
      console.error(
        "⚠️ Cleanup failed:",
        error
      );
    }

    await sequelize.close();
  });
