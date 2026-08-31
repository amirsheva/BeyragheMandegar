export default function StatsWidget({title,value}) {
  return (
    <div className="rounded-3xl bg-white/5 p-5">
      {title}: {value}
    </div>
  );
}
