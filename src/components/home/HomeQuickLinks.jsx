export default function HomeQuickLinks({items=[]}) {
  return (
    <div className="grid gap-3">
      {items.map((item,i)=>
        <div key={i} className="rounded-xl bg-white/5 p-4">{item}</div>
      )}
    </div>
  );
}
