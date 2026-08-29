const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ" +
  " !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿" +
  "abcdefghijklmnopqrstuvwxyzäöñüà";


const GSM_EXTENDED =
  "^{}\\[~]|€";


function isGsmText(
  text
) {
  for (
    const char
    of String(
      text || ""
    )
  ) {
    if (
      !GSM_BASIC.includes(
        char
      ) &&
      !GSM_EXTENDED.includes(
        char
      )
    ) {
      return false;
    }
  }

  return true;
}


function gsmLength(
  text
) {
  let length = 0;

  for (
    const char
    of String(
      text || ""
    )
  ) {
    length +=
      GSM_EXTENDED.includes(
        char
      )
        ? 2
        : 1;
  }

  return length;
}


function countSmsSegments(
  text
) {
  const clean =
    String(
      text || ""
    );

  if (!clean.length) {
    return {
      encoding:
        "unicode",

      length: 0,

      segments: 0,

      singleLimit: 70,

      multipartLimit: 67,
    };
  }


  if (
    isGsmText(clean)
  ) {
    const length =
      gsmLength(clean);

    const segments =
      length <= 160
        ? 1
        : Math.ceil(
            length / 153
          );

    return {
      encoding:
        "gsm",

      length,

      segments,

      singleLimit: 160,

      multipartLimit: 153,
    };
  }


  const length =
    Array.from(
      clean
    ).length;

  const segments =
    length <= 70
      ? 1
      : Math.ceil(
          length / 67
        );


  return {
    encoding:
      "unicode",

    length,

    segments,

    singleLimit: 70,

    multipartLimit: 67,
  };
}


export {
  countSmsSegments,
};
