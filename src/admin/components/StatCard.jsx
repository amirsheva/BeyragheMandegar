
export default function StatCard({title,value}){
 return (
  <div className="bg-[#171717] border border-white/10 rounded-3xl p-6">
   <div className="text-[#d4af37] text-3xl font-bold">{value}</div>
   <div className="text-white/70 mt-3">{title}</div>
  </div>
 );
}
