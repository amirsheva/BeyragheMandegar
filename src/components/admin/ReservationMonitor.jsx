export default function ReservationMonitor({items=[]}) {
  return (
    <div dir="rtl" className="space-y-3">
      {items.map((item,index)=>(
        <div key={index} className="bg-white/5 rounded-xl p-4">
          رزرو #{index+1}
        </div>
      ))}
    </div>
  );
}
