import express
  from "express";

import rateLimit
  from "express-rate-limit";

import {
  sequelize,
  Reservation,
  Performance,
  Production,
  Venue,
} from "./models.js";

import {
  OtpError,
  consumeReservationOtpGrant,
  normalizePhone,
  requestReservationOtp,
  validateReservationOtpGrant,
  verifyReservationOtp,
} from "./otp-service.js";

import {
  clearCustomerCookie,
  createCustomerSessionToken,
  isCustomerPortalEnabled,
  readCustomerSession,
  requireCustomer,
  requireCustomerOrigin,
  setCustomerCookie,
} from "./customer-auth.js";


const customerRouter =
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
        "CUSTOMER_OTP_IP_RATE_LIMIT",
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
        "CUSTOMER_OTP_VERIFY_RATE_LIMIT",
    },
  });


function maskedPhone(
  phone
) {
  const clean =
    normalizePhone(
      phone
    );

  return `${clean.slice(
    0,
    4
  )}***${clean.slice(
    -4
  )}`;
}


function sendError(
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
    "Customer portal error:",
    error
  );

  return res
    .status(500)
    .json({
      message:
        "خطا در سرویس رزروهای من.",

      code:
        "CUSTOMER_INTERNAL_ERROR",
    });
}


customerRouter.use(
  (
    req,
    res,
    next
  ) => {
    if (
      !isCustomerPortalEnabled()
    ) {
      return res
        .status(503)
        .json({
          message:
            "بخش رزروهای من در حال حاضر فعال نیست.",

          code:
            "CUSTOMER_PORTAL_DISABLED",
        });
    }

    return next();
  }
);


customerRouter.use(
  requireCustomerOrigin
);


customerRouter.post(
  "/auth/request",
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
      return sendError(
        res,
        error
      );
    }
  }
);


customerRouter.post(
  "/auth/verify",
  verifyLimiter,
  async (
    req,
    res
  ) => {
    let transaction =
      null;

    try {
      res.set(
        "Cache-Control",
        "private, no-store, max-age=0"
      );

      const phone =
        normalizePhone(
          req.body?.phone
        );

      const verified =
        await verifyReservationOtp({
          challengeId:
            req.body
              ?.challengeId,

          code:
            req.body
              ?.code,
        });

      const grant =
        await validateReservationOtpGrant({
          verificationToken:
            verified
              .verificationToken,

          phone,
        });

      transaction =
        await sequelize.transaction({
          type:
            "IMMEDIATE",
        });

      await consumeReservationOtpGrant({
        challengeId:
          grant.challengeId,

        transaction,
      });

      await transaction.commit();

      const sessionToken =
        createCustomerSessionToken(
          phone
        );

      setCustomerCookie(
        res,
        sessionToken
      );

      return res.json({
        ok:
          true,

        authenticated:
          true,

        phone:
          maskedPhone(
            phone
          ),
      });

    } catch (error) {
      if (
        transaction &&
        !transaction.finished
      ) {
        await transaction
          .rollback()
          .catch(
            () => {}
          );
      }

      return sendError(
        res,
        error
      );
    }
  }
);


customerRouter.get(
  "/session",
  (
    req,
    res
  ) => {
    res.set(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    const session =
      readCustomerSession(
        req
      );

    return res.json({
      ok:
        true,

      authenticated:
        Boolean(
          session
        ),
    });
  }
);


customerRouter.delete(
  "/session",
  (
    req,
    res
  ) => {
    clearCustomerCookie(
      res
    );

    return res.json({
      ok:
        true,

      authenticated:
        false,
    });
  }
);


customerRouter.get(
  "/reservations",
  requireCustomer,
  async (
    req,
    res
  ) => {
    try {
      res.set(
        "Cache-Control",
        "private, no-store, max-age=0"
      );

      const items =
        await Reservation.findAll({
          where: {
            phone_lookup:
              req.customer
                .phoneLookup,
          },

          attributes: [
            "id",
            "name",
            "count",
            "tracking_code",
            "status",
            "createdAt",
          ],

          include: [
            {
              model:
                Performance,

              as:
                "performance",

              required:
                false,

              attributes: [
                "id",
                "label",
                "date",
                "time",
                "attendance_time",
                "end_time",
              ],

              include: [
                {
                  model:
                    Production,

                  as:
                    "production",

                  required:
                    false,

                  attributes: [
                    "id",
                    "title",
                    "slug",
                  ],
                },

                {
                  model:
                    Venue,

                  as:
                    "venue",

                  required:
                    false,

                  attributes: [
                    "id",
                    "name",
                    "hall_name",
                  ],
                },
              ],
            },
          ],

          order: [
            [
              "createdAt",
              "DESC",
            ],
          ],
        });

      return res.json({
        ok:
          true,

        reservations:
          items.map(
            (item) => ({
              id:
                item.id,

              name:
                item.name,

              count:
                item.count,

              trackingCode:
                item.tracking_code,

              status:
                item.status,

              createdAt:
                item.createdAt,

              production:
                item.performance
                  ?.production
                  ? {
                      id:
                        item.performance
                          .production
                          .id,

                      title:
                        item.performance
                          .production
                          .title,

                      slug:
                        item.performance
                          .production
                          .slug,
                    }
                  : null,

              performance:
                item.performance
                  ? {
                      id:
                        item.performance.id,

                      label:
                        item.performance.label,

                      date:
                        item.performance.date,

                      time:
                        item.performance.time,

                      attendanceTime:
                        item.performance
                          .attendance_time,

                      endTime:
                        item.performance
                          .end_time,
                    }
                  : null,

              venue:
                item.performance
                  ?.venue
                  ? {
                      id:
                        item.performance
                          .venue
                          .id,

                      name:
                        item.performance
                          .venue
                          .name,

                      hallName:
                        item.performance
                          .venue
                          .hall_name,
                    }
                  : null,
            })
          ),
      });

    } catch (error) {
      return sendError(
        res,
        error
      );
    }
  }
);


export default
  customerRouter;