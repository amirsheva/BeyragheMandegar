import { motion } from "framer-motion";
import GlassCard from "../common/GlassCard";

const news = [
  {
    title: "آغاز فصل جدید اجراها",
    date: "۱۴۰۵/۰۸/۰۱",
    text: "آخرین اخبار و رویدادهای گروه بیرق ماندگار."
  },
  {
    title: "پشت صحنه نمایش",
    date: "۱۴۰۵/۰۸/۰۵",
    text: "روایت‌هایی از فرآیند خلق یک اجرای نمایشی."
  }
];

export default function NewsSection() {
  return (
    <section id="news" dir="rtl" className="px-6 py-24 bg-[#111]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-black text-[#d4af37] mb-10">
          اخبار و رویدادها
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {news.map((item) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-6">
                <div className="text-sm text-[#d4af37]">
                  {item.date}
                </div>

                <h3 className="text-2xl font-bold mt-4">
                  {item.title}
                </h3>

                <p className="mt-4 text-gray-300 leading-8">
                  {item.text}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
