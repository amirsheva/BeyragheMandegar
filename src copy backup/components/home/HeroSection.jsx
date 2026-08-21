import { motion } from "framer-motion";
import GoldButton from "../common/GoldButton";
import Countdown from "../common/Countdown";

export default function HeroSection() {
  return (
    <section
      dir="rtl"
      className="
        relative min-h-screen flex items-center justify-center
        overflow-hidden px-6 pt-24
        bg-gradient-to-b from-black via-[#17130a] to-[#111]
      "
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,.18),transparent_45%)]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .8 }}
        className="relative z-10 max-w-5xl text-center"
      >
        <p className="text-[#d4af37] tracking-[.3em] mb-6">
          گروه نمایشی بیرق ماندگار
        </p>

        <h1 className="
          text-5xl md:text-7xl
          font-black leading-tight
        ">
          روایتی که
          <span className="text-[#d4af37]"> ماندگار </span>
          می‌شود
        </h1>

        <p className="mt-8 text-gray-300 text-lg md:text-xl leading-10 max-w-3xl mx-auto">
          تجربه‌ای متفاوت از تئاتر، ترکیبی از هنر، احساس و داستان.
        </p>

        <div className="mt-10">
          <Countdown />
        </div>

        <div className="mt-10 flex justify-center">
          <GoldButton>
            رزرو بلیت
          </GoldButton>
        </div>
      </motion.div>
    </section>
  );
}
