import { Router } from "express";
import { Op } from "sequelize";
import {
  sequelize,
  Production,
  Performance,
  Reservation,
  Venue,
  News,
} from "./models.js";

import {
  SmsTemplate,
  SmsCampaign,
  SmsMessage,
} from "./sms/models.js";


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


function maskPhone(value) {
  const digits =
    String(
      value || ""
    )
      .replace(
        /\D/g,
        ""
      );

  if (
    digits.length < 8
  ) {
    return "••••";
  }

  return (
    digits.slice(
      0,
      4
    ) +
    "***" +
    digits.slice(
      -4
    )
  );
}


function maskNationalId(value) {
  const digits =
    String(
      value || ""
    )
      .replace(
        /\D/g,
        ""
      );

  if (
    digits.length < 6
  ) {
    return "••••";
  }

  return (
    digits.slice(
      0,
      2
    ) +
    "****" +
    digits.slice(
      -4
    )
  );
}


function serializeReservation(
  item
) {
  const data =
    item?.toJSON
      ? item.toJSON()
      : {
          ...item,
        };

  return {
    ...data,

    phone:
      maskPhone(
        data.phone
      ),

    national_id:
      maskNationalId(
        data.national_id
      ),
  };
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
  try {
    const item = await Production.findByPk(
      req.params.id
    );

    if (!item) {
      return res.status(404).json({
        message: "نمایش یافت نشد.",
      });
    }

    const performanceCount =
      await Performance.count({
        where: {
          production_id: item.id,
        },
      });

    if (performanceCount > 0) {
      return res.status(409).json({
        message:
          "این نمایش دارای اجرا است و قابل حذف نیست.",
      });
    }

    await item.destroy();

    return res.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Delete production error:",
      error
    );

    return res.status(500).json({
      message: "خطا در حذف نمایش",
    });
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

// PERFORMANCE_VENUE_FIELDS_V1
router.post("/performances", async (req, res) => {
  try {
    const {
      production_id,
      venue_id,
      date,
      time,
      attendance_time,
      end_time,
      ticket_note,
      capacity = 300,
      status = "active",
      booking_enabled = true,
      label,
    } = req.body || {};

    const productionId =
      Number(production_id);

    const numericCapacity =
      Number(capacity);

    if (
      !Number.isInteger(productionId) ||
      productionId < 1 ||
      !String(date || "").trim() ||
      !String(time || "").trim() ||
      !Number.isInteger(numericCapacity) ||
      numericCapacity < 1
    ) {
      return res.status(400).json({
        message:
          "اطلاعات اجرا ناقص یا نامعتبر است.",
      });
    }

    const production =
      await Production.findByPk(
        productionId
      );

    if (!production) {
      return res.status(404).json({
        message:
          "نمایش انتخاب‌شده یافت نشد.",
      });
    }

    let venueId = null;

    if (
      venue_id !== null &&
      venue_id !== undefined &&
      venue_id !== ""
    ) {
      venueId = Number(venue_id);

      if (
        !Number.isInteger(venueId) ||
        venueId < 1
      ) {
        return res.status(400).json({
          message:
            "محل اجرا نامعتبر است.",
        });
      }

      const venue =
        await Venue.findByPk(
          venueId
        );

      if (!venue) {
        return res.status(404).json({
          message:
            "محل اجرای انتخاب‌شده یافت نشد.",
        });
      }
    }

    const normalizedStatus =
      String(
        status || "active"
      ).trim();

    const item =
      await Performance.create({
        production_id:
          productionId,

        venue_id:
          venueId,

        date:
          String(date).trim(),

        time:
          String(time).trim(),

        attendance_time:
          String(
            attendance_time || ""
          ).trim() || null,

        end_time:
          String(
            end_time || ""
          ).trim() || null,

        ticket_note:
          String(
            ticket_note || ""
          ).trim() || null,

        capacity:
          numericCapacity,

        remaining_capacity:
          numericCapacity,

        status:
          normalizedStatus,

        booking_enabled:
          normalizedStatus ===
          "archived"
            ? false
            : Boolean(
                booking_enabled
              ),

        label:
          String(
            label || ""
          ).trim() || null,
      });

    return res
      .status(201)
      .json(item);

  } catch (error) {
    console.error(
      "Create performance error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ایجاد اجرا",
    });
  }
});


