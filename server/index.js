import "dotenv/config";
// server/index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import {
  redactAccessUrl,
} from "./security/access-log.js";
import { randomBytes } from "crypto";
import { Op } from "sequelize";

import { setupAdmin } from "./admin.js";
import {
  sequelize,
  Production,
  Performance,
  Reservation,
  Venue,
  News,
} from "./models.js";
import adminApiRouter from "./admin-api.js";

import {
  adminAuditMiddleware,
} from "./audit.js";

// ADMIN_AUDIT_V1

import {
  notifyReservationStatus,
} from "./sms/reservation-status-notifier.js";

import authRouter from "./auth-routes.js";
import {
  assertAuthConfigured,
  requireAdmin,
  requireAdminOrigin,
} from "./auth.js";

import {
  otpRouter,
  reservationOtpGuard,
} from "./otp-routes.js";

import {
  assertOtpConfigured,
  ensureOtpSchema,
  consumeReservationOtpGrant,
} from "./otp-service.js";


function createTrackingCode() {
  const stamp =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    randomBytes(8)
      .toString("hex")
      .toUpperCase();

  return `BM-${stamp}-${random}`;
}


function normalizeDigits(value) {
  return String(
    value ?? ""
  )
    .replace(
      /[۰-۹]/g,
      (char) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(
            char
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (char) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            char
          )
        )
    );
}

