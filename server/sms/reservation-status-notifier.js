import {
  Reservation,
  Performance,
} from "../models.js";

import {
  SmsTemplate,
} from "./models.js";

import {
  queueAndSendProviderTemplate,
} from "./template-send-service.js";


const STATUS_LABELS = {
  confirmed:
    "تأیید شد",

  cancelled:
    "لغو شد",

  restored:
    "دوباره فعال شد",
};


function transactionalSmsEnabled() {
  const enabled =
    [
      "1",
      "true",
      "yes",
      "on",
    ].includes(
      String(
        process.env
          .SMS_TRANSACTIONAL_ENABLED ||
        ""
      )
        .trim()
        .toLowerCase()
    );


  const production =
    String(
      process.env
        .SMSIR_ENV ||
      ""
    )
      .trim()
      .toLowerCase() ===
    "production";


  return (
    enabled &&
    production
  );
}


async function notifyReservationStatus({
  reservationId,
  event,
  idempotencyKey,
}) {
  if (
    !transactionalSmsEnabled()
  ) {
    return {
      skipped: true,
      reason:
        "transactional_sms_disabled",
    };
  }


  const statusLabel =
    STATUS_LABELS[event];


  if (!statusLabel) {
    throw new Error(
      `Reservation SMS event نامعتبر است: ${event}`
    );
  }


  const template =
    await SmsTemplate.findOne({
      where: {
        key:
          "reservation_status",

        status:
          "active",
      },
    });


  if (!template) {
    return {
      skipped: true,
      reason:
        "template_not_found",
    };
  }


  if (
    template.provider_method !==
      "verify" ||
    !template.provider_template_id
  ) {
    return {
      skipped: true,
      reason:
        "provider_template_not_ready",
    };
  }


  const reservation =
    await Reservation.findByPk(
      reservationId
    );


  if (!reservation) {
    throw new Error(
      `Reservation پیدا نشد: ${reservationId}`
    );
  }


  const performance =
    await Performance.findByPk(
      reservation.performance_id
    );


  if (!performance) {
    throw new Error(
      `Performance رزرو پیدا نشد: ${reservation.performance_id}`
    );
  }


  const label =
    String(
      performance.label ||
      ""
    ).trim();


  const date =
    String(
      performance.date ||
      ""
    ).trim();


  const attendanceTime =
    String(
      performance.attendance_time ||
      ""
    ).trim();


  if (
    !label ||
    !date ||
    !attendanceTime
  ) {
    throw new Error(
      "اطلاعات اجرای لازم برای SMS کامل نیست؛ label/date/attendance_time بررسی شود."
    );
  }


  return queueAndSendProviderTemplate({
    templateKey:
      "reservation_status",

    phone:
      reservation.phone,

    variables: {
      status:
        statusLabel,

      label,

      date,

      attendance_time:
        attendanceTime,

      count:
        String(
          reservation.count
        ),

      tracking_code:
        String(
          reservation.tracking_code
        ),
    },

    reservationId:
      reservation.id,

    performanceId:
      reservation.performance_id,

    idempotencyKey,

    metadata: {
      trigger:
        "reservation_status",

      event,
    },
  });
}


export {
  notifyReservationStatus,
  transactionalSmsEnabled,
};
