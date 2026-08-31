const SENSITIVE_QUERY_KEYS =
  [
    "trackingCode",
    "phone",
    "nationalId",
  ];


export function redactAccessUrl(
  value
) {
  let url =
    String(
      value || ""
    );


  url =
    url.replace(
      /(\/api\/tickets\/)[^/?#]+/gi,
      "$1[REDACTED]"
    );


  for (
    const key
    of SENSITIVE_QUERY_KEYS
  ) {
    const pattern =
      new RegExp(
        `([?&]${key}=)[^&#]*`,
        "gi"
      );

    url =
      url.replace(
        pattern,
        "$1[REDACTED]"
      );
  }


  return url;
}