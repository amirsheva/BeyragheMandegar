// server/index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { setupAdmin } from "./admin.js";
import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "./models.js";
import adminApiRouter from "./admin-api.js";

function createTrackingCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `BM-${stamp}-${random}`;
}

async function startServer() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(morgan("tiny"));

  app.use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: false,
    })
  );

  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/api/",
    rateLimit({
      windowMs: 60_000,
      max: 100,
    })
  );

  await setupAdmin(app);

  // ============================
  // Public API
  // ============================

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

  app.post("/api/reservations", async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { name, phone, nationalId, count, showtime } = req.body || {};
      const ticketCount = Number(count);
      const performanceId = Number(showtime?.showtimeId);

      if (
        !name?.trim() ||
        !phone?.trim() ||
        !nationalId?.trim() ||
        !Number.isInteger(ticketCount) ||
        ticketCount < 1 ||
        !Number.isInteger(performanceId) ||
        performanceId < 1
      ) {
        await transaction.rollback();
        return res.status(400).json({ message: "اطلاعات رزرو ناقص یا نامعتبر است." });
      }

      const performance = await Performance.findByPk(performanceId, {
        transaction,
      });

      if (!performance) {
        await transaction.rollback();
        return res.status(404).json({ message: "اجرای انتخاب‌شده یافت نشد." });
      }

      if (performance.status !== "active" || !performance.booking_enabled) {
        await transaction.rollback();
        return res.status(409).json({ message: "رزرو این اجرا بسته است." });
      }

      if (performance.remaining_capacity < ticketCount) {
        await transaction.rollback();
        return res.status(409).json({
          message: "ظرفیت کافی برای تعداد بلیت انتخاب‌شده وجود ندارد.",
          remainingCapacity: performance.remaining_capacity,
        });
      }

      const reservation = await Reservation.create(
        {
          performance_id: performance.id,
          name: name.trim(),
          phone: phone.trim(),
          national_id: nationalId.trim(),
          count: ticketCount,
          tracking_code: createTrackingCode(),
          status: "confirmed",
        },
        { transaction }
      );

      performance.remaining_capacity -= ticketCount;
      await performance.save({ transaction });
      await transaction.commit();

      res.status(201).json({
        ok: true,
        reservationId: reservation.id,
        trackingCode: reservation.tracking_code,
        remainingCapacity: performance.remaining_capacity,
      });
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      console.error("Reservation error:", error);
      res.status(500).json({ message: "خطای داخلی سرور." });
    }
  });

  // ============================
  // Admin API
  // ============================

  app.use("/api/admin", adminApiRouter);

  // ============================
  // React Admin Panel — port 4000 only
  // ============================

  const adminDist = path.join(process.cwd(), "dist-admin");

  // Exact route only. Express normally treats /admin and /admin/ as the
  // same route, which caused an infinite redirect loop before.
  app.get(/^\/admin$/, (req, res) => {
    res.redirect(308, "/admin/");
  });

  app.use(
    "/admin/",
    express.static(adminDist, {
      index: "index.html",
      redirect: false,
    })
  );

  // SPA fallback for internal admin routes such as /admin/shows.
  app.get(/^\/admin\/.*$/, (req, res) => {
    res.sendFile(path.join(adminDist, "index.html"));
  });

  app.use((req, res) => {
    res.status(404).json({ message: "مسیر یافت نشد" });
  });

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔧 Admin panel at http://localhost:${PORT}/admin/`);
  });
}

startServer().catch((error) => {
  console.error("خطا در راه‌اندازی سرور:", error);
});
