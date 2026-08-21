import { motion } from "framer-motion";
import GlassCard from "../common/GlassCard";

export default function AboutSection() {
  return (
    <section
      id="about"
      dir="rtl"
      className="px-6 py-24 bg-gradient-to-b from-[#111] to-[#15120b]"
    >
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
        >
          <p className="text-[#d4af37] mb-4">
            درباره گروه
          </p>

          <h2 className="text-4xl font-black leading-relaxed">
            روایت‌هایی برای
            <span className="text-[#d4af37]"> ماندگار شدن</span>
          </h2>

          <p className="mt-6 text-gray-300 leading-10">
            بیرق ماندگار با نگاه به هنر نمایش،
            داستان‌گویی و ارتباط عمیق با مخاطب شکل گرفته است.
            هدف ما خلق تجربه‌ای است که پس از پایان اجرا
            همچنان در ذهن و احساس مخاطب باقی بماند.
          </p>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
        >
          <GlassCard className="p-8 min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl text-[#d4af37] mb-5">
                ✦
              </div>

              <h3 className="text-2xl font-bold">
                هنر، روایت، احساس
              </h3>

              <p className="mt-4 text-gray-400">
                یک تجربه متفاوت روی صحنه
              </p>
            </div>
          </GlassCard>
        </motion.div>

      </div>
    </section>
  );
}