router.patch("/performances/:id", async (req, res) => {
  try {
    const item =
      await Performance.findByPk(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message:
          "اجرا یافت نشد.",
      });
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body || {},
        "capacity"
      )
    ) {
      const nextCapacity =
        Number(
          req.body.capacity
        );

      const reserved =
        Number(item.capacity) -
        Number(
          item.remaining_capacity
        );

      if (
        !Number.isInteger(
          nextCapacity
        ) ||
        nextCapacity < 1 ||
        nextCapacity < reserved
      ) {
        return res.status(409).json({
          message:
            `ظرفیت جدید نمی‌تواند کمتر از ${reserved} بلیت رزروشده باشد.`,
        });
      }

      item.capacity =
        nextCapacity;

      item.remaining_capacity =
        nextCapacity -
        reserved;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body || {},
        "production_id"
      )
    ) {
      const productionId =
        Number(
          req.body.production_id
        );

      const production =
        await Production.findByPk(
          productionId
        );

      if (!production) {
        return res.status(404).json({
          message:
            "نمایش انتخاب‌شده یافت نشد.",
        });
      }

      item.production_id =
        productionId;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body || {},
        "venue_id"
      )
    ) {
      const value =
        req.body.venue_id;

      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        item.venue_id = null;

      } else {
        const venueId =
          Number(value);

        if (
          !Number.isInteger(
            venueId
          ) ||
          venueId < 1
        ) {
          return res.status(400).json({
            message:
              "محل اجرا نامعتبر است.",
          });
        }

        const venue =
          await Venue.findByPk(
            venueId
          );

        if (!venue) {
          return res.status(404).json({
            message:
              "محل اجرای انتخاب‌شده یافت نشد.",
          });
        }

        item.venue_id =
          venueId;
      }
    }


    for (
      const field of [
        "date",
        "time",
        "attendance_time",
        "end_time",
        "ticket_note",
        "status",
        "label",
      ]
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body || {},
          field
        )
      ) {
        const value =
          req.body[field];

        item[field] =
          typeof value === "string"
            ? value.trim() || null
            : value;
      }
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body || {},
        "booking_enabled"
      )
    ) {
      item.booking_enabled =
        Boolean(
          req.body.booking_enabled
        );
    }


    if (
      item.status ===
      "archived"
    ) {
      item.booking_enabled =
        false;
    }


    await item.save();

    return res.json(item);

  } catch (error) {
    console.error(
      "Update performance error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ویرایش اجرا",
    });
  }
});


router.delete("/performances/:id", async (req, res) => {
  try {
    const item = await Performance.findByPk(
      req.params.id
    );

    if (!item) {
      return res.status(404).json({
        message: "اجرا یافت نشد.",
      });
    }

    const reservationCount =
      await Reservation.count({
        where: {
          performance_id: item.id,
        },
      });

    if (reservationCount > 0) {
      return res.status(409).json({
        message:
          "این اجرا دارای رزرو است و قابل حذف نیست.",
      });
    }

    await item.destroy();

    return res.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Delete performance error:",
      error
    );

    return res.status(500).json({
      message: "خطا در حذف اجرا",
    });
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

    res.json(
      items.map(
        serializeReservation
      )
    );
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

      return res.json(
        serializeReservation(
          reservation
        )
      );
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

    res.json(
      serializeReservation(
        reservation
      )
    );
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Update reservation status error:", error);
    res.status(500).json({ message: "خطا در تغییر وضعیت رزرو" });
  }
});


// ============================
// Venues
// VENUE_ADMIN_CRUD_V1
// ============================

router.get("/venues", async (req, res) => {
  try {
    const items = await Venue.findAll({
      order: [["name", "ASC"]],
    });

    return res.json(items);
  } catch (error) {
    console.error(
      "Admin venues error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در دریافت محل‌های اجرا",
    });
  }
});


router.post("/venues", async (req, res) => {
  try {
    const name = String(
      req.body?.name || ""
    ).trim();

    const slug = String(
      req.body?.slug || ""
    ).trim();

    if (!name || !slug) {
      return res.status(400).json({
        message:
          "نام و نامک محل اجرا الزامی است.",
      });
    }

    const duplicate =
      await Venue.findOne({
        where: { slug },
      });

    if (duplicate) {
      return res.status(409).json({
        message:
          "این نامک قبلاً استفاده شده است.",
      });
    }

    const item = await Venue.create({
      name,
      slug,

      hall_name:
        String(
          req.body?.hall_name || ""
        ).trim() || null,

      address:
        String(
          req.body?.address || ""
        ).trim() || null,

      entrance_note:
        String(
          req.body?.entrance_note || ""
        ).trim() || null,

      access_note:
        String(
          req.body?.access_note || ""
        ).trim() || null,

      latitude:
        req.body?.latitude === "" ||
        req.body?.latitude == null
          ? null
          : Number(req.body.latitude),

      longitude:
        req.body?.longitude === "" ||
        req.body?.longitude == null
          ? null
          : Number(req.body.longitude),

      google_maps_url:
        String(
          req.body?.google_maps_url || ""
        ).trim() || null,

      neshan_url:
        String(
          req.body?.neshan_url || ""
        ).trim() || null,

      balad_url:
        String(
          req.body?.balad_url || ""
        ).trim() || null,

      waze_url:
        String(
          req.body?.waze_url || ""
        ).trim() || null,

      status:
        String(
          req.body?.status || "active"
        ).trim(),
    });

    return res
      .status(201)
      .json(item);

  } catch (error) {
    console.error(
      "Create venue error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ایجاد محل اجرا",
    });
  }
});


