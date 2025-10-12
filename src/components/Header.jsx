import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const [dark, setDark] = useState(
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const el = document.documentElement;
    dark ? el.classList.add("dark") : el.classList.remove("dark");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <header className="py-8 md:py-10 text-center relative">
      {/* آیکن تغییر تم: در نماهای خیلی کوچک، به چپ منتقل می‌شود */}
      <button
        onClick={() => setDark((d) => !d)}
        className="absolute top-3 right-4 max-[520px]:left-4 max-[520px]:right-auto
                   border border-gray-300 dark:border-gray-700 rounded-full p-2
                   bg-white/70 dark:bg-black/30 backdrop-blur
                   hover:scale-105 transition"
        title="تغییر تم"
        aria-label="تغییر تم"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* عنوان در مرکز؛ در موبایل کمی کوچک‌تر که برخورد نکند */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight"
      >
        بیرق ماندگار
      </motion.h1>
    </header>
  );
}