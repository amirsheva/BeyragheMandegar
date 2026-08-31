
export default function DataTable({columns=[],rows=[]}){
 return (
  <table className="w-full text-right bg-[#171717] rounded-2xl overflow-hidden">
   <thead>
    <tr>
     {columns.map(c=><th key={c} className="p-4">{c}</th>)}
    </tr>
   </thead>
   <tbody>
    {rows.map((r,i)=>(
     <tr key={i} className="border-t border-white/10">
      {r.map((x,j)=><td key={j} className="p-4">{x}</td>)}
     </tr>
    ))}
   </tbody>
  </table>
 );
}
