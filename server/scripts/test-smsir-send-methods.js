import "dotenv/config";

import smsirProvider
  from "../sms/providers/smsir-provider.js";


async function main() {
  console.log(
    "=== SMS.ir Send Methods Test ==="
  );


  console.log(
    "\n1) Bulk"
  );

  const bulk =
    await smsirProvider
      .sendBulk({
        messageText:
          "تست گروهی Sandbox بیرق ماندگار",

        mobiles: [
          "09120000000",
          "09120000001",
        ],
      });


  console.log({
    packId:
      bulk.packId,

    messageIds:
      bulk.messageIds,

    cost:
      bulk.cost,

    scheduled:
      bulk.scheduled,
  });


  console.log(
    "\n2) LikeToLike"
  );

  const likeToLike =
    await smsirProvider
      .sendLikeToLike({
        mobiles: [
          "09120000000",
          "09120000001",
        ],

        messageTexts: [
          "پیام آزمایشی شماره یک",
          "پیام آزمایشی شماره دو",
        ],
      });


  console.log({
    packId:
      likeToLike.packId,

    messageIds:
      likeToLike.messageIds,

    cost:
      likeToLike.cost,

    scheduled:
      likeToLike.scheduled,
  });


  if (
    bulk.packId
  ) {
    console.log(
      "\n3) Pack Report"
    );

    try {
      const report =
        await smsirProvider
          .getPack(
            bulk.packId
          );

      console.log(
        report
      );

    } catch (error) {
      console.log(
        "ℹ️ Pack report unavailable:",
        error.smsirStatus ||
        error.message
      );
    }
  }


  console.log(
    "\n✅ SMS.ir send-method tests completed."
  );
}


main().catch(
  (error) => {
    console.error(
      "\n❌ SMS.ir send-method test failed."
    );

    console.error({
      message:
        error.message,

      httpStatus:
        error.httpStatus,

      smsirStatus:
        error.smsirStatus,

      smsirData:
        error.smsirData,
    });

    process.exit(1);
  }
);
