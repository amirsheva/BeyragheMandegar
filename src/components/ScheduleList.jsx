import { toPersianFullDate } from "../lib/date";

export default function ScheduleList({ shows, onReserve }) {
  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-4">زمان‌بندی اجراها</h2>
      <ul className="space-y-3">
        {shows.map((s) => (
          <li key={s.id} className="border-b pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* سمت راست: تاریخ، ساعت، ظرفیت */}
              <div className="min-w-0">
                <div className="font-semibold truncate">{toPersianFullDate(s.date)}</div>
                <div className="text-gray-600 dark:text-gray-400">ساعت {s.time}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  ظرفیت باقیمانده: {s.capacity}
                </div>
              </div>

              {/* سمت چپ: دکمه رزرو و بهای بلیت */}
              <div className="flex flex-col items-start md:items-end gap-2 md:mt-0 mt-2">
                <button
                  className="btn btn-primary w-full md:w-auto disabled:opacity-50"
                  disabled={s.capacity <= 0}
                  onClick={() =>
                    onReserve({
                      showtimeId: s.id,
                      date: s.date,
                      time: s.time,
                      title: s.title,
                    })
                  }
                >
                  {s.capacity <= 0 ? "تکمیل" : "رزرو"}
                </button>

                {/* 🕊 بهای بلیط: صلوات */}
                <span className="px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 inline-block">
                  بهای بلیط : ۵ صلوات برای سلامتی آقا امام زمان (عج)
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}