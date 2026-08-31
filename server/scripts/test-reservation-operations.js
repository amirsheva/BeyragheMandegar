import assert
  from "node:assert/strict";

import {
  buildReservationCsv,
} from "../reservation-export.js";


console.log("");
console.log(
  "📤 Admin Reservation Operations Test"
);
console.log(
  "────────────────────────────────"
);


const csv =
  buildReservationCsv([
    {
      id:
        1,

      name:
        '=HYPERLINK("https://example.invalid","x")',

      phone:
        "0912***6789",

      national_id:
        "00****5948",

      count:
        2,

      tracking_code:
        "BM-TEST-ABC123",

      status:
        "confirmed",

      createdAt:
        "2026-08-31T10:00:00.000Z",

      performance: {
        label:
          "شب اول",

        date:
          "1405/08/01",

        time:
          "20:00",

        production: {
          title:
            "بیرق ماندگار",
        },
      },
    },
  ]);


assert.equal(
  csv.charCodeAt(0),
  0xFEFF,
  "CSV must start with UTF-8 BOM."
);

console.log(
  "✅ UTF-8 BOM present"
);


assert.ok(
  csv.includes(
    "بیرق ماندگار"
  ),
  "Persian production title missing."
);

console.log(
  "✅ Persian text preserved"
);


assert.ok(
  csv.includes(
    "0912***6789"
  ),
  "Masked phone missing."
);

console.log(
  "✅ Masked phone included"
);


assert.ok(
  !csv.includes(
    "00****5948"
  ),
  "National ID must not be exported."
);

console.log(
  "✅ National ID excluded"
);


assert.ok(
  !csv.includes(
    '"=HYPERLINK'
  ),
  "Spreadsheet formula must be neutralized."
);

assert.ok(
  csv.includes(
    `"'=HYPERLINK`
  ),
  "Spreadsheet formula neutralization marker missing."
);

console.log(
  "✅ Spreadsheet formula injection neutralized"
);


assert.ok(
  csv.includes(
    "BM-TEST-ABC123"
  ),
  "Tracking code missing."
);

console.log(
  "✅ Tracking code preserved"
);


console.log("");
console.log(
  "✅ ADMIN RESERVATION OPERATIONS TEST PASSED"
);