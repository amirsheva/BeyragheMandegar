import {
  Performance,
  Reservation,
  Venue,
} from "../models.js";

import {
  SmsTemplate,
} from "./models.js";

import {
  queueAndSendProviderTemplate,
} from "./template-send-service.js";

import {
  transactionalSmsEnabled,
} from "./reservation-status-notifier.js";


const NOTICE_LABELS = {
  reminder:
    "یادآوری اجرای شما",

  time_changed:
    "ساعت اجرا تغییر کرد",

  venue_changed:
    "محل اجرا تغییر کرد",

  time_and_venue_changed:
    "ساعت و محل اجرا تغییر کرد",
};


function normalizeText(value) {
  return String(
    value ?? ""
  ).trim();
}


async function notifyPerformanceNotice({
  performanceId,
  event,
  idempotencyPrefix,
}) {
  if (
    !transactionalSmsEnabled()
  ) {
    return {
      skipped: true,
      reason:
        "transactional_sms_disabled",
      total: 0,
      sent: 0,
      failed: 0,
    };
  }


  const notice =
    NOTICE_LABELS[event];

  if (!notice) {
    throw new Error(
      `Performance SMS event نامعتبر است: ${event}`
    );
  }


  const template =
    await SmsTemplate.findOne({
      where: {
        key:
          "performance_notice",

        status:
          "active",
      },
    });


  if (!template) {
    return {
      skipped: true,
      reason:
        "template_not_found",
      total: 0,
      sent: 0,
      failed: 0,
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
      total: 0,
      sent: 0,
      failed: 0,
    };
  }


  const performance =
    await Performance.findByPk(
      performanceId
    );


  if (!performance) {
    throw new Error(
      `Performance پیدا نشد: ${performanceId}`
    );
  }


  let venueName =
    "اعلام نشده";


  if (
    performance.venue_id
  ) {
    const venue =
      await Venue.findByPk(
        performance.venue_id
      );


    if (venue?.name) {
      venueName =
        normalizeText(
          venue.name
        );
    }
  }


  const label =
    normalizeText(
      performance.label
    ) ||
    "اجرای بیرق";


  const date =
    normalizeText(
      performance.date
    );


  const attendanceTime =
    normalizeText(
      performance.attendance_time
    ) ||
    normalizeText(
      performance.time
    );


  if (
    !date ||
    !attendanceTime
  ) {
    throw new Error(
      "تاریخ یا ساعت اجرای لازم برای پیامک کامل نیست."
    );
  }


  const reservations =
    await Reservation.findAll({
      where: {
        performance_id:
          performance.id,

        status:
          "confirmed",
      },

      order: [
        ["id", "ASC"],
      ],
    });


  if (
    reservations.length === 0
  ) {
    return {
      skipped: true,
      reason:
        "no_confirmed_reservations",
      total: 0,
      sent: 0,
      failed: 0,
    };
  }


  let sent = 0;
  let failed = 0;


  for (
    const reservation
    of reservations
  ) {
    try {
      await queueAndSendProviderTemplate({
        templateKey:
          "performance_notice",

        phone:
          reservation.phone,

        variables: {
          notice,

          label,

          date,

          attendance_time:
            attendanceTime,

          venue_name:
            venueName,
        },

        reservationId:
          reservation.id,

        performanceId:
          performance.id,

        idempotencyKey:
          `${idempotencyPrefix}:${reservation.id}`,

        metadata: {
          trigger:
            "performance_notice",

          event,
        },
      });


      sent += 1;

    } catch (error) {
      failed += 1;

      console.error(
        "[SMS] Performance notice failed:",
        {
          performanceId:
            performance.id,

          reservationId:
            reservation.id,

          event,

          error:
            error?.message ||
            String(error),
        }
      );
    }
  }


  return {
    skipped: false,
    total:
      reservations.length,
    sent,
    failed,
  };
}


export {
  notifyPerformanceNotice,
};
