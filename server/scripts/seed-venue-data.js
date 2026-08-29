import {
  Op,
} from "sequelize";

import {
  sequelize,
  Venue,
  Performance,
} from "../models.js";


const TICKET_NOTE =
  "۵ صلوات برای سلامتی و تعجیل در فرج حضرت صاحب‌الزمان (عج)";


async function upsertVenue(
  slug,
  values
) {
  const [
    venue,
  ] = await Venue.findOrCreate({
    where: {
      slug,
    },

    defaults: {
      slug,
      ...values,
    },
  });

  await venue.update(values);

  return venue;
}


async function main() {
  await sequelize.authenticate();

  await Venue.sync();


  const hakimiyeh =
    await upsertVenue(
      "hakimiyeh-din-o-danesh",
      {
        name:
          "رسولیه دین و دانش",

        hall_name:
          null,

        address:
          "تهران، اتوبان شهید بابایی، به سمت شرق، خروجی دوم حکیمیه، خیابان دانش (تابلوی حکیمیه بهشت)، بعد از دانش یکم، نبش اولین خیابان سمت راست، رسولیه دین و دانش",

        entrance_note:
          null,

        access_note:
          null,

        latitude:
          null,

        longitude:
          null,

        google_maps_url:
          null,

        neshan_url:
          null,

        balad_url:
          null,

        waze_url:
          null,

        status:
          "active",
      }
    );


  const khavaran =
    await upsertVenue(
      "farhangsara-khavaran",
      {
        name:
          "فرهنگسرای خاوران",

        hall_name:
          "سالن شهید مطهری",

        address:
          "تهران، میدان خراسان، خیابان خاوران، بلوار شهید سجادیان، میدان شاهد، خیابان شهید بقایی، فرهنگسرای خاوران",

        entrance_note:
          "ورود از درب شمالی فرهنگسرای خاوران",

        access_note:
          "با همکاری فرهنگسرای خاوران",

        latitude:
          null,

        longitude:
          null,

        google_maps_url:
          null,

        neshan_url:
          null,

        balad_url:
          null,

        waze_url:
          null,

        status:
          "active",
      }
    );


  await Performance.update(
    {
      venue_id:
        hakimiyeh.id,

      attendance_time:
        "19:45",

      end_time:
        "21:15",

      ticket_note:
        TICKET_NOTE,
    },
    {
      where: {
        date: {
          [Op.in]: [
            "1404/08/09",
            "1404/08/10",
            "1404/08/11",
            "1404/08/12",
            "1404/08/13",
          ],
        },
      },
    }
  );


  await Performance.update(
    {
      venue_id:
        khavaran.id,

      attendance_time:
        "19:15",

      end_time:
        "21:00",

      ticket_note:
        TICKET_NOTE,
    },
    {
      where: {
        date: {
          [Op.in]: [
            "1404/09/12",
            "1404/09/13",
            "1404/09/14",
          ],
        },
      },
    }
  );


  console.log(
    "✅ Hakimiyeh venue linked."
  );

  console.log(
    "✅ Khavaran venue linked."
  );

  console.log(
    "✅ Attendance/end time and ticket note updated."
  );


  await sequelize.close();
}


main().catch(async (error) => {
  console.error(error);

  try {
    await sequelize.close();
  } catch {}

  process.exit(1);
});
