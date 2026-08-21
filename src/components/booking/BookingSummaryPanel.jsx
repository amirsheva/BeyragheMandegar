export default function BookingSummaryPanel({show, form}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-3">
      <h3 className="text-xl font-bold text-[#d4af37]">خلاصه نهایی</h3>
      <p>اجرا: {show?.title || "-"}</p>
      <p>نام: {form?.name || "-"}</p>
      <p>تعداد: {form?.count || 1}</p>
    </div>
  );
}
