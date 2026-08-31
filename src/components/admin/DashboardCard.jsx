export default function DashboardCard({title,value}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      <h3>{title}</h3>
      <strong>{value}</strong>
    </div>
  );
}
