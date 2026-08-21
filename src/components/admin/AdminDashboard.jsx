import DashboardCard from "./DashboardCard";
import ReservationCount from "./ReservationCount";

export default function AdminDashboard({stats={}}) {
  return (
    <div dir="rtl" className="grid gap-4 md:grid-cols-3 p-6">
      <DashboardCard title="رزروها" value={stats.reservations || 0}/>
      <DashboardCard title="ظرفیت" value={stats.capacity || 0}/>
      <ReservationCount count={stats.reservations || 0}/>
    </div>
  );
}
