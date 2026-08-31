export default function ProductionCheck({items=[]}) {
  return (
    <ul dir="rtl" className="space-y-2">
      {items.map((item,i)=>
        <li key={i}>{item}</li>
      )}
    </ul>
  );
}
