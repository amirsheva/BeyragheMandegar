// index.js
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { setupAdmin } from "./admin.js";
import { Show, Reservation } from "./models.js";



async function startServer() {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
  app.use(morgan("tiny"));
  app.use(cors({ origin: ["http://localhost:5173"], credentials: false }));
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/", rateLimit({ windowMs: 60_000, max: 20 }));

  const admin = await setupAdmin(app);

  app.get("/api/shows", async (req, res) => {
    try {
      const data = await Show.findAll();
      res.json(data);
    } catch (e) {
      console.error("Error fetching shows:", e);
      res.status(500).json({ message: "خطا در گرفتن سانس‌ها" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const { name, phone, nationalId, count, showtime } = req.body || {};
      if (!name || !phone || !nationalId || !showtime?.showtimeId) {
        return res.status(400).json({ message: "اطلاعات ناقص است." });
      }
      const showRec = await Show.findByPk(showtime.showtimeId);
      if (!showRec) {
        return res.status(404).json({ message: "سانس یافت نشد." });
      }
      if (showRec.capacity < count) {
        return res.status(409).json({ message: "ظرفیت کافی نیست." });
      }

      await Reservation.create({
        name,
        phone,
        national_id: nationalId,
        count,
        show_id: showtime.showtimeId,
      });

      showRec.capacity = showRec.capacity - count;
      await showRec.save();

      return res.json({ ok: true });
    } catch (err) {
      console.error("Error in reservation:", err);
      return res.status(500).json({ message: "خطای داخلی سرور." });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ message: "مسیر یافت نشد" });
  });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🔧 Admin panel at http://localhost:${PORT}${admin.options.rootPath}`);
  });
}

startServer().catch((e) => {
  console.error("خطا در راه‌اندازی سرور:", e);
});
