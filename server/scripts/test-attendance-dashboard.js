import {
  rm,
} from "node:fs/promises";


const db =
  ".test-data/attendance-dashboard-test.db";


for (
  const suffix of [
    "",
    "-wal",
    "-shm",
    "-journal",
  ]
) {
  await rm(
    db +
    suffix,
    {
      force:
        true,
    }
  ).catch(
    () => {}
  );
}


process.env.DB_STORAGE =
  db;

process.env.TICKET_QR_SECRET =
  "attendance-test-qr-secret-12345678901234567890";


const {
  sequelize,
  Production,
  Performance,
  Reservation,
} =
  await import(
    "../models.js"
  );


const {
  createTicketQrPayload,
  ensureCheckinSchema,
  getAdminCheckinSnapshot,
  getReservationQrTickets,
  listAdminCheckinPerformances,
  scanTicketQr,
} =
  await import(
    "../checkin-service.js"
  );


console.log("");
console.log(
  "📊 Attendance Dashboard Test"
);

console.log(
  "────────────────────────────────"
);


try {
  await sequelize.sync({
    force:
      true,
  });


  await ensureCheckinSchema();


  const production =
    await Production.create({
      title:
        "بیرق ماندگار",

      slug:
        "attendance-dashboard-test",

      status:
        "published",
    });


  const performance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1405/08/05",

      time:
        "20:00",

      capacity:
        10,

      remaining_capacity:
        8,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "شب پایانی",
    });


  const reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "تست داشبورد پذیرش",

      phone:
        "09121234567",

      national_id:
        "0013546789",

      count:
        2,

      tracking_code:
        "BM-ATTENDANCE-DASHBOARD-TEST",

      status:
        "confirmed",
    });


  const qrUnits =
    await getReservationQrTickets(
      reservation
    );


  if (
    qrUnits.length !==
    2
  ) {
    throw new Error(
      "Expected two admission tickets."
    );
  }


  const [
    rows,
  ] =
    await sequelize.query(
      `
        SELECT
          public_id,
          ordinal
        FROM admission_tickets
        WHERE reservation_id =
          ${Number(
            reservation.id
          )}
        ORDER BY ordinal ASC
      `
    );


  const firstPayload =
    createTicketQrPayload(
      rows[0].public_id
    );

  const secondPayload =
    createTicketQrPayload(
      rows[1].public_id
    );


  const first =
    await scanTicketQr({
      payload:
        firstPayload,

      performanceId:
        performance.id,

      checkerUsername:
        "checker1",
    });


  if (
    first.result !==
    "admitted"
  ) {
    throw new Error(
      "First checker admission failed."
    );
  }


  const second =
    await scanTicketQr({
      payload:
        secondPayload,

      performanceId:
        performance.id,

      checkerUsername:
        "checker2",
    });


  if (
    second.result !==
    "admitted"
  ) {
    throw new Error(
      "Second checker admission failed."
    );
  }


  const duplicate =
    await scanTicketQr({
      payload:
        firstPayload,

      performanceId:
        performance.id,

      checkerUsername:
        "checker2",
    });


  if (
    duplicate.result !==
    "already_used"
  ) {
    throw new Error(
      "Duplicate scan must be rejected."
    );
  }


  const performances =
    await listAdminCheckinPerformances();


  const dashboardItem =
    performances.find(
      (item) =>
        item.id ===
        performance.id
    );


  if (!dashboardItem) {
    throw new Error(
      "Performance missing from attendance dashboard."
    );
  }


  if (
    dashboardItem.stats.total !==
      2 ||
    dashboardItem.stats.admitted !==
      2 ||
    dashboardItem.stats.remaining !==
      0
  ) {
    throw new Error(
      "Attendance totals are incorrect."
    );
  }


  console.log(
    "✅ Attendance totals correct"
  );


  const snapshot =
    await getAdminCheckinSnapshot(
      performance.id,
      50
    );


  if (
    snapshot
      .checkerSummary
      .length !==
    2
  ) {
    throw new Error(
      "Expected two checker identities."
    );
  }


  const checker1 =
    snapshot
      .checkerSummary
      .find(
        (item) =>
          item.checkerUsername ===
          "checker1"
      );

  const checker2 =
    snapshot
      .checkerSummary
      .find(
        (item) =>
          item.checkerUsername ===
          "checker2"
      );


  if (
    !checker1 ||
    checker1.admitted !==
      1
  ) {
    throw new Error(
      "checker1 summary is incorrect."
    );
  }


  if (
    !checker2 ||
    checker2.admitted !==
      1 ||
    checker2.scans !==
      2
  ) {
    throw new Error(
      "checker2 summary is incorrect."
    );
  }


  console.log(
    "✅ Multi-checker activity summarized"
  );


  if (
    snapshot
      .resultSummary
      .admitted !==
      2 ||
    snapshot
      .resultSummary
      .already_used !==
      1
  ) {
    throw new Error(
      "Scan result summary is incorrect."
    );
  }


  console.log(
    "✅ Scan results summarized"
  );


  if (
    snapshot
      .recent
      .length !==
      3
  ) {
    throw new Error(
      "Recent scan audit is incomplete."
    );
  }


  console.log(
    "✅ Recent scan audit returned"
  );


  const serialized =
    JSON.stringify(
      snapshot
    );


  if (
    serialized.includes(
      "09121234567"
    ) ||
    serialized.includes(
      "0013546789"
    ) ||
    serialized.includes(
      "تست داشبورد پذیرش"
    )
  ) {
    throw new Error(
      "PII leaked into attendance snapshot."
    );
  }


  console.log(
    "✅ Attendance dashboard contains no customer PII"
  );


  console.log("");
  console.log(
    "✅ ATTENDANCE DASHBOARD TEST PASSED"
  );

} finally {
  await sequelize
    .close()
    .catch(
      () => {}
    );


  for (
    const suffix of [
      "",
      "-wal",
      "-shm",
      "-journal",
    ]
  ) {
    await rm(
      db +
      suffix,
      {
        force:
          true,
      }
    ).catch(
      () => {}
    );
  }


  console.log(
    "🧹 Attendance test database removed"
  );
}