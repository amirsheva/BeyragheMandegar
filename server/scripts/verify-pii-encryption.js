import "dotenv/config";

import {
  sequelize,
  Reservation,
} from "../models.js";

import {
  decryptPii,
  isEncryptedPii,
} from "../security/pii-crypto.js";


async function run() {

  console.log("");
  console.log(
    "🔎 PII Migration Verification"
  );

  console.log(
    "────────────────────────────────"
  );


  const [rows] =
    await sequelize.query(
      `
        SELECT
          id,
          phone,
          national_id
        FROM reservations
        ORDER BY id ASC
      `
    );


  let encryptedRows =
    0;

  let plaintextRows =
    0;

  let partialRows =
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

      decryptPii(
        row.phone
      );

      decryptPii(
        row.national_id
      );

      encryptedRows +=
        1;

      continue;
    }


    if (
      !phoneEncrypted &&
      !nationalIdEncrypted
    ) {

      plaintextRows +=
        1;

      continue;
    }


    partialRows +=
      1;
  }


  console.log(
    `Reservation rows: ${rows.length}`
  );

  console.log(
    `Encrypted rows: ${encryptedRows}`
  );

  console.log(
    `Plaintext rows: ${plaintextRows}`
  );

  console.log(
    `Partial rows: ${partialRows}`
  );


  if (
    plaintextRows >
      0 ||
    partialRows >
      0
  ) {

    throw new Error(
      "Plaintext or partially encrypted PII still exists."
    );
  }


  /*
   * Verify Sequelize getters can still
   * read every reservation.
   */

  const reservations =
    await Reservation.findAll({
      attributes: [
        "id",
        "phone",
        "national_id",
      ],
    });


  for (
    const item
    of reservations
  ) {

    if (
      typeof item.phone !==
        "string" ||
      !item.phone
    ) {

      throw new Error(
        `Reservation ${item.id} phone cannot be decrypted.`
      );
    }


    if (
      typeof item.national_id !==
        "string" ||
      !item.national_id
    ) {

      throw new Error(
        `Reservation ${item.id} national ID cannot be decrypted.`
      );
    }
  }


  console.log(
    "✅ Raw database contains no plaintext reservation PII"
  );

  console.log(
    "✅ Encryption authentication tags verified"
  );

  console.log(
    "✅ ORM decryption verified"
  );

  console.log("");
  console.log(
    "✅ PII MIGRATION VERIFIED"
  );
}


run()
  .catch(
    (error) => {

      console.error("");
      console.error(
        "❌ PII VERIFICATION FAILED"
      );

      console.error(
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