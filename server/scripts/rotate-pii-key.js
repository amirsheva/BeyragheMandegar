import "dotenv/config";

import {
  sequelize,
} from "../models.js";

import {
  decryptPii,
  encryptPii,
  isEncryptedPii,
} from "../security/pii-crypto.js";


function readKey(
  name
) {
  const value =
    String(
      process.env[name] ||
      ""
    ).trim();

  if (!value) {
    throw new Error(
      `${name} is missing.`
    );
  }

  const decoded =
    Buffer.from(
      value,
      "base64"
    );

  if (
    decoded.length !==
    32
  ) {
    throw new Error(
      `${name} must decode to exactly 32 bytes.`
    );
  }

  return value;
}


async function run() {
  if (
    String(
      process.env.PII_ENCRYPTION_ENABLED ||
      "false"
    )
      .trim()
      .toLowerCase() !==
    "true"
  ) {
    throw new Error(
      "PII_ENCRYPTION_ENABLED must be true."
    );
  }

  const oldKey =
    readKey(
      "PII_ENCRYPTION_KEY"
    );

  const newKey =
    readKey(
      "PII_ENCRYPTION_NEW_KEY"
    );

  if (
    oldKey ===
    newKey
  ) {
    throw new Error(
      "PII_ENCRYPTION_NEW_KEY must be different from the current key."
    );
  }

  const transaction =
    await sequelize.transaction({
      type:
        "IMMEDIATE",
    });

  try {
    const [rows] =
      await sequelize.query(
        `
          SELECT
            id,
            phone,
            national_id
          FROM reservations
          ORDER BY id ASC
        `,
        {
          transaction,
        }
      );

    let rotated = 0;

    for (
      const row
      of rows
    ) {
      if (
        !isEncryptedPii(
          row.phone
        ) ||
        !isEncryptedPii(
          row.national_id
        )
      ) {
        throw new Error(
          `Reservation ${row.id} is not fully encrypted. Run migrate:pii first.`
        );
      }

      process.env.PII_ENCRYPTION_KEY =
        oldKey;

      const phone =
        decryptPii(
          row.phone
        );

      const nationalId =
        decryptPii(
          row.national_id
        );

      process.env.PII_ENCRYPTION_KEY =
        newKey;

      const encryptedPhone =
        encryptPii(
          phone
        );

      const encryptedNationalId =
        encryptPii(
          nationalId
        );

      if (
        decryptPii(
          encryptedPhone
        ) !== phone ||
        decryptPii(
          encryptedNationalId
        ) !== nationalId
      ) {
        throw new Error(
          `Round-trip verification failed for reservation ${row.id}.`
        );
      }

      await sequelize.query(
        `
          UPDATE reservations
          SET
            phone = :phone,
            national_id = :nationalId
          WHERE id = :id
        `,
        {
          replacements: {
            id:
              row.id,
            phone:
              encryptedPhone,
            nationalId:
              encryptedNationalId,
          },
          transaction,
        }
      );

      rotated += 1;
    }

    process.env.PII_ENCRYPTION_KEY =
      newKey;

    const [verificationRows] =
      await sequelize.query(
        `
          SELECT
            id,
            phone,
            national_id
          FROM reservations
          ORDER BY id ASC
        `,
        {
          transaction,
        }
      );

    for (
      const row
      of verificationRows
    ) {
      decryptPii(
        row.phone
      );

      decryptPii(
        row.national_id
      );
    }

    await transaction.commit();

    console.log(
      `✅ PII key rotation complete. Rows rotated: ${rotated}`
    );

    console.log(
      "✅ Update PII_ENCRYPTION_KEY in .env to the new key before restarting the service."
    );

  } catch (error) {
    process.env.PII_ENCRYPTION_KEY =
      oldKey;

    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
}


run()
  .catch(
    (error) => {
      console.error(
        "❌ PII key rotation failed:",
        error.message ||
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await sequelize.close();
    }
  );
