import axios from "axios";


const DEFAULT_BASE_URL =
  "https://api.kavenegar.com/v1";

const REQUEST_TIMEOUT_MS =
  15000;


function getConfig() {
  const apiKey =
    String(
      process.env.KAVENEGAR_API_KEY ||
      ""
    ).trim();

  const baseUrl =
    String(
      process.env.KAVENEGAR_BASE_URL ||
      DEFAULT_BASE_URL
    )
      .trim()
      .replace(/\/+$/, "");

  if (!apiKey) {
    throw new Error(
      "KAVENEGAR_API_KEY تنظیم نشده است."
    );
  }

  return {
    apiKey,
    baseUrl,
  };
}


async function kavenegarRequest(
  path,
  {
    params,
  } = {}
) {
  const {
    apiKey,
    baseUrl,
  } = getConfig();

  const requestConfig = {
    url:
      `${baseUrl}/${apiKey}${path}`,

    params:
      params || {},
  };

  /*
   * Full request URL for debugging; the API key
   * is masked so it never lands in the logs.
   */
  console.log(
    "[kavenegar] GET",
    axios
      .getUri(requestConfig)
      .replace(
        `/${apiKey}/`,
        "/***API_KEY***/"
      )
  );

  let response;

  try {
    response =
      await axios.get(
        requestConfig.url,
        {
          params:
            requestConfig.params,

          timeout:
            REQUEST_TIMEOUT_MS,

          /*
           * Kavenegar reports failures in the JSON
           * body with non-2xx codes; handle every
           * status below instead of throwing here.
           */
          validateStatus:
            () => true,
        }
      );
  } catch (cause) {
    /*
     * Axios errors carry the request URL, which
     * contains the API key — never rethrow them.
     */
    const error =
      new Error(
        `Kavenegar در دسترس نیست: ${cause.code || cause.message}`
      );

    error.code =
      cause.code;

    throw error;
  }

  const payload =
    response.data &&
    typeof response.data === "object"
      ? response.data
      : null;

  if (!payload) {
    throw new Error(
      `Kavenegar پاسخ JSON معتبر نداد. HTTP ${response.status}`
    );
  }

  const status =
    Number(
      payload?.return
        ?.status
    );

  if (
    response.status < 200 ||
    response.status >= 300 ||
    status !== 200
  ) {
    const error =
      new Error(
        payload?.return
          ?.message ||
        `Kavenegar error HTTP ${response.status}`
      );

    error.httpStatus =
      response.status;

    error.kavenegarStatus =
      status;

    throw error;
  }

  return Array.isArray(
    payload.entries
  )
    ? payload.entries
    : [];
}


function normalizeToken(
  value
) {
  const text =
    String(
      value ?? ""
    ).trim();

  return text ||
    null;
}


const kavenegarProvider = {
  key:
    "kavenegar",


  /*
   * Verify Lookup: sends a message built from a
   * pre-approved template (configured in the
   * Kavenegar panel). No sender line is needed —
   * Kavenegar picks it automatically, and these
   * messages bypass promotional-SMS opt-out
   * filters.
   */
  async verifyLookup({
    receptor,
    template,
    token,
    token2,
    token3,
    token10,
    token20,
    token30,
    type,
  }) {
    console.log(receptor,
    template,
    token,"@@@@@@@@@@@@@@@@@@@@@@@@@")
    const cleanReceptor =
      String(
        receptor ||
        ""
      ).trim();

    if (!cleanReceptor) {
      throw new Error(
        "شماره گیرنده الزامی است."
      );
    }

    const cleanTemplate =
      String(
        template ||
        ""
      ).trim();

    if (!cleanTemplate) {
      throw new Error(
        "نام الگوی پیامک الزامی است."
      );
    }

    const cleanToken =
      normalizeToken(
        token
      );

    if (!cleanToken) {
      throw new Error(
        "مقدار token الزامی است."
      );
    }

    const params = {
      receptor:
        cleanReceptor,

      template:
        cleanTemplate,

      token:
        cleanToken,
    };

    const token2Value =
      normalizeToken(
        token2
      );

    const token3Value =
      normalizeToken(
        token3
      );

    const token10Value =
      normalizeToken(
        token10
      );

    const token20Value =
      normalizeToken(
        token20
      );

    const token30Value =
      normalizeToken(
        token30
      );

    if (token2Value) {
      params.token2 =
        token2Value;
    }

    if (token3Value) {
      params.token3 =
        token3Value;
    }

    if (token10Value) {
      params.token10 =
        token10Value;
    }

    if (token20Value) {
      params.token20 =
        token20Value;
    }

    if (token30Value) {
      params.token30 =
        token30Value;
    }

    if (type) {
      params.type =
        String(
          type
        ).trim();
    }

    const entries =
      await kavenegarRequest(
        "/verify/lookup.json",
        {
          params,
        }
      );

    const entry =
      entries[0] ||
      null;

    return {
      ok: true,

      messageId:
        entry
          ?.messageid ??
        null,

      status:
        entry
          ?.status ??
        null,

      raw:
        entry,
    };
  },
};


export {
  kavenegarRequest,
};

export default kavenegarProvider;
