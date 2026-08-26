import usePerformances from "./hooks/usePerformances";

export default function PerformanceManager() {
  const items = usePerformances();

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">مدیریت اجراها</h2>
        <p className="text-white/50 mt-2">پنج اجرای برنامه‌ریزی‌شده و وضعیت ظرفیت هر شب</p>
      </div>

      <div className="space-y-4">
        {items.length === 0 && (
          <div className="bg-[#171717] border border-white/10 rounded-2xl p-6 text-white/50">
            اجرایی ثبت نشده است.
          </div>
        )}

        {items.map((item) => (
          <article
            key={item.id}
            className="bg-[#171717] rounded-2xl border border-white/10 p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-xl">
                    {item.production?.title || "بیرق ماندگار"}
                  </h3>
                  {item.label && (
                    <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
                      {item.label}
                    </span>
                  )}
                </div>

                <div className="flex gap-5 mt-3 text-white/60">
                  <span>{item.date}</span>
                  <span>ساعت {item.time}</span>
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                <Info title="ظرفیت کل" value={item.capacity} />
                <Info title="باقی‌مانده" value={item.remaining_capacity} accent />
                <Info
                  title="رزرو"
                  value={item.booking_enabled ? "باز" : "بسته"}
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Info({ title, value, accent = false }) {
  return (
    <div className="min-w-28 rounded-xl bg-black/20 border border-white/10 px-4 py-3">
      <div className="text-xs text-white/40">{title}</div>
      <div className={`mt-1 font-bold ${accent ? "text-[#d4af37]" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}
