export default function BookingSummary({show}) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white/5 p-6">
      <h3 className="text-xl font-bold text-[#d4af37]">
        خلاصه رزرو
      </h3>
      <p className="mt-3 text-gray-300">
        {show?.title || "انتخاب اجرا نشده"}
      </p>
    </div>
  );
}
