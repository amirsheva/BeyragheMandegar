export default function PerformanceFinalView({show}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      {show?.title || "اجرای بیرق ماندگار"}
    </div>
  );
}
