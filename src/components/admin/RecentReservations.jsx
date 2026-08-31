export default function RecentReservations({items=[]}) {
  return (
    <div dir="rtl">
      {items.map((x,i)=><div key={i}>{x.name || "رزرو"}</div>)}
    </div>
  );
}
