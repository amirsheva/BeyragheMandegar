const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const EN_DIGITS = "0123456789";

export function toFaDigits(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).replace(
    /\d/g,
    (digit) =>
      FA_DIGITS[
        Number(digit)
      ]
  );
}

export function toEnDigits(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replace(
      /[۰-۹]/g,
      (digit) =>
        EN_DIGITS[
          FA_DIGITS.indexOf(
            digit
          )
        ]
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            digit
          )
        )
    );
}

export function faNumber(
  value,
  options = {}
) {
  const numeric =
    Number(value);

  if (
    !Number.isFinite(
      numeric
    )
  ) {
    return toFaDigits(
      value
    );
  }

  return new Intl.NumberFormat(
    "fa-IR",
    options
  ).format(
    numeric
  );
}

export function faPercent(
  value
) {
  return `${faNumber(value)}٪`;
}

export function faDateText(
  value
) {
  return toFaDigits(
    value || ""
  );
}

export function faTimeText(
  value
) {
  return toFaDigits(
    value || ""
  );
}
