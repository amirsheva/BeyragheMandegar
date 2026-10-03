import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";
import { spawnSync } from "node:child_process";
import { isEncryptedPii } from "../security/pii-crypto.js";

const BASE_URL =
  process.env.TEST_BASE_URL ||
  "http://localhost:4000";

let performance = null;

async function reserve({
  customerName,
  phone,
  nationalId,
  retried = false,
}) {
  let response = await fetch(
    `${BASE_URL}/api/reservations`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        name: customerName,
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

  // Exercise the real limiter without weakening production limits for tests.
  if (response.status === 429) {
    const retrySeconds = Number(response.headers.get("retry-after"));
    if (retried || !Number.isInteger(retrySeconds) || retrySeconds < 1 || retrySeconds > 65) {
      throw new Error("Unexpected reservation rate-limit retry interval.");
    }
    await new Promise(resolve => setTimeout(resolve, (retrySeconds + 1) * 1000));
    return reserve({ customerName, phone, nationalId, retried: true });
  }

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
    {
      name: "کد ملی حروفی همچنان نامعتبر است",
      phone: "09123456789",
      nationalId: "invalid",
      expected: 400,
    },
    {
      name: "کد ملی با ارقام یکسان نامعتبر است",
      phone: "09123456789",
      nationalId: "1111111111",
      expected: 400,
    },
    {
      name: "شماره همراه همچنان الزامی است",
      customerName: "تست Validation",
      nationalId: "0084575948",
      expected: 400,
    },
    {
      name: "حذف هر دو فیلد هویتی مجاز است",
      phone: "09123456789",
      expected: 201,
    },
    {
      name: "نام و کد ملی خالی مجاز است",
      customerName: "",
      phone: "09123456789",
      nationalId: "",
      expected: 201,
    },
    {
      name: "فیلدهای هویتی با فاصله خالی مجاز است",
      customerName: "   ",
      phone: "09123456789",
      nationalId: "   ",
      expected: 201,
    },
    {
      name: "نام بدون کد ملی مجاز است",
      customerName: "تست Validation",
      phone: "09123456789",
      expected: 201,
    },
    {
      name: "کد ملی معتبر بدون نام مجاز است",
      phone: "09123456789",
      nationalId: "0084575948",
      expected: 201,
    },
    {
      name: "رزرو با هر دو فیلد هویتی همچنان مجاز است",
      customerName: "تست Validation",
      phone: "09123456789",
      nationalId: "0084575948",
      expected: 201,
    },
  ];


  let failed = 0;
  let accepted = 0;

  for (const test of tests) {
    const result =
      await reserve(test);

    console.log("");
    console.log(
      `• ${test.name}`
    );

    console.log(
      "HTTP:",
      result.status
    );

    if (
      result.status ===
      test.expected
    ) {
      console.log(
        "✅ PASS"
      );

      if (test.expected === 201) {
        accepted++;
        const stored = await Reservation.findOne({
          where: {
            performance_id: performance.id,
            tracking_code: result.data.trackingCode,
          },
        });
        if (
          !stored ||
          stored.name !== String(test.customerName || "").trim() ||
          stored.national_id !== String(test.nationalId || "").trim() ||
          stored.phone !== test.phone
        ) {
          console.log("❌ Optional identity storage mismatch");
          failed++;
        }
        const [rawRows] = await sequelize.query(
          "SELECT phone, national_id FROM reservations WHERE id = :id",
          { replacements: { id: stored.id } }
        );
        if (!isEncryptedPii(rawRows[0].phone) || !isEncryptedPii(rawRows[0].national_id)) {
          console.log("❌ Optional identity encryption mismatch");
          failed++;
        }
      }
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
    reservations === accepted &&
    Number(
      performance.remaining_capacity
    ) === 20 - accepted
  ) {
    const verification = spawnSync(process.execPath, ["server/scripts/verify-pii-encryption.js"], {
      env: process.env,
      stdio: "inherit",
    });
    if (verification.status !== 0) {
      throw new Error("PII verification rejected optional identity fields.");
    }
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
