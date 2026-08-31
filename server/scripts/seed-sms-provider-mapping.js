import {
  sequelize,
} from "../models.js";

import {
  SmsTemplate,
} from "../sms/models.js";


const mappings = {
  reservation_confirmed: {
    provider_method:
      "verify",

    parameters: {
      Performance:
        "performance_label",

      Date:
        "date",

      Attendance:
        "attendance_time",

      Count:
        "count",

      Tracking:
        "tracking_code",
    },
  },


  reservation_cancelled: {
    provider_method:
      "verify",

    parameters: {
      Performance:
        "performance_label",

      Date:
        "date",

      Tracking:
        "tracking_code",
    },
  },


  reservation_restored: {
    provider_method:
      "verify",

    parameters: {
      Performance:
        "performance_label",

      Date:
        "date",

      Count:
        "count",

      Tracking:
        "tracking_code",
    },
  },


  performance_reminder: {
    provider_method:
      "verify",

    parameters: {
      Performance:
        "performance_label",

      Date:
        "date",

      Attendance:
        "attendance_time",

      Venue:
        "venue_name",
    },
  },


  performance_time_changed: {
    provider_method:
      "verify",

    parameters: {
      Performance:
        "performance_label",

      Date:
        "date",

      Attendance:
        "attendance_time",

      Start:
        "start_time",
    },
  },


  performance_venue_changed: {
    provider_method:
      "verify",

    /*
     * آدرس کامل عمداً ارسال نمی‌شود.
     * SMS.ir Verify برای هر Parameter
     * سقف 25 کاراکتر دارد.
     */
    parameters: {
      Performance:
        "performance_label",

      Date:
        "date",

      Venue:
        "venue_name",
    },
  },


  /*
   * ticket_url احتمالاً از محدودیت
   * 25 کاراکتری Verify بیشتر است.
   *
   * تا زمانی که Ticket Short URL
   * نداشته باشیم Method تعیین نمی‌شود.
   */
  ticket_link: {
    provider_method:
      null,

    parameters: {
      Tracking:
        "tracking_code",

      Ticket:
        "ticket_url",
    },
  },
};


async function main() {
  await sequelize.authenticate();


  for (
    const [
      key,
      config,
    ]
    of Object.entries(
      mappings
    )
  ) {
    const template =
      await SmsTemplate.findOne({
        where: {
          key,
        },
      });


    if (!template) {
      console.log(
        `⚠️ Template not found: ${key}`
      );

      continue;
    }


    template.provider_method =
      config.provider_method;

    template.provider_parameters_json =
      JSON.stringify(
        config.parameters
      );


    /*
     * provider_template_id
     * عمداً تغییر نمی‌کند.
     *
     * Template ID واقعی را بعد از
     * ساخت Template در SMS.ir ثبت می‌کنیم.
     */


    await template.save();


    console.log(
      `✅ mapped: ${key} -> ${
        config.provider_method ||
        "pending"
      }`
    );
  }


  console.log(
    "✅ SMS provider template mappings ready."
  );

  await sequelize.close();
}


main().catch(
  async (error) => {
    console.error(error);

    try {
      await sequelize.close();
    } catch {}

    process.exit(1);
  }
);
