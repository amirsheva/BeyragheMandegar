import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";

const BASE_URL =
  process.env.TEST_BASE_URL ||
  "http://localhost:4000";

let performance = null;

async function reserve({
  phone,
  nationalId,
}) {
  const response = await fetch(
    `${BASE_URL}/api/reservations`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        name: "تست Validation",
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
    data = await response.json();
  } catch {}

  return {
    status: response.status,
    data,
  };
}

async function cleanup() {
  if (!performance) return;

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

async function run() {
  console.log("");
  console.log(
    "🧪 تست Validation رزرو"
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
        "1499/05/01",

      time:
        "07:07",

      capacity:
        20,

      remaining_capacity:
        20,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - VALIDATION",
    });

  console.log(
    `✅ Performance ID: ${performance.id}`
  );


  const tests = [
    {
      name:
        "موبایل خیلی کوتاه",
      phone:
        "123",
      nationalId:
        "0084575948",
      expected:
        400,
    },

    {
      name:
        "موبایل حروفی",
      phone:
        "abcdefghijk",
      nationalId:
        "0084575948",
      expected:
        400,
    },

    {
      name:
        "کد ملی کوتاه",
      phone:
        "09123456789",
      nationalId:
        "123",
      expected:
        400,
    },

    {
      name:
        "کد ملی نامعتبر",
      phone:
        "09123456789",
      nationalId:
        "0012345678",
      expected:
        400,
    },
  ];


  let failed = 0;

  for (const test of tests) {
    const result =
      await reserve(test);

    console.log("");
    console.log(
      `• ${test.name}`
    );

    console.log(
      "HTTP:",
      result.status,
      result.data
    );

    if (
      result.status ===
      test.expected
    ) {
      console.log(
        "✅ PASS"
      );
    } else {
      console.log(
        `❌ FAIL — انتظار ${test.expected} داشتیم`
      );

      failed++;
    }
  }


  await performance.reload();

  const reservations =
    await Reservation.count({
      where: {
        performance_id:
          performance.id,
      },
    });


  console.log("");
  console.log(
    "────────────────────────────"
  );

  console.log(
    "Reservations created:",
    reservations
  );

  console.log(
    "Remaining capacity:",
    performance.remaining_capacity
  );


  if (
    failed === 0 &&
    reservations === 0 &&
    Number(
      performance.remaining_capacity
    ) === 20
  ) {
    console.log("");
    console.log(
      "✅ ALL VALIDATION TESTS PASSED"
    );

    return;
  }


  console.log("");
  console.log(
    "❌ VALIDATION NEEDS FIX"
  );

  process.exitCode = 1;
}


run()
  .catch((error) => {
    console.error(
      "❌ Test crashed:",
      error
    );

    process.exitCode = 1;
  })

  .finally(async () => {
    await cleanup();

    console.log("");
    console.log(
      "🧹 داده‌های تست پاک شدند."
    );

    await sequelize.close();
  });
