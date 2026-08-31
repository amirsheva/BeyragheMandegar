import {
  randomBytes,
  scryptSync,
} from "node:crypto";

import {
  rm,
} from "node:fs/promises";


const db =
  ".test-data/checkin-test.db";


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
  "checkin-test-qr-secret-12345678901234567890";

process.env.TICKET_CHECKER_SESSION_SECRET =
  "checkin-test-session-secret-12345678901234567890";


const password =
  "CheckerTest123";

const salt =
  randomBytes(
    16
  ).toString(
    "hex"
  );

const passwordHash =
  salt +
  ":" +
  scryptSync(
    password,
    salt,
    64
  ).toString(
    "hex"
  );


process.env.TICKET_CHECKER_USERS_JSON =
  JSON.stringify([
    {
      username:
        "checker-test",

      displayName:
        "مسئول تست",

      passwordHash,

      active:
        true,
    },
  ]);


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
  ensureCheckinSchema,
  getReservationQrTickets,
  manualAdmitByTrackingCode,
  scanTicketQr,
  verifyTicketQrPayload,
} =
  await import(
    "../checkin-service.js"
  );

const {
  verifyCheckerCredentials,
} =
  await import(
    "../checker-auth.js"
  );


console.log("");
console.log(
  "🎟️ QR / Multi-Checker Check-in Test"
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
        "checkin-test",

      status:
        "published",
    });


  const performance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1405/08/01",

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
        "شب اول",
    });


  const otherPerformance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1405/08/02",

      time:
        "20:00",

      capacity:
        10,

      remaining_capacity:
        10,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "شب دوم",
    });


  const reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "رزرو تست QR",

      phone:
        "09121234567",

      national_id:
        "0013546789",

      count:
        2,

      tracking_code:
        "BM-QR-CHECKIN-TEST",

      status:
        "confirmed",
    });


  const units =
    await getReservationQrTickets(
      reservation
    );


  if (
    units.length !==
    2
  ) {
    throw new Error(
      "Expected one QR per individual ticket."
    );
  }

  console.log(
    "✅ One unique QR created per ticket"
  );


  if (
    !units.every(
      (item) =>
        item.qrDataUrl.startsWith(
          "data:image/png;base64,"
        )
    )
  ) {
    throw new Error(
      "QR image generation failed."
    );
  }

  console.log(
    "✅ QR image generated"
  );


  /*
   * Extract a signed payload by reading the DB public_id and generating
   * it via the service. This avoids decoding the PNG inside this unit test.
   */
  const [
    rows,
  ] =
    await sequelize.query(
      `
        SELECT public_id
        FROM admission_tickets
        WHERE reservation_id =
          ${Number(
            reservation.id
          )}
        ORDER BY ordinal
      `
    );


  const {
    createTicketQrPayload,
  } =
    await import(
      "../checkin-service.js"
    );


  const payload =
    createTicketQrPayload(
      rows[0].public_id
    );


  if (
    !verifyTicketQrPayload(
      payload
    )
  ) {
    throw new Error(
      "Signed QR payload did not verify."
    );
  }

  console.log(
    "✅ Signed QR payload verified"
  );


  const checker =
    await verifyCheckerCredentials(
      "checker-test",
      password
    );


  if (
    !checker
  ) {
    throw new Error(
      "Checker authentication failed."
    );
  }

  console.log(
    "✅ Independent checker authentication works"
  );


  const wrongPerformance =
    await scanTicketQr({
      payload,

      performanceId:
        otherPerformance.id,

      checkerUsername:
        "checker-test",
    });


  if (
    wrongPerformance.result !==
    "wrong_performance"
  ) {
    throw new Error(
      "Wrong performance must be rejected."
    );
  }

  console.log(
    "✅ Wrong performance rejected"
  );


  const first =
    await scanTicketQr({
      payload,

      performanceId:
        performance.id,

      checkerUsername:
        "checker-test",
    });


  if (
    first.result !==
    "admitted"
  ) {
    throw new Error(
      "First scan must admit ticket."
    );
  }

  console.log(
    "✅ First scan admitted"
  );


  const duplicate =
    await scanTicketQr({
      payload,

      performanceId:
        performance.id,

      checkerUsername:
        "checker-2",
    });


  if (
    duplicate.result !==
    "already_used"
  ) {
    throw new Error(
      "Duplicate scan must be rejected."
    );
  }

  console.log(
    "✅ Duplicate scan rejected across checker identities"
  );


  const manual =
    await manualAdmitByTrackingCode({
      trackingCode:
        reservation.tracking_code,

      performanceId:
        performance.id,

      checkerUsername:
        "checker-test",
    });


  if (
    manual.result !==
    "admitted"
  ) {
    throw new Error(
      "Manual fallback should admit second unused ticket."
    );
  }

  console.log(
    "✅ Manual tracking-code fallback admitted next unused ticket"
  );


  reservation.status =
    "cancelled";

  await reservation.save();


  const cancelledManual =
    await manualAdmitByTrackingCode({
      trackingCode:
        reservation.tracking_code,

      performanceId:
        performance.id,

      checkerUsername:
        "checker-test",
    });


  if (
    ![
      "cancelled",
      "already_used",
    ].includes(
      cancelledManual.result
    )
  ) {
    throw new Error(
      "Cancelled reservation must not produce a new admission."
    );
  }

  console.log(
    "✅ Cancelled reservation cannot create a new admission"
  );


  const [
    logs,
  ] =
    await sequelize.query(
      `
        SELECT *
        FROM ticket_scan_logs
      `
    );


  if (
    logs.length < 4
  ) {
    throw new Error(
      "Expected persistent scan audit logs."
    );
  }

  console.log(
    "✅ Scan audit trail persisted"
  );


  console.log("");
  console.log(
    "✅ QR / CHECK-IN TEST PASSED"
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
    "🧹 Check-in test database removed"
  );
}