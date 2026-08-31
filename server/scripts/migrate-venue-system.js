import {
  DataTypes,
} from "sequelize";

import {
  sequelize,
  Venue,
} from "../models.js";


async function addColumnIfMissing(
  table,
  columns,
  name,
  definition
) {
  if (columns[name]) {
    console.log(`↪ exists: ${table}.${name}`);
    return;
  }

  await sequelize
    .getQueryInterface()
    .addColumn(
      table,
      name,
      definition
    );

  console.log(`✅ added: ${table}.${name}`);
}


async function main() {
  await sequelize.authenticate();

  await Venue.sync();

  console.log("✅ venues table ready");


  const qi =
    sequelize.getQueryInterface();

  const columns =
    await qi.describeTable(
      "performances"
    );


  await addColumnIfMissing(
    "performances",
    columns,
    "venue_id",
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  );


  await addColumnIfMissing(
    "performances",
    columns,
    "attendance_time",
    {
      type: DataTypes.STRING,
      allowNull: true,
    }
  );


  await addColumnIfMissing(
    "performances",
    columns,
    "end_time",
    {
      type: DataTypes.STRING,
      allowNull: true,
    }
  );


  await addColumnIfMissing(
    "performances",
    columns,
    "ticket_note",
    {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  );


  console.log(
    "✅ Venue migration completed."
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
