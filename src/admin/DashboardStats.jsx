
export default function DashboardStats(){
 const stats=[
  ["نمایش فعال","1"],
  ["اجراها","12"],
  ["رزروها","245"],
  ["ظرفیت کل","550"]
 ];

 return (
  <div className="grid md:grid-cols-4 gap-5" dir="rtl">
   {stats.map(s=>(
    <div key={s[0]}
     className="bg-[#171717] border border-white/10 rounded-3xl p-6">
     <div className="text-[#d4af37] text-3xl font-bold">
      {s[1]}
     </div>
     <div className="mt-2 text-white/70">
      {s[0]}
     </div>
    </div>
   ))}
  </div>
 );
}
