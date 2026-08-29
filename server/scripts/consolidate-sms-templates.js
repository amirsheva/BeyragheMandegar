import {
  sequelize,
} from "../models.js";

import {
  SmsTemplate,
  SmsMessage,
} from "../sms/models.js";


const NEW_TEMPLATES = [
  {
    key:
      "reservation_status",

    title:
      "وضعیت رزرو بیرق ماندگار",

    body:
`بیرق ماندگار
وضعیت رزرو شما: {{status}}
اجرا: {{label}}
تاریخ: {{date}}
ساعت حضور: {{attendance_time}}
تعداد بلیت: {{count}}
کد پیگیری: {{tracking_code}}`,

    category:
      "transactional",

    provider_method:
      "verify",

    provider_parameters_json:
      JSON.stringify({
        STATUS:
          "status",

        NIGHT:
          "label",

        DATE:
          "date",

        ATTENDANCE:
          "attendance_time",

        COUNT:
          "count",

        TRACKING:
          "tracking_code",
      }),
  },

  {
    key:
      "performance_notice",

    title:
      "اطلاع‌رسانی اجرای بیرق ماندگار",

    body:
`بیرق ماندگار
{{notice}}
اجرا: {{label}}
تاریخ: {{date}}
ساعت حضور: {{attendance_time}}
محل اجرا: {{venue_name}}`,

    category:
      "transactional",

    provider_method:
      "verify",

    provider_parameters_json:
      JSON.stringify({
        NOTICE:
          "notice",

        NIGHT:
          "label",

        DATE:
          "date",

        ATTENDANCE:
          "attendance_time",

        VENUE:
          "venue_name",
      }),
  },
];


const LEGACY_KEYS = [
  "reservation_confirmed",
  "reservation_cancelled",
  "reservation_restored",
  "performance_reminder",
  "performance_time_changed",
  "performance_venue_changed",
  "ticket_link",
];


async function main() {
  await sequelize.authenticate();

  const transaction =
    await sequelize.transaction();

  try {
    for (
      const item
      of NEW_TEMPLATES
    ) {
      const [
        template,
        created,
      ] =
        await SmsTemplate.findOrCreate({
          where: {
            key:
              item.key,
          },

          defaults: {
            ...item,

            status:
              "active",

            is_system:
              true,

            /*
             * Template ID واقعی SMS.ir
             * بعد از تایید وارد می‌شود.
             */
            provider_template_id:
              null,
          },

          transaction,
        });


      if (!created) {
        template.title =
          item.title;

        template.body =
          item.body;

        template.category =
          item.category;

        template.status =
          "active";

        template.is_system =
          true;

        template.provider_method =
          item.provider_method;

        template.provider_parameters_json =
          item.provider_parameters_json;

        /*
         * provider_template_id را
         * اگر قبلاً مقدار گرفته باشد
         * پاک نمی‌کنیم.
         */
        await template.save({
          transaction,
        });
      }


      console.log(
        `${
          created
            ? "✅ created"
            : "↪ updated"
        }: ${item.key}`
      );
    }


    for (
      const key
      of LEGACY_KEYS
    ) {
      const template =
        await SmsTemplate.findOne({
          where: {
            key,
          },

          transaction,
        });


      if (!template) {
        continue;
      }


      const references =
        await SmsMessage.count({
          where: {
            template_id:
              template.id,
          },

          transaction,
        });


      if (
        references === 0
      ) {
        await template.destroy({
          transaction,
        });

        console.log(
          `🗑 removed legacy: ${key}`
        );

      } else {
        /*
         * اگر روزی پیام تاریخی به این
         * Template متصل بوده، برای حفظ
         * Audit آن را حذف نمی‌کنیم.
         */
        template.status =
          "inactive";

        template.provider_method =
          null;

        template.provider_template_id =
          null;

        await template.save({
          transaction,
        });

        console.log(
          `🔒 retained as history: ${key} (${references} messages)`
        );
      }
    }


    await transaction.commit();

    console.log(
      "✅ SMS templates consolidated."
    );

  } catch (error) {
    await transaction.rollback();

    throw error;

  } finally {
    await sequelize.close();
  }
}


main().catch(
  (error) => {
    console.error(
      "❌ SMS template consolidation failed:",
      error
    );

    process.exit(1);
  }
);