router.put("/venues/:id", async (req, res) => {
  try {
    const item =
      await Venue.findByPk(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message:
          "محل اجرا یافت نشد.",
      });
    }

    const fields = [
      "name",
      "slug",
      "hall_name",
      "address",
      "entrance_note",
      "access_note",
      "google_maps_url",
      "neshan_url",
      "balad_url",
      "waze_url",
      "status",
    ];

    for (const field of fields) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body || {},
          field
        )
      ) {
        const value = String(
          req.body[field] ?? ""
        ).trim();

        item[field] =
          value || null;
      }
    }

    for (
      const field of [
        "latitude",
        "longitude",
      ]
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body || {},
          field
        )
      ) {
        const value =
          req.body[field];

        item[field] =
          value === "" ||
          value == null
            ? null
            : Number(value);
      }
    }

    if (
      !String(item.name || "").trim() ||
      !String(item.slug || "").trim()
    ) {
      return res.status(400).json({
        message:
          "نام و نامک محل اجرا الزامی است.",
      });
    }

    const duplicate =
      await Venue.findOne({
        where: {
          slug: item.slug,
          id: {
            [Op.ne]: item.id,
          },
        },
      });

    if (duplicate) {
      return res.status(409).json({
        message:
          "این نامک قبلاً استفاده شده است.",
      });
    }

    await item.save();

    return res.json(item);

  } catch (error) {
    console.error(
      "Update venue error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ویرایش محل اجرا",
    });
  }
});


router.delete("/venues/:id", async (req, res) => {
  try {
    const item =
      await Venue.findByPk(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message:
          "محل اجرا یافت نشد.",
      });
    }

    const performanceCount =
      await Performance.count({
        where: {
          venue_id: item.id,
        },
      });

    if (performanceCount > 0) {
      return res.status(409).json({
        message:
          "این محل به اجرا متصل است و قابل حذف نیست.",
      });
    }

    await item.destroy();

    return res.json({
      ok: true,
    });

  } catch (error) {
    console.error(
      "Delete venue error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در حذف محل اجرا",
    });
  }
});



// ============================
// News
// NEWS_ADMIN_CRUD_V1
// ============================

router.get("/news", async (req, res) => {
  try {
    const items =
      await News.findAll({
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
      });

    return res.json(items);

  } catch (error) {
    console.error(
      "Admin news error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در دریافت اخبار",
    });
  }
});


router.post("/news", async (req, res) => {
  try {
    const title =
      String(
        req.body?.title || ""
      ).trim();

    const slug =
      String(
        req.body?.slug || ""
      ).trim();

    const content =
      String(
        req.body?.content || ""
      ).trim();

    if (
      !title ||
      !slug ||
      !content
    ) {
      return res.status(400).json({
        message:
          "عنوان، نامک و متن خبر الزامی است.",
      });
    }

    const duplicate =
      await News.findOne({
        where: {
          slug,
        },
      });

    if (duplicate) {
      return res.status(409).json({
        message:
          "این نامک قبلاً استفاده شده است.",
      });
    }

    const status =
      req.body?.status ===
      "published"
        ? "published"
        : "draft";

    const item =
      await News.create({
        title,
        slug,

        excerpt:
          String(
            req.body?.excerpt ||
            ""
          ).trim() ||
          null,

        content,

        cover:
          String(
            req.body?.cover ||
            ""
          ).trim() ||
          null,

        status,

        published_at:
          status ===
          "published"
            ? (
                req.body
                  ?.published_at ||
                new Date()
              )
            : (
                req.body
                  ?.published_at ||
                null
              ),
      });

    return res
      .status(201)
      .json(item);

  } catch (error) {
    console.error(
      "Create news error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ایجاد خبر",
    });
  }
});


