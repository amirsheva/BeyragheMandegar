import "dotenv/config";

import {
  sequelize,
} from "../models.js";

import {
  queueAndSendSmsirSandboxVerify,
} from "../sms/smsir-service.js";


async function main() {
  const message =
    await queueAndSendSmsirSandboxVerify({
      phone:
        "09120000000",

      code:
        "12345",

      idempotencyKey:
        "smsir-sandbox-db-test-v1",
    });


  console.log(
    "=== SMS.ir DB Integration ==="
  );


  console.log({
    id:
      message.id,

    status:
      message.status,

    provider:
      message.provider,

    sendMethod:
      message.send_method,

    providerMessageId:
      message.provider_message_id,

    deliveryState:
      message.delivery_state,

    actualCost:
      Number(
        message.actual_cost ||
        0
      ),

    attempts:
      message.attempt_count,

    sentAt:
      message.sent_at,

    deliveredAt:
      message.delivered_at,

    deliveryCheckedAt:
      message.delivery_checked_at,
  });


  await sequelize.close();
}


main().catch(
  async (error) => {
    console.error(
      "❌ SMS.ir DB test failed:",
      error
    );

    try {
      await sequelize.close();
    } catch {}

    process.exit(1);
  }
);
