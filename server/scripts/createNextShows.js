// server/scripts/createNextShows.js
import { Show } from "../models.js";
import { sequelize } from "../models.js";

async function createNextShows(baseShowId, days = 10) {
  await sequelize.sync();

  // 1️⃣ گرفتن اطلاعات سانس پایه
  const baseShow = await Show.findByPk(baseShowId);
  if (!baseShow) {
    console.error(`❌ Show with id ${baseShowId} not found!`);
    process.exit(1);
  }

  const baseDate = new Date(baseShow.date);
  const shows = [];

  // 2️⃣ ساخت سانس‌های جدید برای 10 روز بعد
  for (let i = 1; i <= days; i++) {
    const newDate = new Date(baseDate);
    newDate.setDate(baseDate.getDate() + i);

    const newShow = {
      title: `sans ${parseInt(baseShow.title.replace(/\D/g, "") || 1) + i}`,
      date: newDate.toISOString().split("T")[0], // فقط yyyy-mm-dd
      capacity: baseShow.capacity,
    };

    shows.push(newShow);
  }

  // 3️⃣ ذخیره همه با هم
  await Show.bulkCreate(shows);
  console.log(`✅ Created ${days} new shows from ${baseShow.date} forward.`);
  process.exit(0);
}

// 📅 اجرا از ترمینال با:
// node server/scripts/createNextShows.js 1
const id = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
createNextShows(id, 10);