export default function ReportCard({title,value}) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white/5 p-5">
      <div>{title}</div>
      <strong className="text-[#d4af37] text-2xl">{value}</strong>
    </div>
  );
}
