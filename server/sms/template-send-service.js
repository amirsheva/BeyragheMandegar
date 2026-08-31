import {
  randomUUID,
} from "crypto";

import {
  SmsTemplate,
} from "./models.js";

import {
  queueSms,
} from "./service.js";

import {
  refreshSmsirDelivery,
} from "./smsir-service.js";

import smsirProvider
  from "./providers/smsir-provider.js";


function readMapping(
  raw
) {
  if (!raw) {
    return {};
  }


  try {
    const value =
      JSON.parse(raw);

    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    )
      ? value
      : {};

  } catch {
    throw new Error(
      "Mapping پارامترهای Provider نامعتبر است."
    );
  }
}


function verifyParameterLimit() {
  /*
   * مستند API که بررسی کردیم 25 را اعلام کرده بود،
   * در UI جدید SMS.ir عدد 40 نیز دیده شده است.
   *
   * بنابراین Hard-code نمی‌کنیم و قابل تنظیم است.
   */
  const value =
    Number(
      process.env
        .SMSIR_VERIFY_PARAMETER_MAX_LENGTH ||
      25
    );


  return (
    Number.isSafeInteger(
      value
    ) &&
    value > 0
  )
    ? value
    : 25;
}


function buildProviderParameters(
  mapping,
  variables
) {
  const maxLength =
    verifyParameterLimit();


  return Object.entries(
    mapping
  ).map(
    ([
      providerKey,
      internalKey,
    ]) => {
      const raw =
        variables?.[
          internalKey
        ];


      if (
        raw === undefined ||
        raw === null ||
        String(
          raw
        ).trim() === ""
      ) {
        throw new Error(
          `مقدار ${internalKey} برای قالب پیامک موجود نیست.`
        );
      }


      const value =
        String(
          raw
        ).trim();


      if (
        value.length >
        maxLength
      ) {
        throw new Error(
          `مقدار ${internalKey} بیشتر از حد مجاز ${maxLength} کاراکتر است.`
        );
      }


      return {
        name:
          providerKey,

        value,
      };
    }
  );
}


async function queueAndSendProviderTemplate({
  templateKey,
  phone,
  variables,

  reservationId = null,
  performanceId = null,
  campaignId = null,

  idempotencyKey = null,

  metadata = null,
}) {
  const template =
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
      `قالب فعال پیدا نشد: ${templateKey}`
    );
  }


  if (
    template.provider_method !==
    "verify"
  ) {
    throw new Error(
      `قالب ${templateKey} برای Verify تنظیم نشده است.`
    );
  }


  const templateId =
    Number(
      template
        .provider_template_id
    );


  if (
    !Number.isSafeInteger(
      templateId
    ) ||
    templateId <= 0
  ) {
    throw new Error(
      `Template ID سرویس‌دهنده برای ${templateKey} هنوز ثبت نشده است.`
    );
  }


  const mapping =
    readMapping(
      template
        .provider_parameters_json
    );


  const providerParameters =
    buildProviderParameters(
      mapping,
      variables
    );


  /*
   * queueSms متن داخلی را هم Render می‌کند،
   * بنابراین Log ما مستقل از Provider باقی می‌ماند.
   */
  const queued =
    await queueSms({
      phone,

      templateKey,

      variables,

      reservationId,

      performanceId,

      campaignId,

      provider:
        "smsir",

      idempotencyKey:
        idempotencyKey ||
        `${templateKey}:${randomUUID()}`,

      metadata: {
        ...(metadata || {}),

        provider:
          "smsir",

        providerMethod:
          "verify",

        providerTemplateId:
          templateId,

        providerParameters,
      },
    });


  const message =
    queued.message;


  if (!message) {
    throw new Error(
      "رکورد پیامک ایجاد نشد."
    );
  }


  if (
    queued.duplicate &&
    [
      "sent",
      "delivered",
    ].includes(
      message.status
    )
  ) {
    return message;
  }


  message.send_method =
    "verify";

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
      await smsirProvider.sendVerify({
        mobile:
          message.phone,

        templateId,

        parameters:
          providerParameters,
      });


    message.provider_message_id =
      result.messageId !==
        null &&
      result.messageId !==
        undefined
        ? String(
            result.messageId
          )
        : null;

    message.actual_cost =
      Number(
        result.cost ||
        0
      );

    message.status =
      "sent";

    message.sent_at =
      new Date();

    message.failed_at =
      null;


    await message.save();


    if (
      message
        .provider_message_id
    ) {
      try {
        await refreshSmsirDelivery(
          message
        );

      } catch (
        deliveryError
      ) {
        /*
         * عدم دریافت Delivery Report
         * نباید ارسال موفق را Failed کند.
         */
        console.warn(
          "SMS.ir delivery refresh skipped:",
          deliveryError?.message ||
          deliveryError
        );
      }
    }


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


export {
  buildProviderParameters,
  queueAndSendProviderTemplate,
};
