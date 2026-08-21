import { useEffect, useState } from "react";
import PerformanceCard from "./PerformanceCard";

export default function UpcomingPerformances() {
  const [shows, setShows] = useState([]);

  useEffect(() => {
    fetch("/api/shows")
      .then(r => r.json())
      .then(setShows)
      .catch(() => setShows([]));
  }, []);

  return (
    <section id="performances" dir="rtl" className="px-6 py-24">
      <h2 className="text-4xl text-[#d4af37] font-black mb-8">
        اجراهای پیش رو
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {shows.map(show => (
          <PerformanceCard key={show.id} show={show} />
        ))}
      </div>
    </section>
  );
}