async function startServer() {
  assertAuthConfigured();
  assertOtpConfigured();

  const app = express();

  await ensureOtpSchema();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  /*
   * Reverse proxies such as Nginx must be
   * trusted explicitly so req.ip and
   * express-rate-limit work correctly.
   */
  if (
    process.env.TRUST_PROXY ===
    "1"
  ) {
    app.set(
      "trust proxy",
      1
    );
  }


  const allowedOrigins =
    String(
      process.env.CORS_ORIGINS ||
      "http://localhost:5173"
    )
      .split(",")
      .map(
        (value) =>
          value.trim()
      )
      .filter(Boolean);


  /*
   * Tracking codes behave like access tokens.
   * Never put the raw value in HTTP access logs.
   */
  morgan.token(
    "safe-url",
    (req) =>
      redactAccessUrl(
        req.originalUrl ||
        req.url
      )
  );


  app.use(
    morgan(
      ":method :safe-url :status :res[content-length] - :response-time ms"
    )
  );


  app.use(
    cors({
      origin(
        origin,
        callback
      ) {
        if (
          !origin ||
          allowedOrigins.includes(
            origin
          )
        ) {
          return callback(
            null,
            true
          );
        }

        return callback(
          null,
          false
        );
      },

      credentials:
        false,
    })
  );

  app.use(express.json({ limit: "1mb" }));


  // HEALTH_CHECK_V1
  app.get(
    "/api/health",
    async (req, res) => {
      try {
        await sequelize.authenticate();

        return res.json({
          ok: true,
          service:
            "beyragh-api",
          database:
            "ready",
        });

      } catch (error) {
        console.error(
          "Health check failed:",
          error
        );

        return res.status(503).json({
          ok: false,
          service:
            "beyragh-api",
          database:
            "unavailable",
        });
      }
    }
  );


  app.use(
    "/api/",
    rateLimit({
      windowMs: 60_000,
      max: 100,
    })
  );

  await setupAdmin(app);


  // RESERVATION_RATE_LIMIT_V1
  const reservationLimiter =
    rateLimit({
      windowMs:
        60_000,
      max: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        message:
          "تعداد درخواست‌های رزرو بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
      },
    });

  // TICKET_LOOKUP_RATE_LIMIT_V1
  const ticketLookupLimiter =
    rateLimit({
      windowMs:
        60_000,

      max:
        20,

      standardHeaders:
        true,

      legacyHeaders:
        false,

      message: {
        message:
          "تعداد درخواست‌های بررسی بلیت بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
      },
    });


  // ============================
  // Public API
  // ============================

  app.use(
    "/api/otp",
    otpRouter
  );


  app.get("/api/productions", async (req, res) => {
    try {
      const items = await Production.findAll({
        where: { status: "published" },
        include: [
          {
            model: Performance,
            as: "performances",
          },
        ],
        order: [
          [{ model: Performance, as: "performances" }, "date", "ASC"],
          [{ model: Performance, as: "performances" }, "time", "ASC"],
        ],
      });

      res.json(items);
    } catch (error) {
      console.error("Production API error:", error);
      res.status(500).json({ message: "خطا در دریافت نمایش‌ها" });
    }
  });

  app.get("/api/performances", async (req, res) => {
    try {
      const items = await Performance.findAll({
        include: [
          {
            model: Production,
            as: "production",
            attributes: ["id", "title", "slug", "subtitle"],
          },
        ],
        order: [
          ["date", "ASC"],
          ["time", "ASC"],
        ],
      });

      res.json(items);
    } catch (error) {
      console.error("Performance API error:", error);
      res.status(500).json({ message: "خطا در دریافت اجراها" });
    }
  });

  // Backward-compatible endpoint used by the current booking UI.
  app.get("/api/shows", async (req, res) => {
    try {
      const items = await Performance.findAll({
        include: [
          {
            model: Production,
            as: "production",
            attributes: ["id", "title", "slug", "subtitle"],
          },
        ],
        order: [
          ["date", "ASC"],
          ["time", "ASC"],
        ],
      });

      res.json(
        items.map((item) => ({
          id: item.id,
          title: item.production?.title || "بیرق ماندگار",
          date: item.date,
          time: item.time,
          capacity: item.remaining_capacity,
          totalCapacity: item.capacity,
          remainingCapacity: item.remaining_capacity,
          status: item.status,
          bookingEnabled: item.booking_enabled,
          label: item.label,
          productionId: item.production_id,
        }))
      );
    } catch (error) {
      console.error("Shows compatibility API error:", error);
      res.status(500).json({ message: "خطا در دریافت سانس‌ها" });
    }
  });


  // PUBLIC_PERFORMANCE_DETAILS_V1
  app.get(
    "/api/performances/:id/details",
    async (req, res) => {
      try {
        const id =
          Number(req.params.id);

        if (
          !Number.isInteger(id) ||
          id < 1
        ) {
          return res.status(400).json({
            message:
              "شناسه اجرا نامعتبر است.",
          });
        }

        const performance =
          await Performance.findByPk(
            id,
            {
              include: [
                {
                  model:
                    Production,
                  as:
                    "production",
                },
                {
                  model:
                    Venue,
                  as:
                    "venue",
                  required: false,
                },
              ],
            }
          );

        if (!performance) {
          return res.status(404).json({
            message:
              "اجرای موردنظر یافت نشد.",
          });
        }

        return res.json({
          ok: true,

          performance: {
            id:
              performance.id,

            productionId:
              performance.production_id,

            label:
              performance.label,

            date:
              performance.date,

            time:
              performance.time,

            attendanceTime:
              performance.attendance_time,

            endTime:
              performance.end_time,

            ticketNote:
              performance.ticket_note,

            capacity:
              performance.capacity,

            remainingCapacity:
              performance.remaining_capacity,

            status:
              performance.status,

            bookingEnabled:
              Boolean(
                performance.booking_enabled
              ),

            production:
              performance.production
                ? {
                    id:
                      performance.production.id,

                    title:
                      performance.production.title,

                    slug:
                      performance.production.slug,

                    subtitle:
                      performance.production.subtitle,

                    poster:
                      performance.production.poster,
                  }
                : null,

            venue:
              performance.venue
                ? {
                    id:
                      performance.venue.id,

                    name:
                      performance.venue.name,

                    slug:
                      performance.venue.slug,

                    hallName:
                      performance.venue.hall_name,

                    address:
                      performance.venue.address,

                    entranceNote:
                      performance.venue.entrance_note,

                    accessNote:
                      performance.venue.access_note,

                    latitude:
                      performance.venue.latitude,

                    longitude:
                      performance.venue.longitude,

                    googleMapsUrl:
                      performance.venue.google_maps_url,

                    neshanUrl:
                      performance.venue.neshan_url,

                    baladUrl:
                      performance.venue.balad_url,

                    wazeUrl:
                      performance.venue.waze_url,
                  }
                : null,
          },
        });

      } catch (error) {
        console.error(
          "Public performance details error:",
          error
        );

        return res.status(500).json({
          message:
            "خطا در دریافت اطلاعات اجرا.",
        });
      }
    }
  );


  // PUBLIC_TICKET_MVP_V1
  app.get(
    "/api/tickets/:trackingCode",
    ticketLookupLimiter,
    async (req, res) => {
      try {
        const trackingCode =
          String(
            req.params.trackingCode ||
            ""
          )
            .trim()
            .toUpperCase();

        if (
          !/^[A-Z0-9-]{6,80}$/.test(
            trackingCode
          )
        ) {
          return res.status(400).json({
            message:
              "کد پیگیری نامعتبر است.",
          });
        }

        const reservation =
          await Reservation.findOne({
            where: {
              tracking_code:
                trackingCode,
            },
          });

        if (!reservation) {
          return res.status(404).json({
            message:
              "بلیت یا رزرو موردنظر یافت نشد.",
          });
        }

        const performance =
          await Performance.findByPk(
            reservation.performance_id
          );

        if (!performance) {
          return res.status(404).json({
            message:
              "اطلاعات اجرای این رزرو یافت نشد.",
          });
        }

        const production =
          performance.production_id
            ? await Production.findByPk(
                performance.production_id
              )
            : null;

        const venue =
          performance.venue_id
            ? await Venue.findByPk(
                performance.venue_id
              )
            : null;

        res.set(
          "Cache-Control",
          "private, no-store, max-age=0"
        );

        return res.json({
          ok: true,

          ticket: {
            trackingCode:
              reservation.tracking_code,

            status:
              reservation.status,

            count:
              reservation.count,

            production:
              production
                ? {
                    title:
                      production.title,

                    slug:
                      production.slug,
                  }
                : null,

            performance: {
              id:
                performance.id,

              label:
                performance.label,

              date:
                performance.date,

              time:
                performance.time,

              attendanceTime:
                performance.attendance_time,

              endTime:
                performance.end_time,

              ticketNote:
                performance.ticket_note,
            },

            venue:
              venue
                ? {
                    name:
                      venue.name,

                    hallName:
                      venue.hall_name,

                    address:
                      venue.address,

                    googleMapsUrl:
                      venue.google_maps_url,

                    neshanUrl:
                      venue.neshan_url,

                    baladUrl:
                      venue.balad_url,

                    wazeUrl:
                      venue.waze_url,
                  }
                : null,
          },
        });

      } catch (error) {
        console.error(
          "Public Ticket API error:",
          error
        );

        return res.status(500).json({
          message:
            "خطا در دریافت اطلاعات بلیت.",
        });
      }
    }
  );


  app.post(
    "/api/reservations",
    reservationLimiter,
    reservationOtpGuard,
    async (req, res) => {
    const transaction =
  await sequelize.transaction({
    type: "IMMEDIATE",
  });

    try {
      const {
        name,
        phone,
        nationalId,
        count,
        showtime,
      } = req.body || {};

      /* NATIONAL_ID_CHECKSUM_V1 */

      const normalizedNationalId = String(
        nationalId || ""
      )
        .split("")
        .map((char) => {
          const faIndex =
            "۰۱۲۳۴۵۶۷۸۹".indexOf(char);

          if (faIndex >= 0) {
            return String(faIndex);
          }

          const arIndex =
            "٠١٢٣٤٥٦٧٨٩".indexOf(char);

          if (arIndex >= 0) {
            return String(arIndex);
          }

          return char;
        })
        .filter(
          (char) =>
            char >= "0" &&
            char <= "9"
        )
        .join("");


      function isValidIranianNationalId(value) {
        if (value.length !== 10) {
          return false;
        }

        const allSame =
          [...value].every(
            (char) =>
              char === value[0]
          );

        if (allSame) {
          return false;
        }

        let sum = 0;

        for (
          let index = 0;
          index < 9;
          index += 1
        ) {
          sum +=
            Number(value[index]) *
            (10 - index);
        }

        const remainder =
          sum % 11;

        const expectedCheckDigit =
          remainder < 2
            ? remainder
            : 11 - remainder;

        return (
          Number(value[9]) ===
          expectedCheckDigit
        );
      }


      if (
        !isValidIranianNationalId(
          normalizedNationalId
        )
      ) {
        if (!transaction.finished) {
          await transaction.rollback();
        }

        return res.status(400).json({
          message:
            "کد ملی واردشده معتبر نیست.",
        });
      }



      const ticketCount =
        Number(count);

      const performanceId =
        Number(showtime?.showtimeId);

      const cleanName =
        String(name || "").trim();

      const cleanPhone =
        normalizeDigits(
          phone
        )
          .replace(
            /\D/g,
            ""
          );

      const cleanNationalId =
        normalizedNationalId;

      if (
        !cleanName ||
        !/^09\d{9}$/.test(cleanPhone) ||
        !/^\d{10}$/.test(cleanNationalId) ||
        !Number.isInteger(ticketCount) ||
        ticketCount < 1 ||
        ticketCount > 20 ||
        !Number.isInteger(performanceId) ||
        performanceId < 1
      ) {
        await transaction.rollback();

        return res.status(400).json({
          message:
            "اطلاعات رزرو ناقص یا نامعتبر است.",
        });
      }

      const performance =
        await Performance.findByPk(
          performanceId,
          {
            transaction,
          }
        );

      if (!performance) {
        await transaction.rollback();

        return res.status(404).json({
          message:
            "اجرای انتخاب‌شده یافت نشد.",
        });
      }

      if (
        performance.status !== "active" ||
        !performance.booking_enabled
      ) {
        await transaction.rollback();

        return res.status(409).json({
          message:
            "رزرو این اجرا بسته است.",
        });
      }

      /*
       * Atomic capacity update:
       * capacity is reduced only if enough
       * remaining seats still exist at the
       * exact moment of UPDATE.
       */
      const [affectedRows] =
        await Performance.update(
          {
            remaining_capacity:
              sequelize.literal(
                `remaining_capacity - ${ticketCount}`
              ),
          },
          {
            where: {
              id: performanceId,
              status: "active",
              booking_enabled: true,
              remaining_capacity: {
                [Op.gte]: ticketCount,
              },
            },
            transaction,
          }
        );

      if (affectedRows !== 1) {
        await transaction.rollback();

        const current =
          await Performance.findByPk(
            performanceId
          );

        return res.status(409).json({
          message:
            "ظرفیت کافی برای تعداد بلیت انتخاب‌شده وجود ندارد.",
          remainingCapacity:
            current?.remaining_capacity ?? 0,
        });
      }

      /*
       * Consume the OTP grant inside the SAME
       * reservation transaction.
       *
       * If reservation creation later fails,
       * SQLite rolls this used_at change back too.
       */
      if (
        req.otpVerificationChallengeId
      ) {
        await consumeReservationOtpGrant({
          challengeId:
            req.otpVerificationChallengeId,

          transaction,
        });
      }


      const reservation =
        await Reservation.create(
          {
            performance_id:
              performanceId,

            name:
              cleanName,

            phone:
              cleanPhone,

            national_id: normalizedNationalId,

            count:
              ticketCount,

            tracking_code:
              createTrackingCode(),

            status:
              "confirmed",
          },
          {
            transaction,
          }
        );

      await transaction.commit();

      // RESERVATION_TRANSACTIONAL_SMS_V1
      Promise.resolve()
        .then(() =>
          notifyReservationStatus({
            reservationId:
              reservation.id,

            event:
              "confirmed",

            idempotencyKey:
              `reservation-status:${reservation.id}:created`,
          })
        )
        .catch((error) => {
          console.error(
            "Reservation transactional SMS error:",
            error
          );
        });


      const updatedPerformance =
        await Performance.findByPk(
          performanceId
        );

      res.status(201).json({
        ok: true,

        reservationId:
          reservation.id,

        trackingCode:
          reservation.tracking_code,

        remainingCapacity:
          updatedPerformance
            ?.remaining_capacity,
      });

    } catch (error) {

      if (!transaction.finished) {
        await transaction.rollback();
      }

      console.error(
        "Reservation error:",
        error
      );

      res.status(500).json({
        message:
          "خطای داخلی سرور.",
      });
    }
  });

  // ============================
  // Authentication
  // ============================

  // ============================
  // Authentication
  // ============================


  // PUBLIC_NEWS_API_V1
  app.get(
    "/api/news",
    async (req, res) => {
      try {
        const rawLimit =
          Number(
            req.query?.limit
          );

        const limit =
          Number.isInteger(
            rawLimit
          ) &&
          rawLimit > 0
            ? Math.min(
                rawLimit,
                50
              )
            : 50;

        const items =
          await News.findAll({
            where: {
              status:
                "published",
            },

            order: [
              [
                "published_at",
                "DESC",
              ],
              [
                "id",
                "DESC",
              ],
            ],

            limit,
          });

        return res.json(items);

      } catch (error) {
        console.error(
          "Public news list error:",
          error
        );

        return res.status(500).json({
          message:
            "خطا در دریافت اخبار",
        });
      }
    }
  );


  app.get(
    "/api/news/:slug",
    async (req, res) => {
      try {
        const slug =
          String(
            req.params.slug ||
            ""
          ).trim();

        if (!slug) {
          return res.status(400).json({
            message:
              "نامک خبر نامعتبر است.",
          });
        }

        const item =
          await News.findOne({
            where: {
              slug,
              status:
                "published",
            },
          });

        if (!item) {
          return res.status(404).json({
            message:
              "خبر یافت نشد.",
          });
        }

        return res.json(item);

      } catch (error) {
        console.error(
          "Public news detail error:",
          error
        );

        return res.status(500).json({
          message:
            "خطا در دریافت خبر",
        });
      }
    }
  );


  app.use("/api/auth", authRouter);

  // ============================
  // Admin API
  // ============================

  app.use(
    "/api/admin",
    requireAdmin,
    requireAdminOrigin,
    adminAuditMiddleware,
    adminApiRouter
  );

