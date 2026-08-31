export default function ReservationTable({items=[]}) {
  return (
    <div dir="rtl">
      {items.map((x,i)=><div key={i}>{x.name || "رزرو"}</div>)}
    </div>
  );
}
