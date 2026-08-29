import {
  DataTypes,
} from "sequelize";

import {
  sequelize,
} from "../models.js";


async function main() {
  await sequelize.authenticate();

  const queryInterface =
    sequelize.getQueryInterface();

  const columns =
    await queryInterface.describeTable(
      "sms_templates"
    );


  if (
    !columns.provider_parameters_json
  ) {
    await queryInterface.addColumn(
      "sms_templates",
      "provider_parameters_json",
      {
        type:
          DataTypes.TEXT,

        allowNull:
          true,
      }
    );

    console.log(
      "✅ sms_templates.provider_parameters_json added"
    );

  } else {
    console.log(
      "↪ sms_templates.provider_parameters_json already exists"
    );
  }


  console.log(
    "✅ SMS template mapping migration completed."
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
