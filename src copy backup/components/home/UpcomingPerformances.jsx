import { useEffect, useState } from "react";
import GlassCard from "../common/GlassCard";
import GoldButton from "../common/GoldButton";

export default function UpcomingPerformances() {
  const [shows, setShows] = useState([]);

  useEffect(() => {
    fetch("/api/shows")
      .then((res) => res.json())
      .then((data) => setShows(data))
      .catch(() => setShows([]));
  }, []);

  return (
    <section
      id="performances"
      dir="rtl"
      className="px-6 py-24 bg-[#111]"
    >
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl md:text-4xl font-black text-[#d4af37] mb-10">
          اجراهای پیش رو
        </h2>

        {shows.length === 0 ? (
          <GlassCard className="p-8">
            <p className="text-gray-300">
              اجرای جدیدی برای نمایش ثبت نشده است.
            </p>
          </GlassCard>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {shows.map((show) => (
              <GlassCard
                key={show.id}
                className="p-6"
              >
                <h3 className="text-xl font-bold">
                  {show.title}
                </h3>

                <div className="mt-4 text-gray-300 space-y-2">
                  <p>
                    تاریخ: {show.date}
                  </p>

                  <p>
                    ساعت: {show.time}
                  </p>

                  <p className="text-[#d4af37]">
                    ظرفیت باقی‌مانده: {show.capacity}
                  </p>
                </div>

                <div className="mt-6">
                  <GoldButton>
                    رزرو بلیت
                  </GoldButton>
                </div>

              </GlassCard>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
