export default function PerformanceHero({show}) {
  return (
    <section dir="rtl" className="py-20">
      <h1 className="text-5xl font-black text-[#d4af37]">
        {show?.title || "اجرای نمایش"}
      </h1>
    </section>
  );
}
