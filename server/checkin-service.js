import "dotenv/config";

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import QRCode
  from "qrcode";

import {
  QueryTypes,
} from "sequelize";

import {
  sequelize,
  Reservation,
  Performance,
  Production,
} from "./models.js";


const QR_VERSION =
  "BMT1";


function getQrSecret() {
  const secret =
    String(
      process.env.TICKET_QR_SECRET ||
      ""
    );

  if (
    secret.length < 32
  ) {
    const error =
      new Error(
        "TICKET_QR_SECRET must be at least 32 characters."
      );

    error.code =
      "QR_NOT_CONFIGURED";

    throw error;
  }

  return secret;
}


function safeEqual(
  left,
  right
) {
  const a =
    Buffer.from(
      String(left)
    );

  const b =
    Buffer.from(
      String(right)
    );

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  return timingSafeEqual(
    a,
    b
  );
}


function signPublicId(
  publicId
) {
  return createHmac(
    "sha256",
    getQrSecret()
  )
    .update(
      `${QR_VERSION}:${publicId}`
    )
    .digest(
      "base64url"
    );
}


export function createTicketQrPayload(
  publicId
) {
  const clean =
    String(
      publicId ||
      ""
    ).trim();

  if (!clean) {
    throw new Error(
      "Ticket public ID is required."
    );
  }

  return [
    QR_VERSION,
    clean,
    signPublicId(
      clean
    ),
  ].join(".");
}


export function verifyTicketQrPayload(
  payload
) {
  const parts =
    String(
      payload ||
      ""
    )
      .trim()
      .split(".");

  if (
    parts.length !== 3 ||
    parts[0] !==
      QR_VERSION
  ) {
    return null;
  }

  const [
    ,
    publicId,
    signature,
  ] =
    parts;

  if (
    !/^[0-9a-f-]{36}$/i.test(
      publicId
    )
  ) {
    return null;
  }

  const expected =
    signPublicId(
      publicId
    );

  if (
    !safeEqual(
      signature,
      expected
    )
  ) {
    return null;
  }

  return {
    publicId,
  };
}


