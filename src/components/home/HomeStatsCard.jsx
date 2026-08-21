export default function HomeStatsCard({value,label}) {
  return (
    <div className="rounded-3xl bg-white/5 p-6 text-center">
      <div className="text-3xl text-[#d4af37]">{value || 0}</div>
      <div>{label}</div>
    </div>
  );
}
