import {
  Op,
} from "sequelize";

import {
  sequelize,
  Venue,
  Performance,
} from "../models.js";


async function main() {
  await sequelize.authenticate();

  const venue =
    await Venue.findOne({
      where: {
        [Op.or]: [
          {
            slug:
              "hakimiyeh-din-o-danesh",
          },
          {
            slug:
              "rasoulieh-din-o-danesh",
          },
          {
            name:
              "رسولیه دین و دانش",
          },
        ],
      },
    });


  if (!venue) {
    throw new Error(
      "Venue رسولیه دین و دانش پیدا نشد."
    );
  }


  await venue.update({
    name:
      "رسولیه دین و دانش",

    slug:
      "rasoulieh-din-o-danesh",

    google_maps_url:
      "https://maps.app.goo.gl/vq4r4PTfa9M46yUb9",

    neshan_url:
      "https://nshn.ir/8f_bvoY8IxyEfb",
  });


  const performances =
    await Performance.findAll({
      where: {
        venue_id:
          venue.id,
      },
    });


  for (
    const performance
    of performances
  ) {
    const label =
      String(
        performance.label || ""
      );


    if (
      label.startsWith(
        "حکیمیه"
      )
    ) {
      performance.label =
        label.replace(
          /^حکیمیه\s*—\s*/,
          "رسولیه دین و دانش — "
        );

      await performance.save();

      console.log(
        `✅ renamed: ${performance.date}`
      );
    }
  }


  console.log(
    "✅ Rasoulieh venue updated."
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
