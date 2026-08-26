import { useEffect, useMemo, useState } from "react";

export default function ReservationManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reservations")
      .then((res) => res.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const ticketCount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.count || 0), 0),
    [items]
  );

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">مدیریت رزروها</h2>
        <p className="text-white/50 mt-2">رزروهای ثبت‌شده برای اجراهای بیرق ماندگار</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-8">
        <Stat title="تعداد رزرو" value={items.length} />
        <Stat title="تعداد بلیت" value={ticketCount} />
      </div>

      <div className="bg-[#171717] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-white/50">در حال دریافت اطلاعات...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-white/50">هنوز رزروی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[900px]">
              <thead className="border-b border-white/10 text-white/50">
                <tr>
                  <th className="p-4">نام</th>
                  <th className="p-4">موبایل</th>
                  <th className="p-4">اجرا</th>
                  <th className="p-4">تاریخ</th>
                  <th className="p-4">ساعت</th>
                  <th className="p-4">بلیت</th>
                  <th className="p-4">کد پیگیری</th>
                  <th className="p-4">وضعیت</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="p-4">{item.name}</td>
                    <td className="p-4 text-white/70">{item.phone}</td>
                    <td className="p-4">
                      {item.performance?.production?.title || "—"}
                    </td>
                    <td className="p-4 text-white/70">
                      {item.performance?.date || "—"}
                    </td>
                    <td className="p-4 text-white/70">
                      {item.performance?.time || "—"}
                    </td>
                    <td className="p-4 text-[#d4af37] font-bold">
                      {item.count}
                    </td>
                    <td className="p-4 text-white/60 font-mono text-sm">
                      {item.tracking_code}
                    </td>
                    <td className="p-4">
                      {item.status === "confirmed" ? "تأیید شده" : item.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value }) {
  return (
    <div className="bg-[#171717] p-6 rounded-2xl border border-white/10">
      <div className="text-white/60">{title}</div>
      <strong className="block text-3xl text-[#d4af37] mt-3">{value}</strong>
    </div>
  );
}
