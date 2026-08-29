import {
  sequelize,
  Production,
  Performance,
  Venue,
} from "../models.js";

const TICKET_NOTE =
  "۵ صلوات برای سلامتی و تعجیل در فرج حضرت صاحب‌الزمان علیه‌السلام";

const DATES = [
  "1403/09/02",
  "1403/09/03",
  "1403/09/04",
  "1403/09/05",
  "1403/09/06",
];

async function main() {
  await sequelize.authenticate();

  const production =
    await Production.findOne({
      where: {
        slug: "beyragh-mandegar",
      },
    });

  if (!production) {
    throw new Error(
      "Production beyragh-mandegar پیدا نشد."
    );
  }

  const [venue] =
    await Venue.findOrCreate({
      where: {
        slug: "kowsar-region-14",
      },

      defaults: {
        name: "سالن اجتماعات کوثر",
        slug: "kowsar-region-14",
        hall_name: null,

        address:
          "تهران، میدان شهداء، کنارگذر خیابان پیروزی، بعد از اتوبان امام علی علیه‌السلام، خیابان اشارات، خیابان میرهاشمی، خیابان شفا، خیابان نیکزاد رهبر، جنب آموزش و پرورش منطقه ۱۴، سالن اجتماعات کوثر",

        entrance_note: null,
        access_note: null,

        latitude: null,
        longitude: null,

        google_maps_url: null,
        neshan_url: null,
        balad_url: null,
        waze_url: null,

        status: "active",
      },
    });

  for (
    let index = 0;
    index < DATES.length;
    index += 1
  ) {
    const date = DATES[index];

    const labels = [
      "شب اول",
      "شب دوم",
      "شب سوم",
      "شب چهارم",
      "شب پایانی",
    ];

    const [performance, created] =
      await Performance.findOrCreate({
        where: {
          production_id:
            production.id,
          date,
          time: "18:45",
        },

        defaults: {
          production_id:
            production.id,

          venue_id:
            venue.id,

          date,
          time: "18:45",

          attendance_time:
            "18:30",

          end_time:
            "20:00",

          ticket_note:
            TICKET_NOTE,

          capacity: 150,

          remaining_capacity:
            150,

          status:
            "archived",

          booking_enabled:
            false,

          label:
            `سالن اجتماعات کوثر — ${labels[index]}`,
        },
      });

    await performance.update({
      venue_id:
        venue.id,

      attendance_time:
        "18:30",

      end_time:
        "20:00",

      ticket_note:
        TICKET_NOTE,

      capacity:
        150,

      /*
       * برای آرشیو تاریخی تعداد واقعی رزرو/
       * تماشاگر هر شب را نمی‌دانیم.
       * remaining_capacity را به معنی
       * فروش واقعی تفسیر نمی‌کنیم.
       */
      remaining_capacity:
        150,

      status:
        "archived",

      booking_enabled:
        false,

      label:
        `سالن اجتماعات کوثر — ${labels[index]}`,
    });

    console.log(
      `${
        created
          ? "✅ created"
          : "↪ updated"
      }: ${date} — ظرفیت 150`
    );
  }

  console.log(
    "✅ Kowsar archive ready."
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
