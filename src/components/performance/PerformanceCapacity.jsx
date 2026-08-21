export default function PerformanceCapacity({capacity}) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white/5 p-4">
      ظرفیت باقی‌مانده: {capacity ?? "-"}
    </div>
  );
}
