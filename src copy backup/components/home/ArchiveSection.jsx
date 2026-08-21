import GlassCard from "../common/GlassCard";

const archive = [
  {
    title: "اجرای گذشته",
    venue: "سالن نمایش",
    date: "۱۴۰۵/۰۵/۲۰"
  }
];

export default function ArchiveSection() {
  return (
    <section id="archive" dir="rtl" className="px-6 py-24 bg-gradient-to-b from-[#15120b] to-[#111]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-black text-[#d4af37] mb-10">
          آرشیو اجراها
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {archive.map((item) => (
            <GlassCard key={item.title} className="p-6">
              <h3 className="text-xl font-bold">
                {item.title}
              </h3>

              <p className="mt-4 text-gray-300">
                {item.venue}
              </p>

              <p className="text-gray-400">
                {item.date}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
