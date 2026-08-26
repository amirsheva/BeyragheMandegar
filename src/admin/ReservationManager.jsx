import { useEffect, useMemo, useState } from "react";

async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "خطا در ارتباط با سرور");
  }
  return data;
}

export default function ReservationManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await readJson(await fetch("/api/admin/reservations"));
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeItems = useMemo(
    () => items.filter((item) => item.status === "confirmed"),
    [items]
  );

  const ticketCount = useMemo(
    () => activeItems.reduce((sum, item) => sum + Number(item.count || 0), 0),
    [activeItems]
  );

  async function changeStatus(item, status) {
    setBusyId(item.id);
    setError("");

    try {
      await readJson(
        await fetch(`/api/admin/reservations/${item.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      );
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">مدیریت رزروها</h2>
        <p className="text-white/50 mt-2">رزروهای ثبت‌شده برای اجراهای بیرق ماندگار</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <Stat title="کل رزروها" value={items.length} />
        <Stat title="رزرو فعال" value={activeItems.length} />
        <Stat title="بلیت فعال" value={ticketCount} />
      </div>

      <div className="bg-[#171717] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-white/50">در حال دریافت اطلاعات...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-white/50">هنوز رزروی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[1100px]">
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
                  <th className="p-4">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-white/5 last:border-0 ${
                      item.status === "cancelled" ? "opacity-55" : ""
                    }`}
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
                      <span
                        className={`text-xs px-3 py-1.5 rounded-full border ${
                          item.status === "confirmed"
                            ? "text-emerald-300 border-emerald-500/20 bg-emerald-500/10"
                            : "text-red-300 border-red-500/20 bg-red-500/10"
                        }`}
                      >
                        {item.status === "confirmed" ? "تأیید شده" : "لغو شده"}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.status === "confirmed" ? (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => changeStatus(item, "cancelled")}
                          className="border border-red-500/20 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                        >
                          لغو رزرو
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => changeStatus(item, "confirmed")}
                          className="border border-emerald-500/20 rounded-lg px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                          فعال‌سازی مجدد
                        </button>
                      )}
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
