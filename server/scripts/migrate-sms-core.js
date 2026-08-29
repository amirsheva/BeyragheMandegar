import {
  sequelize,
} from "../models.js";

import {
  SmsTemplate,
  SmsCampaign,
  SmsMessage,
} from "../sms/models.js";


async function main() {
  await sequelize.authenticate();

  await SmsTemplate.sync();

  console.log(
    "✅ sms_templates ready"
  );


  await SmsCampaign.sync();

  console.log(
    "✅ sms_campaigns ready"
  );


  await SmsMessage.sync();

  console.log(
    "✅ sms_messages ready"
  );


  console.log(
    "✅ SMS core migration completed."
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
