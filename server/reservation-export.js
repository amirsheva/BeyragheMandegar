function neutralizeSpreadsheetFormula(
  value
) {
  const text =
    String(
      value ?? ""
    );

  if (
    /^[=+\-@\t\r]/.test(
      text
    )
  ) {
    return `'${text}`;
  }

  return text;
}


function csvCell(
  value
) {
  const safe =
    neutralizeSpreadsheetFormula(
      value
    );

  return (
    '"' +
    safe.replace(
      /"/g,
      '""'
    ) +
    '"'
  );
}


function statusLabel(
  value
) {
  if (
    value ===
    "confirmed"
  ) {
    return "تأیید شده";
  }

  if (
    value ===
    "cancelled"
  ) {
    return "لغو شده";
  }

  return String(
    value || ""
  );
}


export function buildReservationCsv(
  items
) {
  const header = [
    "ردیف",
    "نام",
    "موبایل",
    "نمایش",
    "اجرا",
    "تاریخ",
    "ساعت",
    "تعداد بلیت",
    "کد پیگیری",
    "وضعیت",
    "تاریخ ثبت",
  ];


  const rows =
    items.map(
      (
        item,
        index
      ) => [
        index + 1,

        item.name ||
          "",

        item.phone ||
          "",

        item.performance
          ?.production
          ?.title ||
          "",

        item.performance
          ?.label ||
          "",

        item.performance
          ?.date ||
          "",

        item.performance
          ?.time ||
          "",

        Number(
          item.count ||
          0
        ),

        item.tracking_code ||
          "",

        statusLabel(
          item.status
        ),

        item.createdAt ||
          item.created_at ||
          "",
      ]
    );


  const body =
    [
      header,
      ...rows,
    ]
      .map(
        (row) =>
          row
            .map(
              csvCell
            )
            .join(",")
      )
      .join(
        "\r\n"
      );


  /*
   * UTF-8 BOM:
   * helps Excel open Persian text correctly.
   */
  return (
    "\uFEFF" +
    body
  );
}