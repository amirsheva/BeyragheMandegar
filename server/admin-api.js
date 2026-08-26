import { Router } from "express";
import {
  Production,
  Performance,
  Reservation,
} from "./models.js";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [productions, performances, reservations, tickets] = await Promise.all([
      Production.count(),
      Performance.count(),
      Reservation.count(),
      Reservation.sum("count"),
    ]);

    const capacityRows = await Performance.findAll({
      attributes: ["capacity", "remaining_capacity"],
      raw: true,
    });

    const totalCapacity = capacityRows.reduce(
      (sum, item) => sum + Number(item.capacity || 0),
      0
    );

    const remainingCapacity = capacityRows.reduce(
      (sum, item) => sum + Number(item.remaining_capacity || 0),
      0
    );

    res.json({
      shows: productions,
      productions,
      performances,
      reservations,
      tickets: Number(tickets || 0),
      totalCapacity,
      remainingCapacity,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "خطا در دریافت اطلاعات داشبورد" });
  }
});

router.get("/shows", async (req, res) => {
  try {
    const items = await Production.findAll({
      include: [
        {
          model: Performance,
          as: "performances",
          attributes: [
            "id",
            "date",
            "time",
            "capacity",
            "remaining_capacity",
            "status",
            "booking_enabled",
            "label",
          ],
        },
      ],
      order: [["id", "ASC"]],
    });

    res.json(items);
  } catch (error) {
    console.error("Admin productions error:", error);
    res.status(500).json({ message: "خطا در دریافت نمایش‌ها" });
  }
});

router.get("/performances", async (req, res) => {
  try {
    const items = await Performance.findAll({
      include: [
        {
          model: Production,
          as: "production",
          attributes: ["id", "title", "slug"],
        },
      ],
      order: [
        ["date", "ASC"],
        ["time", "ASC"],
      ],
    });

    res.json(items);
  } catch (error) {
    console.error("Admin performances error:", error);
    res.status(500).json({ message: "خطا در دریافت اجراها" });
  }
});

router.get("/reservations", async (req, res) => {
  try {
    const items = await Reservation.findAll({
      include: [
        {
          model: Performance,
          as: "performance",
          include: [
            {
              model: Production,
              as: "production",
              attributes: ["id", "title", "slug"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(items);
  } catch (error) {
    console.error("Admin reservations error:", error);
    res.status(500).json({ message: "خطا در دریافت رزروها" });
  }
});

export default router;
