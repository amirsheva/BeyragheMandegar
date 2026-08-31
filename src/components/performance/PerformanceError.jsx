export default function PerformanceError({message}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-red-500/10 p-6">
      {message || "خطا در دریافت اطلاعات اجرا"}
    </div>
  );
}
