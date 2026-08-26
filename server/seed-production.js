import {
  sequelize,
  Production,
  Performance,
} from "./models.js";

const performances = [
  { date: "1405/08/01", time: "20:00", label: "شب اول" },
  { date: "1405/08/02", time: "20:00", label: "شب دوم" },
  { date: "1405/08/03", time: "20:00", label: "شب سوم" },
  { date: "1405/08/04", time: "20:00", label: "شب چهارم" },
  { date: "1405/08/05", time: "20:00", label: "شب پایانی" },
];

async function seed() {
  try {
    await sequelize.authenticate();

    // This project is still in development. The current test data is intentionally reset.
    await sequelize.sync({ force: true });

    const production = await Production.create({
      title: "بیرق ماندگار",
      slug: "beyragh-mandegar",
      subtitle: "پنج شب اجرای صحنه‌ای در آبان ۱۴۰۵",
      short_description:
        "نمایش «بیرق ماندگار» از ۱ تا ۵ آبان ۱۴۰۵، هر شب ساعت ۲۰ روی صحنه می‌رود.",
      description:
        "دوره اجرای نمایش «بیرق ماندگار» شامل پنج اجرای پیاپی از یکم تا پنجم آبان ۱۴۰۵ است. شروع همه اجراها ساعت ۲۰ خواهد بود و رزرو هر شب به‌صورت مستقل انجام می‌شود.",
      director: null,
      poster: null,
      status: "published",
      tags: JSON.stringify([
        "بیرق ماندگار",
        "تئاتر",
        "نمایش",
        "اجرای صحنه‌ای",
        "آبان ۱۴۰۵",
      ]),
    });

    for (const item of performances) {
      await Performance.create({
        production_id: production.id,
        date: item.date,
        time: item.time,
        capacity: 300,
        remaining_capacity: 300,
        status: "active",
        booking_enabled: true,
        label: item.label,
      });
    }

    console.log("✅ Database reset completed");
    console.log("✅ Production: بیرق ماندگار");
    console.log("✅ Performances: 5");
    console.log("✅ Dates: 1405/08/01 → 1405/08/05");
    console.log("✅ Time: 20:00");
    console.log("✅ Existing test reservations were removed");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

seed();
