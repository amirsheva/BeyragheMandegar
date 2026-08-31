export default function BookingSummaryCard({show}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6 border border-white/10">
      <h3 className="font-bold text-[#d4af37]">خلاصه رزرو</h3>
      <p className="mt-3">{show?.title || "-"}</p>
    </div>
  );
}
