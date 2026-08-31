import "dotenv/config";

import {
  sequelize,
} from "../models.js";

import {
  assertPiiEncryptionConfigured,
  decryptPii,
  encryptPii,
  isEncryptedPii,
} from "../security/pii-crypto.js";


async function run() {

  console.log("");
  console.log(
    "🔐 Reservation PII Migration"
  );

  console.log(
    "────────────────────────────────"
  );


  assertPiiEncryptionConfigured();


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


    let alreadyEncrypted =
      0;

    let migrated =
      0;


    for (
      const row
      of rows
    ) {

      const phoneEncrypted =
        isEncryptedPii(
          row.phone
        );

      const nationalIdEncrypted =
        isEncryptedPii(
          row.national_id
        );


      if (
        phoneEncrypted &&
        nationalIdEncrypted
      ) {

        /*
         * Verify the current key can
         * actually decrypt the row.
         */

        decryptPii(
          row.phone
        );

        decryptPii(
          row.national_id
        );

        alreadyEncrypted +=
          1;

        continue;
      }


      if (
        phoneEncrypted !==
        nationalIdEncrypted
      ) {

        throw new Error(
          `Reservation ${row.id} is only partially encrypted.`
        );
      }


      const originalPhone =
        String(
          row.phone ?? ""
        );

      const originalNationalId =
        String(
          row.national_id ?? ""
        );


      const encryptedPhone =
        encryptPii(
          originalPhone
        );

      const encryptedNationalId =
        encryptPii(
          originalNationalId
        );


      /*
       * Verify round-trip BEFORE
       * modifying the row.
       */

      if (
        decryptPii(
          encryptedPhone
        ) !==
        originalPhone
      ) {

        throw new Error(
          `Phone round-trip verification failed for reservation ${row.id}.`
        );
      }


      if (
        decryptPii(
          encryptedNationalId
        ) !==
        originalNationalId
      ) {

        throw new Error(
          `National ID round-trip verification failed for reservation ${row.id}.`
        );
      }


      /*
       * Raw SQL intentionally bypasses
       * Sequelize setters so we know
       * exactly what is stored.
       */

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


      migrated +=
        1;
    }


    /*
     * Final verification while still
     * inside the transaction.
     */

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

      if (
        !isEncryptedPii(
          row.phone
        ) ||
        !isEncryptedPii(
          row.national_id
        )
      ) {

        throw new Error(
          `Reservation ${row.id} is not fully encrypted.`
        );
      }


      /*
       * Authentication tag verification.
       */

      decryptPii(
        row.phone
      );

      decryptPii(
        row.national_id
      );
    }


    await transaction.commit();


    console.log(
      `Rows checked: ${rows.length}`
    );

    console.log(
      `Rows migrated: ${migrated}`
    );

    console.log(
      `Already encrypted: ${alreadyEncrypted}`
    );

    console.log("");
    console.log(
      "✅ ALL RESERVATION PII ENCRYPTED"
    );

    console.log(
      "✅ Migration committed atomically"
    );

  } catch (error) {

    if (
      !transaction.finished
    ) {

      await transaction.rollback();
    }


    console.error("");
    console.error(
      "❌ MIGRATION FAILED"
    );

    console.error(
      error.message ||
      error
    );

    console.error(
      "✅ Transaction rolled back"
    );

    process.exitCode =
      1;
  }
}


run()
  .finally(
    async () => {

      await sequelize.close();
    }
  );