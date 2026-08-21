export default function BadgeGroup({items=[]}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {items.map((x,i)=><span key={i} className="px-3 py-1 rounded-full bg-white/10">{x}</span>)}
    </div>
  );
}
