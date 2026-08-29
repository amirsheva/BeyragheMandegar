import {
  randomUUID,
} from "crypto";

import {
  SmsTemplate,
  SmsMessage,
} from "./models.js";

import {
  countSmsSegments,
} from "./segment-counter.js";

import noopProvider
  from "./providers/noop-provider.js";


function normalizeDigits(
  value
) {
  return String(
    value || ""
  )
    .split("")
    .map(
      (char) => {
        const fa =
          "۰۱۲۳۴۵۶۷۸۹"
            .indexOf(
              char
            );

        if (fa >= 0) {
          return String(fa);
        }

        const ar =
          "٠١٢٣٤٥٦٧٨٩"
            .indexOf(
              char
            );

        if (ar >= 0) {
          return String(ar);
        }

        return char;
      }
    )
    .join("");
}


function normalizePhone(
  value
) {
  let phone =
    normalizeDigits(
      value
    )
      .replace(
        /[\s()-]/g,
        ""
      );


  if (
    phone.startsWith(
      "+98"
    )
  ) {
    phone =
      "0" +
      phone.slice(3);
  }


  if (
    phone.startsWith(
      "98"
    ) &&
    phone.length === 12
  ) {
    phone =
      "0" +
      phone.slice(2);
  }


  if (
    !/^09\d{9}$/.test(
      phone
    )
  ) {
    throw new Error(
      "شماره موبایل نامعتبر است."
    );
  }


  return phone;
}


function renderTemplate(
  body,
  variables = {}
) {
  const missing =
    new Set();


  const message =
    String(
      body || ""
    ).replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (
        match,
        key
      ) => {
        const value =
          variables[key];

        if (
          value ===
            undefined ||
          value === null
        ) {
          missing.add(
            key
          );

          return match;
        }


        return String(
          value
        );
      }
    );


  if (missing.size) {
    throw new Error(
      `متغیرهای قالب مقدار ندارند: ${
        Array.from(
          missing
        ).join(", ")
      }`
    );
  }


  return message;
}


function getProvider(
  providerName
) {
  const name =
    String(
      providerName ||
      process.env
        .SMS_PROVIDER ||
      "noop"
    )
      .trim()
      .toLowerCase();


  if (name === "noop") {
    return noopProvider;
  }


  throw new Error(
    `SMS Provider پشتیبانی نمی‌شود: ${name}`
  );
}


function estimateCost({
  encoding,
  segments,
}) {
  const price =
    encoding === "gsm"
      ? Number(
          process.env
            .SMS_PRICE_PER_SEGMENT_LATIN ||
          0
        )
      : Number(
          process.env
            .SMS_PRICE_PER_SEGMENT_FA ||
          0
        );


  if (
    !Number.isFinite(
      price
    ) ||
    price < 0
  ) {
    return 0;
  }


  return (
    price *
    Number(
      segments || 0
    )
  );
}


async function queueSms({
  phone,
  text,
  templateKey,
  variables = {},

  reservationId = null,
  performanceId = null,
  campaignId = null,

  provider =
    process.env
      .SMS_PROVIDER ||
    "noop",

  idempotencyKey = null,

  metadata = null,
}) {
  const normalizedPhone =
    normalizePhone(
      phone
    );


  let template =
    null;

  let finalMessage =
    String(
      text || ""
    ).trim();


  if (templateKey) {
    template =
      await SmsTemplate.findOne({
        where: {
          key:
            templateKey,

          status:
            "active",
        },
      });


    if (!template) {
      throw new Error(
        `قالب پیامک فعال پیدا نشد: ${templateKey}`
      );
    }


    finalMessage =
      renderTemplate(
        template.body,
        variables
      ).trim();
  }


  if (!finalMessage) {
    throw new Error(
      "متن پیامک نمی‌تواند خالی باشد."
    );
  }


  const segmentInfo =
    countSmsSegments(
      finalMessage
    );


  const estimatedCost =
    estimateCost({
      encoding:
        segmentInfo
          .encoding,

      segments:
        segmentInfo
          .segments,
    });


  const finalIdempotencyKey =
    String(
      idempotencyKey ||
      `manual:${randomUUID()}`
    );


  const existing =
    await SmsMessage.findOne({
      where: {
        idempotency_key:
          finalIdempotencyKey,
      },
    });


  if (existing) {
    return {
      message:
        existing,

      duplicate:
        true,
    };
  }


  try {
    const message =
      await SmsMessage.create({
        reservation_id:
          reservationId,

        performance_id:
          performanceId,

        campaign_id:
          campaignId,

        template_id:
          template?.id ||
          null,

        phone:
          normalizedPhone,

        message:
          finalMessage,

        provider:
          String(
            provider
          )
            .trim()
            .toLowerCase(),

        status:
          "queued",

        encoding:
          segmentInfo
            .encoding,

        segment_count:
          segmentInfo
            .segments,

        estimated_cost:
          estimatedCost,

        actual_cost:
          0,

        attempt_count:
          0,

        idempotency_key:
          finalIdempotencyKey,

        metadata_json:
          metadata
            ? JSON.stringify(
                metadata
              )
            : null,

        queued_at:
          new Date(),
      });


    return {
      message,

      duplicate:
        false,
    };

  } catch (error) {
    if (
      error?.name ===
      "SequelizeUniqueConstraintError"
    ) {
      const duplicate =
        await SmsMessage.findOne({
          where: {
            idempotency_key:
              finalIdempotencyKey,
          },
        });

      return {
        message:
          duplicate,

        duplicate:
          true,
      };
    }


    throw error;
  }
}


async function sendSmsMessage(
  messageOrId
) {
  const message =
    typeof messageOrId ===
      "object"
      ? messageOrId
      : await SmsMessage
          .findByPk(
            messageOrId
          );


  if (!message) {
    throw new Error(
      "پیامک یافت نشد."
    );
  }


  if (
    [
      "sent",
      "delivered",
    ].includes(
      message.status
    )
  ) {
    return message;
  }


  const provider =
    getProvider(
      message.provider
    );


  message.attempt_count =
    Number(
      message.attempt_count ||
      0
    ) + 1;

  message.last_error =
    null;

  await message.save();


  try {
    const result =
      await provider.send({
        phone:
          message.phone,

        message:
          message.message,
      });


    message.provider_message_id =
      result.providerMessageId ||
      null;

    message.status =
      result.status ||
      "sent";

    message.sent_at =
      new Date();

    message.failed_at =
      null;

    message.actual_cost =
      Number(
        result.actualCost ||
        0
      );


    await message.save();

    return message;

  } catch (error) {
    message.status =
      "failed";

    message.failed_at =
      new Date();

    message.last_error =
      String(
        error?.message ||
        error
      );


    await message.save();

    throw error;
  }
}


async function queueAndSendSms(
  options
) {
  const queued =
    await queueSms(
      options
    );


  if (
    queued.duplicate &&
    [
      "sent",
      "delivered",
    ].includes(
      queued.message
        ?.status
    )
  ) {
    return queued.message;
  }


  return sendSmsMessage(
    queued.message
  );
}


export {
  normalizePhone,
  renderTemplate,
  queueSms,
  sendSmsMessage,
  queueAndSendSms,
};
