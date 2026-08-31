export default function InfoCard({title,value}) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white/5 p-4">
      <b>{title}</b>
      <div>{value}</div>
    </div>
  );
}
