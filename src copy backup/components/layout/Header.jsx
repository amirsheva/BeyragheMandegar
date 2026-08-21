import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header dir="rtl" className="fixed top-0 inset-x-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="text-2xl font-bold text-[#d4af37]">بیرق ماندگار</div>

        <nav className="hidden md:flex gap-8 text-white">
          <a href="#">خانه</a>
          <a href="#performances">اجراها</a>
          <a href="#about">درباره ما</a>
          <a href="#news">اخبار</a>
        </nav>

        <button className="hidden md:block bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold">
          رزرو بلیت
        </button>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden p-6 bg-black text-white space-y-4">
          <div>خانه</div>
          <div>اجراها</div>
          <div>درباره ما</div>
          <div>اخبار</div>
        </div>
      )}
    </header>
  );
}
