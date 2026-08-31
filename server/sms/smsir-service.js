import {
  randomUUID,
} from "crypto";

import {
  SmsMessage,
} from "./models.js";

import {
  queueSms,
} from "./service.js";

import smsirProvider
  from "./providers/smsir-provider.js";


function localStatusFromDelivery(
  state
) {
  const value =
    Number(state);


  if (value === 1) {
    return "delivered";
  }


  if (
    [
      2,
      4,
      6,
      7,
    ].includes(
      value
    )
  ) {
    return "failed";
  }


  /*
   * 3 = رسیده به مخابرات
   * 5 = رسیده به اپراتور
   * 8 = نامشخص
   * null = هنوز نتیجه نهایی ندارد
   */
  return "sent";
}


function parseMetadata(
  value
) {
  if (!value) {
    return {};
  }


  try {
    return JSON.parse(
      value
    );
  } catch {
    return {};
  }
}


async function refreshSmsirDelivery(
  messageOrId
) {
  const message =
    typeof messageOrId ===
      "object"
      ? messageOrId
      : await SmsMessage.findByPk(
          messageOrId
        );


  if (!message) {
    throw new Error(
      "پیامک پیدا نشد."
    );
  }


  if (
    message.provider !==
      "smsir"
  ) {
    throw new Error(
      "این پیام متعلق به SMS.ir نیست."
    );
  }


  if (
    !message.provider_message_id
  ) {
    throw new Error(
      "Message ID سرویس‌دهنده ثبت نشده است."
    );
  }


  const report =
    await smsirProvider
      .getMessageStatus(
        message
          .provider_message_id
      );


  message.delivery_state =
    report.deliveryState;

  message.delivery_checked_at =
    new Date();


  if (
    Number.isFinite(
      Number(
        report.cost
      )
    )
  ) {
    message.actual_cost =
      Number(
        report.cost
      );
  }


  const localStatus =
    localStatusFromDelivery(
      report.deliveryState
    );


  message.status =
    localStatus;


  if (
    localStatus ===
    "delivered"
  ) {
    const environment =
      String(
        process.env.SMSIR_ENV ||
        "sandbox"
      )
        .trim()
        .toLowerCase();


    /*
     * Sandbox پاسخ شبیه‌سازی‌شده دارد و ممکن است
     * deliveryDateTime قدیمی برگرداند.
     * بنابراین آن را به‌عنوان زمان واقعی تحویل ذخیره نمی‌کنیم.
     */
    message.delivered_at =
      environment === "sandbox"
        ? null
        : (
            report.deliveryDateTime ||
            new Date()
          );

    message.failed_at =
      null;
  }


  if (
    localStatus ===
    "failed"
  ) {
    message.failed_at =
      new Date();

    message.last_error =
      `SMS.ir DeliveryState=${report.deliveryState}`;
  }


  const metadata =
    parseMetadata(
      message.metadata_json
    );


  message.metadata_json =
    JSON.stringify({
      ...metadata,

      lastDeliveryReport: {
        deliveryState:
          report.deliveryState,

        deliveryStatus:
          report.deliveryStatus,

        checkedAt:
          new Date()
            .toISOString(),

        providerDeliveryDateTime:
          report.deliveryDateTime
            ? report.deliveryDateTime.toISOString()
            : null,
      },
    });


  await message.save();


  return message;
}


async function queueAndSendSmsirSandboxVerify({
  phone,
  code = "12345",
  idempotencyKey = null,
}) {
  const normalizedCode =
    String(
      code ||
      ""
    ).trim();


  if (
    !normalizedCode
  ) {
    throw new Error(
      "کد Verify نمی‌تواند خالی باشد."
    );
  }


  if (
    normalizedCode.length >
    25
  ) {
    throw new Error(
      "مقدار پارامتر Verify نمی‌تواند بیشتر از ۲۵ کاراکتر باشد."
    );
  }


  const templateId =
    Number(
      process.env
        .SMSIR_SANDBOX_VERIFY_TEMPLATE_ID ||
      123456
    );


  const queued =
    await queueSms({
      phone,

      text:
        `کد تایید شما: ${normalizedCode}`,

      provider:
        "smsir",

      idempotencyKey:
        idempotencyKey ||
        `smsir-sandbox-verify:${randomUUID()}`,

      metadata: {
        source:
          "smsir_sandbox_verify",

        environment:
          "sandbox",

        templateId,

        parameters: {
          Code:
            normalizedCode,
        },
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
      await smsirProvider
        .sendSandboxVerify({
          mobile:
            message.phone,

          code:
            normalizedCode,
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


    /*
     * Sandbox فعلی SMS.ir در تست ما
     * Delivery Report نیز برمی‌گرداند.
     * اگر بعداً Sandbox این رفتار را نداشت،
     * ارسال موفق همچنان sent باقی می‌ماند.
     */
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
        const metadata =
          parseMetadata(
            message
              .metadata_json
          );


        message.metadata_json =
          JSON.stringify({
            ...metadata,

            deliveryReportError:
              String(
                deliveryError
                  ?.message ||
                deliveryError
              ),
          });


        await message.save();
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
  localStatusFromDelivery,
  refreshSmsirDelivery,
  queueAndSendSmsirSandboxVerify,
};
