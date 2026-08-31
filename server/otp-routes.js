import express
  from "express";

import rateLimit
  from "express-rate-limit";

import {
  OtpError,
  isReservationOtpRequired,
  requestReservationOtp,
  verifyReservationOtp,
  validateReservationOtpGrant,
} from "./otp-service.js";


const otpRouter =
  express.Router();


const requestLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max:
      8,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "تعداد درخواست‌های کد تأیید بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",

      code:
        "OTP_IP_RATE_LIMIT",
    },
  });


const verifyLimiter =
  rateLimit({
    windowMs:
      10 * 60 * 1000,

    max:
      30,

    standardHeaders:
      true,

    legacyHeaders:
      false,

    message: {
      message:
        "تعداد تلاش‌های تأیید بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",

      code:
        "OTP_VERIFY_RATE_LIMIT",
    },
  });


function sendOtpError(
  res,
  error
) {
  if (
    error instanceof
    OtpError
  ) {
    const payload = {
      message:
        error.message,

      code:
        error.code,
    };


    if (
      Number.isFinite(
        error.retryAfterSeconds
      )
    ) {
      payload.retryAfterSeconds =
        error.retryAfterSeconds;
    }


    return res
      .status(
        error.status
      )
      .json(
        payload
      );
  }


  console.error(
    "OTP API error:",
    error
  );


  return res
    .status(500)
    .json({
      message:
        "خطا در سرویس تأیید شماره موبایل.",

      code:
        "OTP_INTERNAL_ERROR",
    });
}


otpRouter.post(
  "/request",
  requestLimiter,
  async (
    req,
    res
  ) => {
    try {
      res.set(
        "Cache-Control",
        "private, no-store, max-age=0"
      );


      const result =
        await requestReservationOtp({
          phone:
            req.body?.phone,
        });


      return res.json({
        ok:
          true,

        ...result,
      });

    } catch (error) {
      return sendOtpError(
        res,
        error
      );
    }
  }
);


otpRouter.post(
  "/verify",
  verifyLimiter,
  async (
    req,
    res
  ) => {
    try {
      res.set(
        "Cache-Control",
        "private, no-store, max-age=0"
      );


      const result =
        await verifyReservationOtp({
          challengeId:
            req.body
              ?.challengeId,

          code:
            req.body
              ?.code,
        });


      return res.json({
        ok:
          true,

        ...result,
      });

    } catch (error) {
      return sendOtpError(
        res,
        error
      );
    }
  }
);


async function reservationOtpGuard(
  req,
  res,
  next
) {
  if (
    !isReservationOtpRequired()
  ) {
    return next();
  }


  try {
    const result =
      await validateReservationOtpGrant({
        verificationToken:
          req.body
            ?.verificationToken,

        phone:
          req.body
            ?.phone,
      });


    req.otpVerificationChallengeId =
      result.challengeId;


    return next();

  } catch (error) {
    return sendOtpError(
      res,
      error
    );
  }
}


export {
  otpRouter,
  reservationOtpGuard,
};