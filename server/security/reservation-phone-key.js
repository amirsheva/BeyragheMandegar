import {
  createHmac,
} from "crypto";

import {
  QueryTypes,
} from "sequelize";

import {
  normalizePhone,
} from "../otp-service.js";


/*
 * RESERVATION_ONE_PER_PHONE_V1
 *
 * Each phone number may reserve only once, ever
 * (cancelled reservations still count).
 *
 * reservations.phone is encrypted with a random IV,
 * so it cannot be compared in SQL. phone_key is a
 * deterministic HMAC of the normalized phone, backed
 * by a UNIQUE index so concurrent requests cannot
 * both succeed.
 */

const SECRET_NAME =
  "RESERVATION_PHONE_SECRET";


function getSecret() {
  const value =
    String(
      process.env[SECRET_NAME] ||
      ""
    ).trim();

  if (
    value.length < 32
  ) {
    throw new Error(
      `${SECRET_NAME} must be at least 32 characters`
    );
  }

  return value;
}


function assertReservationPhoneKeyConfigured() {
  getSecret();
}


function reservationPhoneKey(
  phone
) {
  return createHmac(
    "sha256",
    getSecret()
  )
    .update(
      `reservation-phone:${normalizePhone(phone)}`,
      "utf8"
    )
    .digest(
      "hex"
    );
}


function isPhoneKeyConflict(
  error
) {
  return (
    error?.name ===
      "SequelizeUniqueConstraintError" &&
    (
      error.fields?.phone_key !== undefined ||
      error.errors?.some(
        (item) =>
          item?.path ===
          "phone_key"
      ) ||
      String(
        error.parent?.constraint ||
        ""
      ) ===
        "idx_reservations_phone_key_unique"
    )
  );
}


async function ensureReservationPhoneKeySchema({
  sequelize,
  Reservation,
}) {
  await sequelize.query(
    `
      ALTER TABLE reservations
      ADD COLUMN IF NOT EXISTS phone_key TEXT
    `
  );


  /*
   * Backfill rows created before this rule.
   * The oldest reservation of a phone keeps the
   * key; later duplicates stay NULL so the unique
   * index can still be created.
   */
  const pending =
    await Reservation.findAll({
      attributes: [
        "id",
        "phone",
      ],
      where: {
        phone_key: null,
      },
      order: [
        [
          "id",
          "ASC",
        ],
      ],
    });

  let backfilled =
    0;

  let duplicates =
    0;

  let invalid =
    0;

  for (
    const reservation
    of pending
  ) {
    let key;

    try {
      key =
        reservationPhoneKey(
          reservation.phone
        );
    } catch {
      invalid +=
        1;

      continue;
    }

    const [existing] =
      await sequelize.query(
        `
          SELECT id
          FROM reservations
          WHERE phone_key = :key
          LIMIT 1
        `,
        {
          replacements: {
            key,
          },
          type:
            QueryTypes.SELECT,
        }
      );

    if (existing) {
      duplicates +=
        1;

      continue;
    }

    await sequelize.query(
      `
        UPDATE reservations
        SET phone_key = :key
        WHERE id = :id
      `,
      {
        replacements: {
          key,

          id:
            reservation.id,
        },
      }
    );

    backfilled +=
      1;
  }


  await sequelize.query(
    `
      CREATE UNIQUE INDEX IF NOT EXISTS
        idx_reservations_phone_key_unique
      ON reservations (
        phone_key
      )
    `
  );


  if (backfilled > 0) {
    console.log(
      `✅ Reservation phone keys backfilled: ${backfilled}`
    );
  }

  if (duplicates > 0) {
    console.warn(
      `⚠️ ${duplicates} older reservations share a phone with an earlier one; left without phone_key.`
    );
  }

  if (invalid > 0) {
    console.warn(
      `⚠️ ${invalid} reservations have an invalid phone; left without phone_key.`
    );
  }

  return {
    backfilled,
    duplicates,
    invalid,
  };
}


export {
  assertReservationPhoneKeyConfigured,
  ensureReservationPhoneKeySchema,
  isPhoneKeyConflict,
  reservationPhoneKey,
};