export async function ensureCheckinSchema() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS admission_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      performance_id INTEGER NOT NULL,
      ordinal INTEGER NOT NULL,
      public_id TEXT NOT NULL UNIQUE,
      checked_in_at TEXT,
      checked_in_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reservation_id, ordinal)
    )
  `);


  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      idx_admission_tickets_performance
    ON admission_tickets (
      performance_id,
      checked_in_at
    )
  `);


  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ticket_scan_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      reservation_id INTEGER,
      performance_id INTEGER,
      checker_username TEXT NOT NULL,
      result TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'qr',
      scanned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);


  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      idx_ticket_scan_logs_performance
    ON ticket_scan_logs (
      performance_id,
      scanned_at
    )
  `);
}


async function ensureReservationUnits(
  reservation,
  {
    transaction,
  } = {}
) {
  const count =
    Math.max(
      0,
      Number(
        reservation.count ||
        0
      )
    );

  for (
    let ordinal = 1;
    ordinal <=
      count;
    ordinal++
  ) {
    await sequelize.query(
      `
        INSERT OR IGNORE INTO
          admission_tickets (
            reservation_id,
            performance_id,
            ordinal,
            public_id
          )
        VALUES (
          :reservationId,
          :performanceId,
          :ordinal,
          :publicId
        )
      `,
      {
        replacements: {
          reservationId:
            reservation.id,

          performanceId:
            reservation.performance_id,

          ordinal,

          publicId:
            randomUUID(),
        },

        transaction,
      }
    );
  }
}


export async function backfillAdmissionTickets() {
  await ensureCheckinSchema();

  const reservations =
    await Reservation.findAll({
      attributes: [
        "id",
        "performance_id",
        "count",
      ],
    });

  for (
    const reservation of
    reservations
  ) {
    await ensureReservationUnits(
      reservation
    );
  }

  return reservations.length;
}


async function getTicketRowsForReservation(
  reservationId,
  {
    transaction,
  } = {}
) {
  return sequelize.query(
    `
      SELECT
        id,
        reservation_id,
        performance_id,
        ordinal,
        public_id,
        checked_in_at,
        checked_in_by,
        created_at
      FROM admission_tickets
      WHERE reservation_id =
        :reservationId
      ORDER BY ordinal ASC
    `,
    {
      replacements: {
        reservationId,
      },

      type:
        QueryTypes.SELECT,

      transaction,
    }
  );
}


export async function getReservationQrTickets(
  reservation
) {
  await ensureCheckinSchema();

  await ensureReservationUnits(
    reservation
  );

  const rows =
    await getTicketRowsForReservation(
      reservation.id
    );

  return Promise.all(
    rows.map(
      async (
        row
      ) => {
        const payload =
          createTicketQrPayload(
            row.public_id
          );

        const qrDataUrl =
          await QRCode.toDataURL(
            payload,
            {
              width:
                280,

              margin:
                1,

              errorCorrectionLevel:
                "M",

              color: {
                dark:
                  "#17100e",

                light:
                  "#fffaf7",
              },
            }
          );

        return {
          ordinal:
            row.ordinal,

          qrDataUrl,

          checkedIn:
            Boolean(
              row.checked_in_at
            ),

          checkedInAt:
            row.checked_in_at ||
            null,
        };
      }
    )
  );
}


async function logScan(
  {
    ticketId,
    reservationId,
    performanceId,
    checkerUsername,
    result,
    source,
    transaction,
  }
) {
  await sequelize.query(
    `
      INSERT INTO
        ticket_scan_logs (
          ticket_id,
          reservation_id,
          performance_id,
          checker_username,
          result,
          source
        )
      VALUES (
        :ticketId,
        :reservationId,
        :performanceId,
        :checkerUsername,
        :result,
        :source
      )
    `,
    {
      replacements: {
        ticketId:
          ticketId ||
          null,

        reservationId:
          reservationId ||
          null,

        performanceId:
          performanceId ||
          null,

        checkerUsername,

        result,

        source:
          source ||
          "qr",
      },

      transaction,
    }
  );
}


async function loadOperationalTicket(
  {
    publicId,
    transaction,
  }
) {
  const rows =
    await sequelize.query(
      `
        SELECT
          t.id AS ticket_id,
          t.reservation_id,
          t.performance_id,
          t.ordinal,
          t.checked_in_at,
          t.checked_in_by,
          r.name AS holder_name,
          r.count AS reservation_count,
          r.status AS reservation_status,
          r.tracking_code,
          p.date,
          p.time,
          p.label,
          p.production_id
        FROM admission_tickets t
        JOIN reservations r
          ON r.id =
            t.reservation_id
        JOIN performances p
          ON p.id =
            t.performance_id
        WHERE t.public_id =
          :publicId
        LIMIT 1
      `,
      {
        replacements: {
          publicId,
        },

        type:
          QueryTypes.SELECT,

        transaction,
      }
    );

  return rows[0] ||
    null;
}


async function decorateOperationalTicket(
  row
) {
  if (!row) {
    return null;
  }

  const production =
    row.production_id
      ? await Production.findByPk(
          row.production_id
        )
      : null;

  return {
    ticketId:
      row.ticket_id,

    ordinal:
      row.ordinal,

    reservationId:
      row.reservation_id,

    reservationCount:
      row.reservation_count,

    holderName:
      row.holder_name,

    trackingCode:
      row.tracking_code,

    status:
      row.reservation_status,

    performance: {
      id:
        row.performance_id,

      date:
        row.date,

      time:
        row.time,

      label:
        row.label,

      productionTitle:
        production?.title ||
        null,
    },

    checkedInAt:
      row.checked_in_at ||
      null,

    checkedInBy:
      row.checked_in_by ||
      null,
  };
}


async function admitRow(
  {
    row,
    requestedPerformanceId,
    checkerUsername,
    source,
    transaction,
  }
) {
  const performanceId =
    Number(
      requestedPerformanceId
    );


  if (
    Number(
      row.performance_id
    ) !==
    performanceId
  ) {
    await logScan({
      ticketId:
        row.ticket_id,

      reservationId:
        row.reservation_id,

      performanceId,

      checkerUsername,
      result:
        "wrong_performance",
      source,
      transaction,
    });

    return {
      result:
        "wrong_performance",

      ticket:
        await decorateOperationalTicket(
          row
        ),
    };
  }


  if (
    row.reservation_status !==
    "confirmed"
  ) {
    await logScan({
      ticketId:
        row.ticket_id,

      reservationId:
        row.reservation_id,

      performanceId,

      checkerUsername,
      result:
        "cancelled",
      source,
      transaction,
    });

    return {
      result:
        "cancelled",

      ticket:
        await decorateOperationalTicket(
          row
        ),
    };
  }


  if (
    row.checked_in_at
  ) {
    await logScan({
      ticketId:
        row.ticket_id,

      reservationId:
        row.reservation_id,

      performanceId,

      checkerUsername,
      result:
        "already_used",
      source,
      transaction,
    });

    return {
      result:
        "already_used",

      ticket:
        await decorateOperationalTicket(
          row
        ),
    };
  }


  const now =
    new Date()
      .toISOString();


  await sequelize.query(
    `
      UPDATE admission_tickets
      SET
        checked_in_at =
          :checkedInAt,
        checked_in_by =
          :checkerUsername
      WHERE
        id =
          :ticketId
        AND
        checked_in_at IS NULL
    `,
    {
      replacements: {
        checkedInAt:
          now,

        checkerUsername,

        ticketId:
          row.ticket_id,
      },

      transaction,
    }
  );


  const refreshed =
    await loadOperationalTicket({
      publicId:
        row.public_id,

      transaction,
    });


  /*
   * Under IMMEDIATE transaction, another scanner cannot enter the
   * write section concurrently. This check also protects us if the
   * storage engine behavior changes later.
   */
  if (
    !refreshed ||
    refreshed.checked_in_at !==
      now ||
    refreshed.checked_in_by !==
      checkerUsername
  ) {
    await logScan({
      ticketId:
        row.ticket_id,

      reservationId:
        row.reservation_id,

      performanceId,

      checkerUsername,
      result:
        "already_used",
      source,
      transaction,
    });

    return {
      result:
        "already_used",

      ticket:
        await decorateOperationalTicket(
          refreshed ||
          row
        ),
    };
  }


  await logScan({
    ticketId:
      row.ticket_id,

    reservationId:
      row.reservation_id,

    performanceId,

    checkerUsername,
    result:
      "admitted",
    source,
    transaction,
  });


  return {
    result:
      "admitted",

    ticket:
      await decorateOperationalTicket(
        refreshed
      ),
  };
}


export async function scanTicketQr({
  payload,
  performanceId,
  checkerUsername,
}) {
  const verified =
    verifyTicketQrPayload(
      payload
    );

  if (!verified) {
    return {
      result:
        "invalid",
      ticket:
        null,
    };
  }


  const transaction =
    await sequelize.transaction({
      type:
        "IMMEDIATE",
    });


  try {
    const rows =
      await sequelize.query(
        `
          SELECT
            t.id AS ticket_id,
            t.public_id,
            t.reservation_id,
            t.performance_id,
            t.ordinal,
            t.checked_in_at,
            t.checked_in_by,
            r.name AS holder_name,
            r.count AS reservation_count,
            r.status AS reservation_status,
            r.tracking_code,
            p.date,
            p.time,
            p.label,
            p.production_id
          FROM admission_tickets t
          JOIN reservations r
            ON r.id =
              t.reservation_id
          JOIN performances p
            ON p.id =
              t.performance_id
          WHERE t.public_id =
            :publicId
          LIMIT 1
        `,
        {
          replacements: {
            publicId:
              verified.publicId,
          },

          type:
            QueryTypes.SELECT,

          transaction,
        }
      );


    const row =
      rows[0];


    if (!row) {
      await logScan({
        ticketId:
          null,

        reservationId:
          null,

        performanceId:
          Number(
            performanceId
          ) ||
          null,

        checkerUsername,
        result:
          "not_found",
        source:
          "qr",
        transaction,
      });

      await transaction.commit();

      return {
        result:
          "not_found",
        ticket:
          null,
      };
    }


    const output =
      await admitRow({
        row,

        requestedPerformanceId:
          performanceId,

        checkerUsername,

        source:
          "qr",

        transaction,
      });


    await transaction.commit();

    return output;

  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
}


export async function manualAdmitByTrackingCode({
  trackingCode,
  performanceId,
  checkerUsername,
}) {
  const code =
    String(
      trackingCode ||
      ""
    )
      .trim()
      .toUpperCase();


  if (
    !/^[A-Z0-9-]{6,80}$/.test(
      code
    )
  ) {
    return {
      result:
        "invalid",
      ticket:
        null,
    };
  }


  const transaction =
    await sequelize.transaction({
      type:
        "IMMEDIATE",
    });


  try {
    const reservation =
      await Reservation.findOne({
        where: {
          tracking_code:
            code,
        },

        transaction,
      });


    if (!reservation) {
      await transaction.commit();

      return {
        result:
          "not_found",
        ticket:
          null,
      };
    }


    await ensureReservationUnits(
      reservation,
      {
        transaction,
      }
    );


    const rows =
      await sequelize.query(
        `
          SELECT
            t.id AS ticket_id,
            t.public_id,
            t.reservation_id,
            t.performance_id,
            t.ordinal,
            t.checked_in_at,
            t.checked_in_by,
            r.name AS holder_name,
            r.count AS reservation_count,
            r.status AS reservation_status,
            r.tracking_code,
            p.date,
            p.time,
            p.label,
            p.production_id
          FROM admission_tickets t
          JOIN reservations r
            ON r.id =
              t.reservation_id
          JOIN performances p
            ON p.id =
              t.performance_id
          WHERE
            t.reservation_id =
              :reservationId
          ORDER BY
            CASE
              WHEN t.checked_in_at IS NULL
              THEN 0
              ELSE 1
            END,
            t.ordinal ASC
        `,
        {
          replacements: {
            reservationId:
              reservation.id,
          },

          type:
            QueryTypes.SELECT,

          transaction,
        }
      );


    const row =
      rows[0];


    if (!row) {
      await transaction.commit();

      return {
        result:
          "not_found",
        ticket:
          null,
      };
    }


    const output =
      await admitRow({
        row,

        requestedPerformanceId:
          performanceId,

        checkerUsername,

        source:
          "manual",

        transaction,
      });


    await transaction.commit();

    return output;

  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
}


export async function getCheckinStats(
  performanceId
) {
  const id =
    Number(
      performanceId
    );

  const rows =
    await sequelize.query(
      `
        SELECT
          COUNT(*) AS total_tickets,
          SUM(
            CASE
              WHEN t.checked_in_at
                IS NOT NULL
              THEN 1
              ELSE 0
            END
          ) AS admitted_tickets
        FROM admission_tickets t
        JOIN reservations r
          ON r.id =
            t.reservation_id
        WHERE
          t.performance_id =
            :performanceId
          AND
          r.status =
            'confirmed'
      `,
      {
        replacements: {
          performanceId:
            id,
        },

        type:
          QueryTypes.SELECT,
      }
    );

  const total =
    Number(
      rows[0]
        ?.total_tickets ||
      0
    );

  const admitted =
    Number(
      rows[0]
        ?.admitted_tickets ||
      0
    );

  return {
    total,
    admitted,
    remaining:
      Math.max(
        0,
        total -
        admitted
      ),
  };
}


export async function listCheckerPerformances() {
  const items =
    await Performance.findAll({
      include: [
        {
          model:
            Production,

          as:
            "production",

          attributes: [
            "id",
            "title",
          ],
        },
      ],

      where: {
        status:
          "active",
      },

      order: [
        [
          "date",
          "ASC",
        ],
        [
          "time",
          "ASC",
        ],
      ],
    });


  const output =
    [];

  for (
    const item of items
  ) {
    await backfillPerformanceTickets(
      item.id
    );

    output.push({
      id:
        item.id,

      label:
        item.label,

      date:
        item.date,

      time:
        item.time,

      productionTitle:
        item.production
          ?.title ||
        null,

      stats:
        await getCheckinStats(
          item.id
        ),
    });
  }

  return output;
}


async function backfillPerformanceTickets(
  performanceId
) {
  const reservations =
    await Reservation.findAll({
      where: {
        performance_id:
          performanceId,
      },
    });

  for (
    const reservation of
    reservations
  ) {
    await ensureReservationUnits(
      reservation
    );
  }
}


export async function getRecentScans(
  performanceId,
  limit = 12
) {
  const safeLimit =
    Math.min(
      50,
      Math.max(
        1,
        Number(
          limit ||
          12
        )
      )
    );

  return sequelize.query(
    `
      SELECT
        id,
        ticket_id,
        reservation_id,
        performance_id,
        checker_username,
        result,
        source,
        scanned_at
      FROM ticket_scan_logs
      WHERE performance_id =
        :performanceId
      ORDER BY id DESC
      LIMIT ${safeLimit}
    `,
    {
      replacements: {
        performanceId:
          Number(
            performanceId
          ),
      },

      type:
        QueryTypes.SELECT,
    }
  );
}

/* ===== ADMIN_ATTENDANCE_DASHBOARD_V1 START ===== */


export async function listAdminCheckinPerformances() {
  await ensureCheckinSchema();
  await backfillAdmissionTickets();


  const items =
    await Performance.findAll({
      include: [
        {
          model:
            Production,

          as:
            "production",

          attributes: [
            "id",
            "title",
          ],
        },
      ],

      order: [
        [
          "date",
          "ASC",
        ],
        [
          "time",
          "ASC",
        ],
      ],
    });


  const output =
    [];


  for (
    const item of items
  ) {
    const stats =
      await getCheckinStats(
        item.id
      );


    output.push({
      id:
        item.id,

      label:
        item.label,

      date:
        item.date,

      time:
        item.time,

      status:
        item.status,

      bookingEnabled:
        item.booking_enabled,

      productionTitle:
        item.production
          ?.title ||
        null,

      stats,
    });
  }


  return output;
}


export async function getAdminCheckinSnapshot(
  performanceId,
  recentLimit = 50
) {
  await ensureCheckinSchema();


  const id =
    Number(
      performanceId
    );


  if (
    !Number.isInteger(
      id
    ) ||
    id < 1
  ) {
    const error =
      new Error(
        "Performance ID is invalid."
      );

    error.code =
      "INVALID_PERFORMANCE";

    throw error;
  }


  await backfillPerformanceTickets(
    id
  );


  const stats =
    await getCheckinStats(
      id
    );


  const recent =
    await getRecentScans(
      id,
      recentLimit
    );


  const checkerRows =
    await sequelize.query(
      `
        SELECT
          checker_username,
          COUNT(*) AS scans,
          SUM(
            CASE
              WHEN result =
                'admitted'
              THEN 1
              ELSE 0
            END
          ) AS admitted,
          MAX(scanned_at) AS last_scan
        FROM ticket_scan_logs
        WHERE performance_id =
          :performanceId
        GROUP BY checker_username
        ORDER BY
          admitted DESC,
          scans DESC,
          checker_username ASC
      `,
      {
        replacements: {
          performanceId:
            id,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const resultRows =
    await sequelize.query(
      `
        SELECT
          result,
          COUNT(*) AS count
        FROM ticket_scan_logs
        WHERE performance_id =
          :performanceId
        GROUP BY result
      `,
      {
        replacements: {
          performanceId:
            id,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const checkerSummary =
    checkerRows.map(
      (row) => ({
        checkerUsername:
          row.checker_username,

        scans:
          Number(
            row.scans ||
            0
          ),

        admitted:
          Number(
            row.admitted ||
            0
          ),

        lastScan:
          row.last_scan ||
          null,
      })
    );


  const resultSummary =
    resultRows.reduce(
      (
        output,
        row
      ) => {
        output[
          row.result
        ] =
          Number(
            row.count ||
            0
          );

        return output;
      },
      {}
    );


  return {
    stats,
    recent,
    checkerSummary,
    resultSummary,
  };
}


/* ===== ADMIN_ATTENDANCE_DASHBOARD_V1 END ===== */
