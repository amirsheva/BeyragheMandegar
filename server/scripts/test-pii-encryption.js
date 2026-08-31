import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";

import {
  decryptPii,
  encryptPii,
  isEncryptedPii,
} from "../security/pii-crypto.js";


const TEST_PHONE =
  "09123456789";

const TEST_NATIONAL_ID =
  "0084575948";


let performance =
  null;

let reservation =
  null;


async function cleanup() {
  if (reservation) {
    await Reservation.destroy({
      where: {
        id:
          reservation.id,
      },
    });
  }


  if (performance) {
    await Performance.destroy({
      where: {
        id:
          performance.id,
      },
    });
  }
}


async function run() {
  console.log("");
  console.log(
    "🔐 PII Encryption Test"
  );

  console.log(
    "────────────────────────────"
  );


  /*
   * Basic crypto round-trip
   */
  const encryptedSample =
    encryptPii(
      TEST_PHONE
    );


  if (
    encryptedSample ===
      TEST_PHONE ||
    !isEncryptedPii(
      encryptedSample
    )
  ) {
    throw new Error(
      "encryptPii did not encrypt the value."
    );
  }


  if (
    decryptPii(
      encryptedSample
    ) !==
    TEST_PHONE
  ) {
    throw new Error(
      "Encryption round-trip failed."
    );
  }


  console.log(
    "✅ AES-256-GCM round-trip passed."
  );


  /*
   * Authentication tag / tamper test
   */
  /*
   * Change an actual ciphertext byte.
   * Changing only the last Base64URL character
   * can sometimes preserve the decoded bytes
   * because of unused Base64 padding bits.
   */
  const encryptedParts =
    encryptedSample.split(":");


  if (
    encryptedParts.length !==
    5
  ) {
    throw new Error(
      "Unexpected encrypted PII format."
    );
  }


  const tamperedBytes =
    Buffer.from(
      encryptedParts[4],
      "base64url"
    );


  if (
    tamperedBytes.length ===
    0
  ) {
    throw new Error(
      "Ciphertext is empty."
    );
  }


  tamperedBytes[0] =
    tamperedBytes[0] ^ 1;


  const tampered =
    [
      encryptedParts[0],
      encryptedParts[1],
      encryptedParts[2],
      encryptedParts[3],

      tamperedBytes.toString(
        "base64url"
      ),
    ].join(":");


  let tamperRejected =
    false;


  try {
    decryptPii(
      tampered
    );
  } catch {
    tamperRejected =
      true;
  }


  if (
    !tamperRejected
  ) {
    throw new Error(
      "Tampered ciphertext was accepted."
    );
  }


  console.log(
    "✅ Tampered ciphertext rejected."
  );


  const production =
    await Production.findOne({
      order: [
        [
          "id",
          "ASC",
        ],
      ],
    });


  if (!production) {
    throw new Error(
      "Test Production not found."
    );
  }


  performance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1499/07/01",

      time:
        "09:09",

      capacity:
        5,

      remaining_capacity:
        4,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - PII ENCRYPTION",
    });


  reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "کاربر تست رمزنگاری",

      phone:
        TEST_PHONE,

      national_id:
        TEST_NATIONAL_ID,

      count:
        1,

      tracking_code:
        `TEST-ENC-${Date.now()}`,

      status:
        "confirmed",
    });


  /*
   * Application layer must see plaintext.
   */
  if (
    reservation.phone !==
    TEST_PHONE
  ) {
    throw new Error(
      "Model phone getter did not decrypt."
    );
  }


  if (
    reservation.national_id !==
    TEST_NATIONAL_ID
  ) {
    throw new Error(
      "Model national_id getter did not decrypt."
    );
  }


  console.log(
    "✅ ORM reads decrypted phone."
  );

  console.log(
    "✅ ORM reads decrypted national ID."
  );


  /*
   * Raw database must NOT contain plaintext.
   */
  const [rows] =
    await sequelize.query(
      `
        SELECT
          phone,
          national_id
        FROM reservations
        WHERE id = :id
      `,
      {
        replacements: {
          id:
            reservation.id,
        },
      }
    );


  const raw =
    rows?.[0];


  if (!raw) {
    throw new Error(
      "Raw reservation row not found."
    );
  }


  console.log(
    "Raw phone encrypted:",
    isEncryptedPii(
      raw.phone
    )
  );

  console.log(
    "Raw national ID encrypted:",
    isEncryptedPii(
      raw.national_id
    )
  );


  if (
    raw.phone ===
    TEST_PHONE
  ) {
    throw new Error(
      "Phone is still plaintext at rest."
    );
  }


  if (
    raw.national_id ===
    TEST_NATIONAL_ID
  ) {
    throw new Error(
      "National ID is still plaintext at rest."
    );
  }


  if (
    !isEncryptedPii(
      raw.phone
    ) ||
    !isEncryptedPii(
      raw.national_id
    )
  ) {
    throw new Error(
      "Database values do not use the expected encryption format."
    );
  }


  console.log(
    "✅ Phone encrypted at rest."
  );

  console.log(
    "✅ National ID encrypted at rest."
  );


  console.log("");
  console.log(
    "✅ PII ENCRYPTION TEST PASSED"
  );
}


run()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ PII ENCRYPTION TEST FAILED"
    );

    console.error(
      error
    );

    process.exitCode =
      1;
  })
  .finally(async () => {
    try {
      await cleanup();

      console.log(
        "🧹 Encryption test data removed."
      );

    } catch (error) {
      console.error(
        "⚠️ Encryption test cleanup failed:",
        error
      );
    }

    await sequelize.close();
  });