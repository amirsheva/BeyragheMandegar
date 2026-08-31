import {
  DataTypes,
} from "sequelize";

import {
  sequelize,
} from "../models.js";


async function ensureColumn(
  tableName,
  columnName,
  definition
) {
  const queryInterface =
    sequelize.getQueryInterface();

  const columns =
    await queryInterface
      .describeTable(
        tableName
      );


  if (
    columns[
      columnName
    ]
  ) {
    console.log(
      `↪ ${tableName}.${columnName} already exists`
    );

    return;
  }


  await queryInterface
    .addColumn(
      tableName,
      columnName,
      definition
    );


  console.log(
    `✅ ${tableName}.${columnName} added`
  );
}


async function main() {
  await sequelize.authenticate();


  await ensureColumn(
    "sms_templates",
    "provider_template_id",
    {
      type:
        DataTypes.INTEGER,

      allowNull:
        true,
    }
  );


  await ensureColumn(
    "sms_templates",
    "provider_method",
    {
      type:
        DataTypes.STRING,

      allowNull:
        true,
    }
  );


  await ensureColumn(
    "sms_messages",
    "send_method",
    {
      type:
        DataTypes.STRING,

      allowNull:
        false,

      defaultValue:
        "text",
    }
  );


  await ensureColumn(
    "sms_messages",
    "provider_pack_id",
    {
      type:
        DataTypes.STRING,

      allowNull:
        true,
    }
  );


  await ensureColumn(
    "sms_messages",
    "line_number",
    {
      type:
        DataTypes.STRING,

      allowNull:
        true,
    }
  );


  await ensureColumn(
    "sms_messages",
    "delivery_state",
    {
      type:
        DataTypes.INTEGER,

      allowNull:
        true,
    }
  );


  await ensureColumn(
    "sms_messages",
    "delivery_checked_at",
    {
      type:
        DataTypes.DATE,

      allowNull:
        true,
    }
  );


  await ensureColumn(
    "sms_messages",
    "scheduled_at",
    {
      type:
        DataTypes.DATE,

      allowNull:
        true,
    }
  );


  console.log(
    "✅ SMS.ir DB migration completed."
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
