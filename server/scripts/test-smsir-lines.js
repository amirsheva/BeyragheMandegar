import "dotenv/config";

import smsirProvider
  from "../sms/providers/smsir-provider.js";


async function main() {
  console.log(
    "=== SMS.ir Line Diagnostic ==="
  );


  const {
    lines,
  } =
    await smsirProvider
      .getLines();


  console.log(
    "Available lines:",
    lines
  );


  if (
    !lines.length
  ) {
    throw new Error(
      "هیچ خطی از SMS.ir دریافت نشد."
    );
  }


  for (
    const lineNumber
    of lines
  ) {
    console.log(
      `\nTesting line: ${lineNumber}`
    );


    try {
      const result =
        await smsirProvider
          .sendBulk({
            lineNumber,

            messageText:
              "تست Sandbox بیرق ماندگار",

            mobiles: [
              "09120000000",
            ],
          });


      console.log(
        "✅ WORKING LINE"
      );

      console.log({
        lineNumber,
        packId:
          result.packId,
        messageIds:
          result.messageIds,
        cost:
          result.cost,
      });


      return;

    } catch (error) {
      console.log(
        "❌ FAILED"
      );

      console.log({
        lineNumber,
        message:
          error.message,
        httpStatus:
          error.httpStatus,
        smsirStatus:
          error.smsirStatus,
      });
    }
  }


  console.log(
    "\n❌ هیچ‌کدام از خطوط برگشتی برای Bulk در Sandbox پذیرفته نشدند."
  );
}


main().catch(
  (error) => {
    console.error(
      "\n❌ Diagnostic failed"
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
