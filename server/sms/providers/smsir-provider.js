const DEFAULT_BASE_URL =
  "https://api.sms.ir/v1";


function getConfig() {
  const apiKey =
    String(
      process.env.SMSIR_API_KEY ||
      ""
    ).trim();

  const baseUrl =
    String(
      process.env.SMSIR_BASE_URL ||
      DEFAULT_BASE_URL
    )
      .trim()
      .replace(/\/+$/, "");

  if (!apiKey) {
    throw new Error(
      "SMSIR_API_KEY تنظیم نشده است."
    );
  }

  return {
    apiKey,
    baseUrl,
  };
}


async function smsirRequest(
  path,
  {
    method = "GET",
    body,
  } = {}
) {
  const {
    apiKey,
    baseUrl,
  } = getConfig();

  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        method,

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "X-API-KEY":
            apiKey,
        },

        body:
          body === undefined
            ? undefined
            : JSON.stringify(
                body
              ),
      }
    );

  const payload =
    await response
      .json()
      .catch(
        () => null
      );

  if (!payload) {
    throw new Error(
      `SMS.ir پاسخ JSON معتبر نداد. HTTP ${response.status}`
    );
  }

  if (
    !response.ok ||
    Number(
      payload.status
    ) !== 1
  ) {
    const error =
      new Error(
        payload.message ||
        `SMS.ir error HTTP ${response.status}`
      );

    error.httpStatus =
      response.status;

    error.smsirStatus =
      Number(
        payload.status
      );

    error.smsirData =
      payload.data;

    throw error;
  }

  return payload.data;
}


function normalizeMobile(
  value
) {
  let mobile =
    String(
      value || ""
    )
      .trim()
      .replace(
        /[\s()-]/g,
        ""
      );

  const faDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  const arDigits =
    "٠١٢٣٤٥٦٧٨٩";

  mobile =
    mobile
      .split("")
      .map(
        (char) => {
          const fa =
            faDigits.indexOf(
              char
            );

          if (fa >= 0) {
            return String(fa);
          }

          const ar =
            arDigits.indexOf(
              char
            );

          if (ar >= 0) {
            return String(ar);
          }

          return char;
        }
      )
      .join("");

  if (
    mobile.startsWith(
      "+98"
    )
  ) {
    mobile =
      "0" +
      mobile.slice(3);
  }

  if (
    mobile.startsWith(
      "98"
    ) &&
    mobile.length === 12
  ) {
    mobile =
      "0" +
      mobile.slice(2);
  }

  if (
    !/^09\d{9}$/.test(
      mobile
    )
  ) {
    throw new Error(
      "شماره موبایل نامعتبر است."
    );
  }

  return mobile;
}


function normalizeMobiles(
  mobiles
) {
  if (
    !Array.isArray(
      mobiles
    ) ||
    mobiles.length === 0
  ) {
    throw new Error(
      "حداقل یک شماره موبایل الزامی است."
    );
  }

  if (
    mobiles.length > 100
  ) {
    throw new Error(
      "حداکثر ۱۰۰ شماره در هر درخواست مجاز است."
    );
  }

  return mobiles.map(
    normalizeMobile
  );
}


function normalizeLineNumber(
  value
) {
  const raw =
    String(
      value ||
      process.env
        .SMSIR_LINE_NUMBER ||
      ""
    ).trim();


  if (
    !/^\d+$/.test(
      raw
    )
  ) {
    throw new Error(
      "شماره خط SMS.ir تنظیم نشده یا نامعتبر است."
    );
  }


  const line =
    Number(raw);


  if (
    !Number.isSafeInteger(
      line
    ) ||
    line <= 0
  ) {
    throw new Error(
      "شماره خط SMS.ir خارج از محدوده معتبر است."
    );
  }


  return line;
}


function dateToUnix(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "زمان ارسال نامعتبر است."
    );
  }

  return Math.floor(
    date.getTime() /
    1000
  );
}


function unixToDate(
  value
) {
  const unix =
    Number(value);

  if (
    !Number.isFinite(
      unix
    ) ||
    unix <= 0
  ) {
    return null;
  }

  return new Date(
    unix * 1000
  );
}


function ensureProductionSend(
  method
) {
  const environment =
    String(
      process.env.SMSIR_ENV ||
      "sandbox"
    )
      .trim()
      .toLowerCase();


  if (
    environment ===
    "sandbox"
  ) {
    throw new Error(
      `${method} در Sandbox فعلی SMS.ir فعال نیست؛ برای این تست از Verify استفاده کنید.`
    );
  }
}