router.put("/news/:id", async (req, res) => {
  try {
    const item =
      await News.findByPk(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message:
          "خبر یافت نشد.",
      });
    }

    for (
      const field of [
        "title",
        "slug",
        "excerpt",
        "content",
        "cover",
      ]
    ) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body || {},
          field
        )
      ) {
        const value =
          String(
            req.body[field] ??
            ""
          ).trim();

        item[field] =
          value || null;
      }
    }

    if (
      !item.title ||
      !item.slug ||
      !item.content
    ) {
      return res.status(400).json({
        message:
          "عنوان، نامک و متن خبر الزامی است.",
      });
    }

    const duplicate =
      await News.findOne({
        where: {
          slug:
            item.slug,

          id: {
            [Op.ne]:
              item.id,
          },
        },
      });

    if (duplicate) {
      return res.status(409).json({
        message:
          "این نامک قبلاً استفاده شده است.",
      });
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body || {},
        "status"
      )
    ) {
      const nextStatus =
        req.body.status ===
        "published"
          ? "published"
          : "draft";

      if (
        nextStatus ===
        "published" &&
        !item.published_at
      ) {
        item.published_at =
          new Date();
      }

      item.status =
        nextStatus;
    }


    if (
      Object.prototype.hasOwnProperty.call(
        req.body || {},
        "published_at"
      )
    ) {
      item.published_at =
        req.body.published_at ||
        null;
    }


    await item.save();

    return res.json(item);

  } catch (error) {
    console.error(
      "Update news error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ویرایش خبر",
    });
  }
});


router.delete("/news/:id", async (req, res) => {
  try {
    const item =
      await News.findByPk(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message:
          "خبر یافت نشد.",
      });
    }

    await item.destroy();

    return res.json({
      ok: true,
    });

  } catch (error) {
    console.error(
      "Delete news error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در حذف خبر",
    });
  }
});




// ============================
// SMS Admin
// SMS_ADMIN_SAFE_V1
// ============================

router.get("/sms/dashboard", async (req, res) => {
  try {
    const [
      templates,
      campaigns,
      messages,
      queued,
      sent,
      failed,
    ] = await Promise.all([
      SmsTemplate.count(),
      SmsCampaign.count(),
      SmsMessage.count(),
      SmsMessage.count({
        where: {
          status: "queued",
        },
      }),
      SmsMessage.count({
        where: {
          status: "sent",
        },
      }),
      SmsMessage.count({
        where: {
          status: "failed",
        },
      }),
    ]);

    const stats = {
      templates,
      campaigns,
      messages,
      queued,
      sent,
      failed,
    };

    return res.json({
      ...stats,
      stats,

      provider:
        process.env.SMS_PROVIDER ||
        "noop",

      transactionalEnabled:
        [
          "1",
          "true",
          "yes",
          "on",
        ].includes(
          String(
            process.env
              .SMS_TRANSACTIONAL_ENABLED ||
            ""
          )
            .trim()
            .toLowerCase()
        ),
    });

  } catch (error) {
    console.error(
      "SMS dashboard error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در دریافت داشبورد پیامک",
    });
  }
});


router.get("/sms/messages", async (req, res) => {
  try {
    const items =
      await SmsMessage.findAll({
        order: [
          ["id", "DESC"],
        ],
        limit: 200,
      });

    return res.json(items);

  } catch (error) {
    console.error(
      "SMS messages error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در دریافت پیامک‌ها",
    });
  }
});


router.get("/sms/templates", async (req, res) => {
  try {
    const items =
      await SmsTemplate.findAll({
        order: [
          ["id", "ASC"],
        ],
      });

    return res.json(items);

  } catch (error) {
    console.error(
      "SMS templates error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در دریافت قالب‌های پیامک",
    });
  }
});


router.put("/sms/templates/:id", async (req, res) => {
  try {
    const item =
      await SmsTemplate.findByPk(
        req.params.id
      );

    if (!item) {
      return res.status(404).json({
        message:
          "قالب پیامک یافت نشد.",
      });
    }

    const allowed = [
      "title",
      "status",
      "provider_template_id",
      "provider_method",
      "provider_parameters_json",
    ];

    for (const field of allowed) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body || {},
          field
        )
      ) {
        item[field] =
          req.body[field] === ""
            ? null
            : req.body[field];
      }
    }

    await item.save();

    return res.json(item);

  } catch (error) {
    console.error(
      "Update SMS template error:",
      error
    );

    return res.status(500).json({
      message:
        "خطا در ویرایش قالب پیامک",
    });
  }
});


function smsSendingDisabled(
  res
) {
  return res.status(409).json({
    message:
      "ارسال واقعی پیامک تا تأیید Template IDهای SMS.ir غیرفعال است.",
  });
}


router.post(
  "/sms/send",
  async (req, res) =>
    smsSendingDisabled(res)
);


router.post(
  "/sms/messages/:id/retry",
  async (req, res) =>
    smsSendingDisabled(res)
);


router.post(
  "/sms/sandbox/verify",
  async (req, res) =>
    smsSendingDisabled(res)
);


router.post(
  "/sms/messages/:id/refresh-delivery",
  async (req, res) =>
    smsSendingDisabled(res)
);



export default router;
