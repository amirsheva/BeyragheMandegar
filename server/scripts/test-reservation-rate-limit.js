const URL =
  "http://localhost:4000/api/reservations";

async function send(index) {
  const response = await fetch(URL, {
    method: "POST",

    headers: {
      "Content-Type":
        "application/json",
    },

    /*
     * عمداً Payload نامعتبر است
     * تا هیچ Reservationای ساخته نشود.
     */
    body: JSON.stringify({
      name: "Rate Limit Test",
      phone: "123",
      nationalId: "123",
      count: 1,
      showtime: {
        showtimeId: 999999,
      },
    }),
  });

  let data = {};

  try {
    data = await response.json();
  } catch {}

  return {
    index,
    status: response.status,
    data,
  };
}


async function run() {
  console.log("");
  console.log(
    "🧪 تست Reservation Rate Limit"
  );

  console.log(
    "────────────────────────────"
  );

  const results = [];

  for (
    let index = 1;
    index <= 11;
    index += 1
  ) {
    const result =
      await send(index);

    results.push(result);

    console.log(
      `Request ${index}:`,
      result.status
    );
  }

  const limited =
    results.filter(
      (item) =>
        item.status === 429
    );

  console.log("");
  console.log(
    "429 responses:",
    limited.length
  );

  if (
    results[9]?.status !== 429 &&
    results[10]?.status === 429
  ) {
    console.log("");
    console.log(
      "✅ PASS — درخواست یازدهم Block شد."
    );

    return;
  }

  if (limited.length > 0) {
    console.log("");
    console.log(
      "✅ PASS — Rate Limit فعال است."
    );

    return;
  }

  console.error("");
  console.error(
    "❌ FAIL — Rate Limit اعمال نشد."
  );

  process.exitCode = 1;
}


run().catch((error) => {
  console.error(
    "❌ Test crashed:",
    error
  );

  process.exitCode = 1;
});
