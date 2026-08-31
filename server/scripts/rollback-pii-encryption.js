import "dotenv/config";

import {
  sequelize,
} from "../models.js";

import {
  decryptPii,
  isEncryptedPii,
} from "../security/pii-crypto.js";


async function run() {

  if (
    process.env
      .PII_ROLLBACK_CONFIRM !==
    "YES-DECRYPT-PII"
  ) {

    throw new Error(
      "Rollback refused. Set PII_ROLLBACK_CONFIRM=YES-DECRYPT-PII explicitly."
    );
  }


  console.log("");
  console.log(
    "⚠️ PII ENCRYPTION ROLLBACK"
  );

  console.log(
    "────────────────────────────────"
  );


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


    let rolledBack =
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
        !phoneEncrypted &&
        !nationalIdEncrypted
      ) {

        continue;
      }


      if (
        phoneEncrypted !==
        nationalIdEncrypted
      ) {

        throw new Error(
          `Reservation ${row.id} is partially encrypted.`
        );
      }


      const phone =
        decryptPii(
          row.phone
        );

      const nationalId =
        decryptPii(
          row.national_id
        );


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

            phone,

            nationalId,
          },

          transaction,
        }
      );


      rolledBack +=
        1;
    }


    await transaction.commit();


    console.log(
      `Rows decrypted: ${rolledBack}`
    );

    console.log(
      "✅ Rollback committed"
    );

    console.log("");
    console.log(
      "⚠️ After rollback set PII_ENCRYPTION_ENABLED=false"
    );

  } catch (error) {

    if (
      !transaction.finished
    ) {

      await transaction.rollback();
    }


    console.error(
      "❌ Rollback failed:"
    );

    console.error(
      error.message ||
      error
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