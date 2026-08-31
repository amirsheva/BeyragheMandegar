export default function PerformanceShareCard({title}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      اشتراک اجرا: {title || "-"}
    </div>
  );
}
