
import useDashboardStats from "./hooks/useDashboardStats";

export default function Dashboard(){
 const stats=useDashboardStats();

 return (
  <div dir="rtl">
   <h2 className="text-3xl font-bold mb-8">
    داشبورد مدیریت
   </h2>

   <div className="grid md:grid-cols-3 gap-5">
    <Card title="نمایش‌ها" value={stats?.shows ?? "..."} />
    <Card title="اجراها" value={stats?.performances ?? "..."} />
    <Card title="رزروها" value={stats?.reservations ?? "..."} />
   </div>
  </div>
 );
}

function Card({title,value}){
 return (
  <div className="bg-[#171717] border border-white/10 rounded-3xl p-6">
   <div className="text-[#d4af37] text-4xl font-bold">
    {value}
   </div>
   <div className="mt-3 text-white/70">
    {title}
   </div>
  </div>
 );
}
