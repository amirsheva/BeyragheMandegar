export default function ReservationList({items=[]}) {
  return (
    <div dir="rtl" className="space-y-3 p-6">
      {items.map((item,index)=>(
        <div key={index} className="rounded-2xl bg-white/5 p-4">
          {item.name || "رزرو"}
        </div>
      ))}
    </div>
  );
}
