import {
  redactAccessUrl,
} from "../security/access-log.js";


const cases = [
  {
    input:
      "/api/tickets/BM-SUPER-SECRET-123",

    expected:
      "/api/tickets/[REDACTED]",
  },

  {
    input:
      "/api/tickets/BM-SECRET-ABC?foo=1",

    expected:
      "/api/tickets/[REDACTED]?foo=1",
  },

  {
    input:
      "/api/test?phone=09123456789&nationalId=0084575948",

    expected:
      "/api/test?phone=[REDACTED]&nationalId=[REDACTED]",
  },

  {
    input:
      "/api/news?limit=3",

    expected:
      "/api/news?limit=3",
  },
];


let failed =
  0;


for (
  const test
  of cases
) {
  const actual =
    redactAccessUrl(
      test.input
    );

  if (
    actual !==
    test.expected
  ) {
    console.error(
      "❌",
      test.input,
      "=>",
      actual
    );

    failed +=
      1;

  } else {
    console.log(
      "✅",
      actual
    );
  }
}


if (failed > 0) {
  throw new Error(
    `${failed} access-log redaction tests failed.`
  );
}


console.log(
  "✅ ACCESS LOG REDACTION PASSED"
);