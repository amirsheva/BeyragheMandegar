
import {adminNavigation} from "./navigation";

export default function AdminSidebar(){

 return (
  <aside className="w-72 min-h-screen bg-[#111] p-6 border-l border-white/10" dir="rtl">

   <h1 className="text-[#d4af37] text-2xl font-bold mb-10">
    بیرق ماندگار
   </h1>

   <nav className="space-y-3">
    {adminNavigation.map(item=>(
      <a
       key={item.path}
       href={item.path}
       className="block p-3 rounded-xl hover:bg-white/10"
      >
       {item.title}
      </a>
    ))}
   </nav>

  </aside>
 );
}
