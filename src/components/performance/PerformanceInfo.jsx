export default function PerformanceInfo({show}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 border border-white/10 p-8">
      <h2 className="text-2xl font-bold text-[#d4af37]">
        {show?.title || "جزئیات اجرا"}
      </h2>
      <div className="mt-5 text-gray-300 space-y-2">
        <p>تاریخ: {show?.date || "-"}</p>
        <p>ساعت: {show?.time || "-"}</p>
        <p>ظرفیت: {show?.capacity || "-"}</p>
      </div>
    </div>
  );
}
