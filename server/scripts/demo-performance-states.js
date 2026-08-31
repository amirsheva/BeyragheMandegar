import {
  sequelize,
  Performance,
  Reservation,
} from "../models.js";

function tracking(index) {
  return `DEMO-${Date.now()}-${index}`;
}

async function run() {
  const performances = await Performance.findAll({
    order: [["id", "ASC"]],
  });

  if (performances.length < 5) {
    throw new Error("حداقل ۵ اجرا لازم است.");
  }

  // فقط رزروهای تست Local پاک می‌شوند
  await Reservation.destroy({
    where: {},
  });

  const scenarios = [
    {
      sold: 80,
      booking: true,
      status: "active",
    },
    {
      sold: 272,
      booking: true,
      status: "active",
    },
    {
      sold: 295,
      booking: true,
      status: "active",
    },
    {
      sold: 300,
      booking: true,
      status: "active",
    },
    {
      sold: 50,
      booking: false,
      status: "active",
    },
  ];

  for (let i = 0; i < 5; i++) {
    const performance = performances[i];
    const scenario = scenarios[i];

    const capacity = Number(
      performance.capacity || 300
    );

    const sold = Math.min(
      scenario.sold,
      capacity
    );

    performance.remaining_capacity =
      capacity - sold;

    performance.booking_enabled =
      scenario.booking;

    performance.status =
      scenario.status;

    await performance.save();

    if (sold > 0) {
      await Reservation.create({
        performance_id: performance.id,
        name: `رزرو تست ${i + 1}`,
        phone: `0912000000${i}`,
        national_id: `001000000${i}`,
        count: sold,
        tracking_code: tracking(i + 1),
        status: "confirmed",
      });
    }
  }

  console.log("✅ Demo states applied");
  console.log("شب اول: ۲۲۰ ظرفیت باقی‌مانده");
  console.log("شب دوم: ۲۸ ظرفیت باقی‌مانده");
  console.log("شب سوم: ۵ ظرفیت باقی‌مانده");
  console.log("شب چهارم: تکمیل ظرفیت");
  console.log("شب پنجم: رزرو بسته");
}

run()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error(error);

    await sequelize.close();

    process.exit(1);
  });