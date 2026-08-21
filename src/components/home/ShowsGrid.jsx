import PerformanceCard from "./PerformanceCard";

export default function ShowsGrid({shows=[]}) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {shows.map(show => (
        <PerformanceCard key={show.id} show={show}/>
      ))}
    </div>
  );
}
