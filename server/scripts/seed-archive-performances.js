import {
  sequelize,
  Production,
  Performance,
} from "../models.js";


const rows = [
  {
    date: "1404/08/09",
    time: "20:00",
    label: "حکیمیه — شب اول",
  },
  {
    date: "1404/08/10",
    time: "20:00",
    label: "حکیمیه — شب دوم",
  },
  {
    date: "1404/08/11",
    time: "20:00",
    label: "حکیمیه — شب سوم",
  },
  {
    date: "1404/08/12",
    time: "20:00",
    label: "حکیمیه — شب چهارم",
  },
  {
    date: "1404/08/13",
    time: "20:00",
    label: "حکیمیه — شب پایانی",
  },

  {
    date: "1404/09/12",
    time: "19:30",
    label: "فرهنگسرای خاوران — شب اول",
  },
  {
    date: "1404/09/13",
    time: "19:30",
    label: "فرهنگسرای خاوران — شب دوم",
  },
  {
    date: "1404/09/14",
    time: "19:30",
    label: "فرهنگسرای خاوران — شب پایانی",
  },
];


async function main() {
  await sequelize.sync();

  const production =
    await Production.findOne({
      where: {
        slug: "beyragh-mandegar",
      },
    });


  if (!production) {
    throw new Error(
      "Production با slug=beyragh-mandegar پیدا نشد."
    );
  }


  for (const row of rows) {
    const [
      item,
      created,
    ] = await Performance.findOrCreate({
      where: {
        production_id:
          production.id,

        date:
          row.date,

        label:
          row.label,
      },

      defaults: {
        production_id:
          production.id,

        date:
          row.date,

        time:
          row.time,

        capacity: 0,

        remaining_capacity: 0,

        status:
          "archived",

        booking_enabled:
          false,

        label:
          row.label,
      },
    });


    if (!created) {
      item.time =
        row.time;

      item.capacity = 0;

      item.remaining_capacity = 0;

      item.status =
        "archived";

      item.booking_enabled =
        false;

      await item.save();
    }


    console.log(
      created
        ? `✅ created: ${row.date} — ${row.label}`
        : `♻️ updated: ${row.date} — ${row.label}`
    );
  }


  await sequelize.close();

  console.log(
    "✅ Archive performances ready."
  );
}


main().catch(async (error) => {
  console.error(error);

  try {
    await sequelize.close();
  } catch {}

  process.exit(1);
});
