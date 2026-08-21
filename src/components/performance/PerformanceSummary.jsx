export default function PerformanceSummary({show}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      {show?.title || "اطلاعات اجرا"}
    </div>
  );
}
