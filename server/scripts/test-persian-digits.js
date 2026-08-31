import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";


const BASE_URL =
  process.env.TEST_BASE_URL ||
  "http://127.0.0.1:4017";


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


async function run() {
  console.log("");
  console.log(
    "🧪 Persian / Arabic digit normalization"
  );

  const production =
    await Production.findOne({
      order: [
        ["id", "ASC"],
      ],
    });

  if (!production) {
    throw new Error(
      "Test Production not found."
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
        5,

      remaining_capacity:
        5,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - PERSIAN DIGITS",
    });


  const response =
    await fetch(
      `${BASE_URL}/api/reservations`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            name:
              "تست اعداد فارسی",

            phone:
              "۰۹۱۲۳۴۵۶۷۸۹",

            nationalId:
              "۰۰۸۴۵۷۵۹۴۸",

            count:
              1,

            showtime: {
              showtimeId:
                performance.id,
            },
          }),
      }
    );


  const data =
    await response.json();


  if (
    response.status !== 201 ||
    !data.trackingCode
  ) {
    throw new Error(
      `Expected HTTP 201, got ${response.status}: ${JSON.stringify(data)}`
    );
  }


  const reservation =
    await Reservation.findOne({
      where: {
        performance_id:
          performance.id,
      },
    });


  if (!reservation) {
    throw new Error(
      "Reservation was not stored."
    );
  }


  if (
    reservation.phone !==
    "09123456789"
  ) {
    throw new Error(
      `Phone normalization failed: ${reservation.phone}`
    );
  }


  if (
    reservation.national_id !==
    "0084575948"
  ) {
    throw new Error(
      `National ID normalization failed: ${reservation.national_id}`
    );
  }


  console.log(
    "✅ Persian phone digits normalized."
  );

  console.log(
    "✅ Persian national ID digits normalized."
  );

  console.log(
    "✅ Reservation accepted."
  );
}


run()
  .catch((error) => {
    console.error(
      "❌ Persian digit test failed:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await sequelize.close();
  });