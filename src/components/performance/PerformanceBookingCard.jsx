import { Link } from "react-router-dom";

export default function PerformanceBookingCard({id}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 border border-white/10 p-6">
      <h3 className="text-xl font-bold text-[#d4af37]">
        رزرو این اجرا
      </h3>
      <Link
        to="/booking"
        className="inline-block mt-5 bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold"
      >
        ادامه رزرو
      </Link>
    </div>
  );
}
