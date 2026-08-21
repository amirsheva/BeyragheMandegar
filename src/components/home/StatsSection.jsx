export default function StatsSection() {
 const items=[["+50","اجرا"],["+1000","مخاطب"],["+10","سال تجربه"]];
 return <section dir="rtl" className="grid md:grid-cols-3 gap-6 px-6 py-20">{items.map(x=><div className="bg-white/5 rounded-3xl p-8 text-center" key={x[1]}><b className="text-4xl text-[#d4af37]">{x[0]}</b><p>{x[1]}</p></div>)}</section>;
}
