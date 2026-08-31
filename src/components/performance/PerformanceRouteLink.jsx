import { Link } from "react-router-dom";

export default function PerformanceRouteLink({id}) {
  return (
    <Link
      to={`/performance/${id}`}
      className="inline-block px-5 py-3 rounded-xl bg-[#d4af37] text-black"
    >
      مشاهده اجرا
    </Link>
  );
}
