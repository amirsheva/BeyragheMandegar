export default function BookingSummary({ show }) {
  return (
    <div dir="rtl" className="text-right">
      <h2 className="text-2xl font-bold text-[#d4af37]">
        خلاصه رزرو
      </h2>

      <p className="mt-4 text-gray-300">
        {show?.title || "انتخاب اجرا"}
      </p>
    </div>
  );
}
