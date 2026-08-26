import { Router } from "express";
import { Op } from "sequelize";
import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "./models.js";

const router = Router();

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => String(item).trim()).filter(Boolean));
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map((item) => String(item).trim()).filter(Boolean));
      }
    } catch {
      return JSON.stringify(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      );
    }
  }

  return JSON.stringify([]);
}

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

// ============================
// Productions
// ============================

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

router.post("/shows", async (req, res) => {
  try {
    const {
      title,
      slug,
      subtitle,
      short_description,
      description,
      director,
      poster,
      status = "published",
      tags = [],
    } = req.body || {};

    if (!title?.trim() || !slug?.trim()) {
      return res.status(400).json({ message: "عنوان و نامک الزامی است." });
    }

    const duplicate = await Production.findOne({ where: { slug: slug.trim() } });
    if (duplicate) {
      return res.status(409).json({ message: "این نامک قبلاً استفاده شده است." });
    }

    const item = await Production.create({
      title: title.trim(),
      slug: slug.trim(),
      subtitle: subtitle?.trim() || null,
      short_description: short_description?.trim() || null,
      description: description?.trim() || null,
      director: director?.trim() || null,
      poster: poster?.trim() || null,
      status,
      tags: normalizeTags(tags),
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Create production error:", error);
    res.status(500).json({ message: "خطا در ایجاد نمایش" });
  }
});

router.patch("/shows/:id", async (req, res) => {
  try {
    const item = await Production.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "نمایش یافت نشد." });
    }

    const fields = [
      "title",
      "slug",
      "subtitle",
      "short_description",
      "description",
      "director",
      "poster",
      "status",
    ];

    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        item[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "tags")) {
      item.tags = normalizeTags(req.body.tags);
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error("Update production error:", error);
    res.status(500).json({ message: "خطا در ویرایش نمایش" });
  }
});

router.delete("/shows/:id", async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const item = await Production.findByPk(req.params.id, { transaction });
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ message: "نمایش یافت نشد." });
    }

    const performances = await Performance.findAll({
      where: { production_id: item.id },
      attributes: ["id"],
      raw: true,
      transaction,
    });

    const performanceIds = performances.map((row) => row.id);

    if (performanceIds.length) {
      await Reservation.destroy({
        where: { performance_id: { [Op.in]: performanceIds } },
        transaction,
      });

      await Performance.destroy({
        where: { id: { [Op.in]: performanceIds } },
        transaction,
      });
    }

    await item.destroy({ transaction });
    await transaction.commit();

    res.json({ ok: true });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Delete production error:", error);
    res.status(500).json({ message: "خطا در حذف نمایش" });
  }
});

// ============================
// Performances
// ============================

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

router.post("/performances", async (req, res) => {
  try {
    const {
      production_id,
      date,
      time,
      capacity = 300,
      status = "active",
      booking_enabled = true,
      label,
    } = req.body || {};

    const productionId = Number(production_id);
    const numericCapacity = Number(capacity);

    if (
      !Number.isInteger(productionId) ||
      productionId < 1 ||
      !date?.trim() ||
      !time?.trim() ||
      !Number.isInteger(numericCapacity) ||
      numericCapacity < 1
    ) {
      return res.status(400).json({ message: "اطلاعات اجرا ناقص یا نامعتبر است." });
    }

    const production = await Production.findByPk(productionId);
    if (!production) {
      return res.status(404).json({ message: "نمایش انتخاب‌شده یافت نشد." });
    }

    const item = await Performance.create({
      production_id: productionId,
      date: date.trim(),
      time: time.trim(),
      capacity: numericCapacity,
      remaining_capacity: numericCapacity,
      status,
      booking_enabled: Boolean(booking_enabled),
      label: label?.trim() || null,
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Create performance error:", error);
    res.status(500).json({ message: "خطا در ایجاد اجرا" });
  }
});

router.patch("/performances/:id", async (req, res) => {
  try {
    const item = await Performance.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "اجرا یافت نشد." });
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "capacity")) {
      const nextCapacity = Number(req.body.capacity);
      const reserved = Number(item.capacity) - Number(item.remaining_capacity);

      if (!Number.isInteger(nextCapacity) || nextCapacity < reserved || nextCapacity < 1) {
        return res.status(409).json({
          message: `ظرفیت جدید نمی‌تواند کمتر از ${reserved} بلیت رزروشده باشد.`,
        });
      }

      item.capacity = nextCapacity;
      item.remaining_capacity = nextCapacity - reserved;
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "production_id")) {
      const productionId = Number(req.body.production_id);
      const production = await Production.findByPk(productionId);
      if (!production) {
        return res.status(404).json({ message: "نمایش انتخاب‌شده یافت نشد." });
      }
      item.production_id = productionId;
    }

    for (const field of ["date", "time", "status", "label"]) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        item[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "booking_enabled")) {
      item.booking_enabled = Boolean(req.body.booking_enabled);
    }

    await item.save();
    res.json(item);
  } catch (error) {
    console.error("Update performance error:", error);
    res.status(500).json({ message: "خطا در ویرایش اجرا" });
  }
});

router.delete("/performances/:id", async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const item = await Performance.findByPk(req.params.id, { transaction });
    if (!item) {
      await transaction.rollback();
      return res.status(404).json({ message: "اجرا یافت نشد." });
    }

    await Reservation.destroy({
      where: { performance_id: item.id },
      transaction,
    });

    await item.destroy({ transaction });
    await transaction.commit();

    res.json({ ok: true });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Delete performance error:", error);
    res.status(500).json({ message: "خطا در حذف اجرا" });
  }
});

// ============================
// Reservations
// ============================

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

router.patch("/reservations/:id/status", async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const nextStatus = req.body?.status;
    if (!["confirmed", "cancelled"].includes(nextStatus)) {
      await transaction.rollback();
      return res.status(400).json({ message: "وضعیت رزرو نامعتبر است." });
    }

    const reservation = await Reservation.findByPk(req.params.id, { transaction });
    if (!reservation) {
      await transaction.rollback();
      return res.status(404).json({ message: "رزرو یافت نشد." });
    }

    if (reservation.status === nextStatus) {
      await transaction.commit();
      return res.json(reservation);
    }

    const performance = await Performance.findByPk(reservation.performance_id, {
      transaction,
    });

    if (!performance) {
      await transaction.rollback();
      return res.status(404).json({ message: "اجرای رزرو یافت نشد." });
    }

    if (reservation.status === "confirmed" && nextStatus === "cancelled") {
      performance.remaining_capacity = Math.min(
        performance.capacity,
        performance.remaining_capacity + reservation.count
      );
    }

    if (reservation.status === "cancelled" && nextStatus === "confirmed") {
      if (performance.remaining_capacity < reservation.count) {
        await transaction.rollback();
        return res.status(409).json({ message: "ظرفیت کافی برای فعال‌سازی مجدد رزرو وجود ندارد." });
      }
      performance.remaining_capacity -= reservation.count;
    }

    reservation.status = nextStatus;
    await performance.save({ transaction });
    await reservation.save({ transaction });
    await transaction.commit();

    res.json(reservation);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Update reservation status error:", error);
    res.status(500).json({ message: "خطا در تغییر وضعیت رزرو" });
  }
});

export default router;
