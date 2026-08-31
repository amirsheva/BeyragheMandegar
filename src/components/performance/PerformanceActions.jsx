import { Link } from "react-router-dom";

export default function PerformanceActions({id}) {
  return (
    <div dir="rtl" className="flex gap-4 mt-6">
      <Link
        to="/booking"
        className="bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold"
      >
        رزرو
      </Link>

      <Link
        to={`/performance/${id}`}
        className="bg-white/10 px-6 py-3 rounded-xl"
      >
        جزئیات
      </Link>
    </div>
  );
}