function deliveryLabel(
  value
) {
  const labels = {
    1:
      "delivered",

    2:
      "not_delivered_to_handset",

    3:
      "delivered_to_telecom",

    4:
      "not_delivered_to_telecom",

    5:
      "delivered_to_operator",

    6:
      "failed",

    7:
      "blacklisted",

    8:
      "unknown",
  };

  return (
    labels[
      Number(value)
    ] ||
    "pending"
  );
}


const smsirProvider = {
  key:
    "smsir",


  async sendVerify({
    mobile,
    templateId,
    parameters,
  }) {
    const normalizedMobile =
      normalizeMobile(
        mobile
      );


    const normalizedTemplateId =
      Number(
        templateId
      );


    if (
      !Number.isSafeInteger(
        normalizedTemplateId
      ) ||
      normalizedTemplateId <= 0
    ) {
      throw new Error(
        "Template ID پیامک نامعتبر است."
      );
    }


    if (
      !Array.isArray(
        parameters
      ) ||
      parameters.length === 0
    ) {
      throw new Error(
        "پارامترهای Verify الزامی است."
      );
    }


    const normalizedParameters =
      parameters.map(
        (item) => {
          const name =
            String(
              item?.name ||
              ""
            ).trim();

          const value =
            String(
              item?.value ??
              ""
            ).trim();


          if (
            !name ||
            !value
          ) {
            throw new Error(
              "نام و مقدار همه پارامترهای Verify الزامی است."
            );
          }


          return {
            name,
            value,
          };
        }
      );


    const data =
      await smsirRequest(
        "/send/verify",
        {
          method:
            "POST",

          body: {
            mobile:
              normalizedMobile,

            templateId:
              normalizedTemplateId,

            parameters:
              normalizedParameters,
          },
        }
      );


    return {
      ok: true,

      messageId:
        data?.messageId ??
        null,

      cost:
        Number(
          data?.cost ||
          0
        ),

      raw:
        data,
    };
  },


  async sendSandboxVerify({
    mobile,
    code = "12345",
  }) {
    const normalizedMobile =
      normalizeMobile(
        mobile
      );

    const templateId =
      Number(
        process.env
          .SMSIR_SANDBOX_VERIFY_TEMPLATE_ID ||
        123456
      );

    const data =
      await smsirRequest(
        "/send/verify",
        {
          method:
            "POST",

          body: {
            mobile:
              normalizedMobile,

            templateId,

            parameters: [
              {
                name:
                  "Code",

                value:
                  String(
                    code
                  ),
              },
            ],
          },
        }
      );

    return {
      ok: true,

      messageId:
        data?.messageId ??
        null,

      cost:
        Number(
          data?.cost ||
          0
        ),

      raw:
        data,
    };
  },


  async sendBulk({
    lineNumber,
    messageText,
    mobiles,
    sendDateTime = null,
  }) {
    ensureProductionSend(
      "Bulk"
    );
    const normalizedMobiles =
      normalizeMobiles(
        mobiles
      );

    const text =
      String(
        messageText ||
        ""
      ).trim();

    if (!text) {
      throw new Error(
        "متن پیامک نمی‌تواند خالی باشد."
      );
    }

    const data =
      await smsirRequest(
        "/send/bulk",
        {
          method:
            "POST",

          body: {
            lineNumber:
              normalizeLineNumber(
                lineNumber
              ),

            messageText:
              text,

            mobiles:
              normalizedMobiles,

            sendDateTime:
              dateToUnix(
                sendDateTime
              ),
          },
        }
      );

    return {
      ok: true,

      packId:
        data?.packId ??
        null,

      messageIds:
        Array.isArray(
          data?.messageIds
        )
          ? data.messageIds
          : [],

      cost:
        Number(
          data?.cost ||
          0
        ),

      scheduled:
        Boolean(
          sendDateTime
        ),

      raw:
        data,
    };
  },


  async sendLikeToLike({
    lineNumber,
    messageTexts,
    mobiles,
    sendDateTime = null,
  }) {
    ensureProductionSend(
      "LikeToLike"
    );
    const normalizedMobiles =
      normalizeMobiles(
        mobiles
      );

    if (
      !Array.isArray(
        messageTexts
      ) ||
      messageTexts.length ===
        0
    ) {
      throw new Error(
        "متن‌های پیامک الزامی است."
      );
    }

    if (
      messageTexts.length >
      100
    ) {
      throw new Error(
        "حداکثر ۱۰۰ متن در هر درخواست مجاز است."
      );
    }

    if (
      messageTexts.length !==
      normalizedMobiles.length
    ) {
      throw new Error(
        "تعداد شماره‌ها و متن‌ها باید برابر باشد."
      );
    }

    const normalizedTexts =
      messageTexts.map(
        (item) => {
          const text =
            String(
              item ||
              ""
            ).trim();

          if (!text) {
            throw new Error(
              "هیچ‌یک از متن‌های پیامک نباید خالی باشد."
            );
          }

          return text;
        }
      );

    const data =
      await smsirRequest(
        "/send/likeToLike",
        {
          method:
            "POST",

          body: {
            lineNumber:
              normalizeLineNumber(
                lineNumber
              ),

            messageTexts:
              normalizedTexts,

            mobiles:
              normalizedMobiles,

            sendDateTime:
              dateToUnix(
                sendDateTime
              ),
          },
        }
      );

    return {
      ok: true,

      packId:
        data?.packId ??
        null,

      messageIds:
        Array.isArray(
          data?.messageIds
        )
          ? data.messageIds
          : [],

      cost:
        Number(
          data?.cost ||
          0
        ),

      scheduled:
        Boolean(
          sendDateTime
        ),

      raw:
        data,
    };
  },


  async cancelScheduled(
    packId
  ) {
    const id =
      String(
        packId ||
        ""
      ).trim();

    if (!id) {
      throw new Error(
        "Pack ID الزامی است."
      );
    }

    const data =
      await smsirRequest(
        `/send/scheduled/${encodeURIComponent(
          id
        )}`,
        {
          method:
            "DELETE",
        }
      );

    return {
      ok: true,

      returnedCreditCount:
        Number(
          data
            ?.returnedCreditCount ||
          0
        ),

      smsCount:
        Number(
          data?.smsCount ||
          0
        ),

      raw:
        data,
    };
  },


  async getMessageStatus(
    messageId
  ) {
    const id =
      String(
        messageId ||
        ""
      ).trim();

    if (
      !/^\d+$/.test(
        id
      )
    ) {
      throw new Error(
        "Message ID نامعتبر است."
      );
    }

    const data =
      await smsirRequest(
        `/send/${id}`
      );

    return {
      messageId:
        data?.messageId ??
        null,

      mobile:
        data?.mobile ??
        null,

      messageText:
        data?.messageText ??
        null,

      sendDateTime:
        unixToDate(
          data?.sendDateTime
        ),

      lineNumber:
        data?.lineNumber ??
        null,

      cost:
        Number(
          data?.cost ||
          0
        ),

      deliveryState:
        data?.deliveryState ??
        null,

      deliveryStatus:
        deliveryLabel(
          data?.deliveryState
        ),

      deliveryDateTime:
        unixToDate(
          data?.deliveryDateTime
        ),

      raw:
        data,
    };
  },


  async getPack(
    packId
  ) {
    const id =
      String(
        packId ||
        ""
      ).trim();

    if (!id) {
      throw new Error(
        "Pack ID الزامی است."
      );
    }

    const data =
      await smsirRequest(
        `/send/pack/${encodeURIComponent(
          id
        )}`
      );

    return Array.isArray(
      data
    )
      ? data.map(
          (item) => ({
            ...item,

            deliveryStatus:
              deliveryLabel(
                item.deliveryState
              ),

            sendDate:
              unixToDate(
                item.sendDateTime
              ),

            deliveryDate:
              unixToDate(
                item.deliveryDateTime
              ),
          })
        )
      : [];
  },


  async getCredit() {
    const data =
      await smsirRequest(
        "/credit"
      );

    return {
      credit:
        Number(
          data ||
          0
        ),
    };
  },


  async getLines() {
    const data =
      await smsirRequest(
        "/line"
      );

    return {
      lines:
        Array.isArray(
          data
        )
          ? data
          : [],
    };
  },


  async getLiveMessages({
    pageNumber = 1,
    pageSize = 20,
  } = {}) {
    const page =
      Math.max(
        1,
        Number(
          pageNumber
        ) || 1
      );

    const size =
      Math.min(
        100,
        Math.max(
          1,
          Number(
            pageSize
          ) || 20
        )
      );

    const params =
      new URLSearchParams({
        pageNumber:
          String(page),

        pageSize:
          String(size),
      });

    const data =
      await smsirRequest(
        `/send/live?${params.toString()}`
      );

    return Array.isArray(
      data
    )
      ? data
      : [];
  },
};


export {
  smsirRequest,
  normalizeMobile,
  deliveryLabel,
};

export default smsirProvider;
