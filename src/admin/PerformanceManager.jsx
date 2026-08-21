
import usePerformances from "./hooks/usePerformances";

export default function PerformanceManager(){

 const items = usePerformances();

 return (
  <div dir="rtl">

   <h2 className="text-3xl font-bold mb-8">
    مدیریت اجراها
   </h2>

   <div className="space-y-4">
    {items.map(item=>(
     <div
      key={item.id}
      className="bg-[#171717] rounded-2xl border border-white/10 p-6"
     >
      {item.venue} - {item.date} - {item.time}
     </div>
    ))}
   </div>

  </div>
 );
}
