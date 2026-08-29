import "dotenv/config";

import smsirProvider
  from "../sms/providers/smsir-provider.js";


async function main() {
  console.log(
    "=== SMS.ir Sandbox Test ==="
  );


  console.log(
    "\n1) Credit"
  );

  const credit =
    await smsirProvider
      .getCredit();

  console.log(
    credit
  );


  console.log(
    "\n2) Lines"
  );

  const lines =
    await smsirProvider
      .getLines();

  console.log(
    lines
  );


  console.log(
    "\n3) Sandbox Verify"
  );

  const result =
    await smsirProvider
      .sendSandboxVerify({
        mobile:
          "09120000000",

        code:
          "12345",
      });


  console.log({
    ok:
      result.ok,

    messageId:
      result.messageId,

    cost:
      result.cost,
  });


  if (
    result.messageId
  ) {
    console.log(
      "\n4) Delivery Report"
    );


    try {
      const report =
        await smsirProvider
          .getMessageStatus(
            result.messageId
          );


      console.log({
        messageId:
          report.messageId,

        deliveryState:
          report.deliveryState,

        cost:
          report.cost,

        sendDateTime:
          report.sendDateTime,

        deliveryDateTime:
          report.deliveryDateTime,
      });

    } catch (error) {
      /*
       * Sandbox طبق مستندات
       * گزارش‌ها را ذخیره نمی‌کند.
       * پس عدم وجود Delivery Report
       * در Sandbox الزاماً خطا در Integration نیست.
       */
      console.log(
        "ℹ️ Delivery report unavailable in Sandbox:",
        error.smsirStatus ||
        error.message
      );
    }
  }


  console.log(
    "\n✅ SMS.ir Sandbox adapter test completed."
  );
}


main().catch(
  (error) => {
    console.error(
      "\n❌ SMS.ir Sandbox test failed."
    );

    console.error({
      message:
        error.message,

      httpStatus:
        error.httpStatus,

      smsirStatus:
        error.smsirStatus,
    });


    process.exit(1);
  }
);
