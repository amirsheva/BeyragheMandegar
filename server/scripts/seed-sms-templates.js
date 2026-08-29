import {
  sequelize,
} from "../models.js";

import {
  SmsTemplate,
} from "../sms/models.js";


const templates = [
  {
    key:
      "reservation_confirmed",

    title:
      "تأیید رزرو",

    body:
`بیرق ماندگار
رزرو شما با موفقیت ثبت شد.
اجرا: {{performance_label}}
تاریخ: {{date}}
ساعت حضور: {{attendance_time}}
تعداد بلیت: {{count}}
کد پیگیری: {{tracking_code}}
بلیت: {{ticket_url}}`,

    category:
      "transactional",
  },

  {
    key:
      "reservation_cancelled",

    title:
      "لغو رزرو",

    body:
`بیرق ماندگار
رزرو شما لغو شد.
اجرا: {{performance_label}}
تاریخ: {{date}}
کد پیگیری: {{tracking_code}}`,

    category:
      "transactional",
  },

  {
    key:
      "reservation_restored",

    title:
      "فعال‌سازی مجدد رزرو",

    body:
`بیرق ماندگار
رزرو شما دوباره فعال شد.
اجرا: {{performance_label}}
تاریخ: {{date}}
تعداد بلیت: {{count}}
کد پیگیری: {{tracking_code}}`,

    category:
      "transactional",
  },

  {
    key:
      "performance_reminder",

    title:
      "یادآوری اجرا",

    body:
`یادآوری بیرق ماندگار
{{performance_label}}
تاریخ: {{date}}
ساعت حضور: {{attendance_time}}
محل: {{venue_name}}
لطفاً برای حضور به‌موقع برنامه‌ریزی کنید.`,

    category:
      "transactional",
  },

  {
    key:
      "performance_time_changed",

    title:
      "تغییر ساعت اجرا",

    body:
`اطلاع‌رسانی بیرق ماندگار
ساعت اجرای {{performance_label}} تغییر کرده است.
تاریخ: {{date}}
ساعت حضور جدید: {{attendance_time}}
شروع اجرا: {{start_time}}`,

    category:
      "transactional",
  },

  {
    key:
      "performance_venue_changed",

    title:
      "تغییر محل اجرا",

    body:
`اطلاع‌رسانی بیرق ماندگار
محل اجرای {{performance_label}} تغییر کرده است.
تاریخ: {{date}}
محل جدید: {{venue_name}}
آدرس: {{venue_address}}`,

    category:
      "transactional",
  },

  {
    key:
      "ticket_link",

    title:
      "ارسال لینک بلیت",

    body:
`بیرق ماندگار
بلیت شما:
{{ticket_url}}
کد پیگیری: {{tracking_code}}`,

    category:
      "transactional",
  },
];


async function main() {
  await sequelize.authenticate();


  for (
    const item
    of templates
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
        },
      });


    if (!created) {
      template.title =
        item.title;

      template.body =
        item.body;

      template.category =
        item.category;

      template.is_system =
        true;

      await template.save();
    }


    console.log(
      `${
        created
          ? "✅ created"
          : "↪ updated"
      }: ${item.key}`
    );
  }


  console.log(
    "✅ SMS templates ready."
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
