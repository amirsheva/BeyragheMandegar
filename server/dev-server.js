import dotenv from "dotenv";

dotenv.config({
  path: ".env",
  override: true,
});

console.log(
  `🧪 Dev env: portal=${process.env.CUSTOMER_PORTAL_ENABLED}, otp=${process.env.OTP_PROVIDER}, adminTestOtp=${process.env.ADMIN_TEST_OTP_ENABLED}`
);

await import("./index.js");
