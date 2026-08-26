import useDashboardStats from "./hooks/useDashboardStats";

export default function Dashboard() {
  const stats = useDashboardStats();

  return (
    <div dir="rtl">
      <div className="mb-10">
        <h2 className="text-3xl font-bold">داشبورد مدیریت</h2>
        <p className="text-white/50 mt-2">نمای کلی وضعیت نمایش، اجراها و رزروها</p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        <Card title="نمایش‌ها" value={stats?.productions ?? "..."} />
        <Card title="اجراها" value={stats?.performances ?? "..."} />
        <Card title="رزروها" value={stats?.reservations ?? "..."} />
        <Card title="بلیت‌های رزرو شده" value={stats?.tickets ?? "..."} />
        <Card title="ظرفیت کل" value={stats?.totalCapacity ?? "..."} />
        <Card title="ظرفیت باقی‌مانده" value={stats?.remainingCapacity ?? "..."} />
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-[#171717] border border-white/10 rounded-3xl p-6">
      <div className="text-[#d4af37] text-4xl font-bold">{value}</div>
      <div className="mt-3 text-white/70">{title}</div>
    </div>
  );
}
