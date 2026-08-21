import { Link } from "react-router-dom";

export default function PerformanceCard({show}) {
  return (
    <div dir="rtl" className="bg-white/5 rounded-3xl p-6 border border-white/10">
      <h3 className="font-bold text-xl">{show.title}</h3>
      <p className="mt-3">{show.date}</p>
      <Link className="inline-block mt-5 bg-[#d4af37] text-black px-5 py-2 rounded-xl" to={`/performance/${show.id}`}>
        جزئیات
      </Link>
    </div>
  );
}