// ============================
// React Admin Panel — port 4000 only
// ============================

const adminDist = path.join(process.cwd(), "dist-admin");

app.use(
  "/admin/assets",
  express.static(path.join(adminDist, "assets"), {
    redirect: false,
    index: false,
  })
);

app.get(["/admin", "/admin/", "/admin/*"], (req, res) => {
  res.sendFile(path.join(adminDist, "index.html"));
});


  // SPA fallback for internal admin routes such as /admin/shows.
  app.get(/^\/admin\/.*$/, (req, res) => {
    res.sendFile(path.join(adminDist, "index.html"));
  });

  app.use((req, res) => {
    res.status(404).json({ message: "مسیر یافت نشد" });
  });

  const PORT =
    process.env.PORT ||
    4000;


  const server =
    app.listen(
      PORT,
      () => {
        console.log(
          `✅ Server running on http://localhost:${PORT}`
        );

        console.log(
          `🔧 Admin panel at http://localhost:${PORT}/admin/`
        );
      }
    );


  let shuttingDown =
    false;


  async function shutdown(
    signal
  ) {
    if (shuttingDown) {
      return;
    }

    shuttingDown =
      true;

    console.log(
      `🛑 ${signal} received. Graceful shutdown started.`
    );


    const forceExitTimer =
      setTimeout(
        () => {
          console.error(
            "❌ Graceful shutdown timed out."
          );

          process.exit(
            1
          );
        },
        10_000
      );

    forceExitTimer.unref();


    server.close(
      async (error) => {
        try {
          if (error) {
            throw error;
          }

          await sequelize.close();

          clearTimeout(
            forceExitTimer
          );

          console.log(
            "✅ Server stopped cleanly."
          );

          process.exit(
            0
          );

        } catch (shutdownError) {
          console.error(
            "❌ Shutdown failed:",
            shutdownError
          );

          process.exit(
            1
          );
        }
      }
    );
  }


  process.once(
    "SIGTERM",
    () =>
      shutdown(
        "SIGTERM"
      )
  );


  process.once(
    "SIGINT",
    () =>
      shutdown(
        "SIGINT"
      )
  );
}

startServer().catch((error) => {
  console.error("خطا در راه‌اندازی سرور:", error);
});
