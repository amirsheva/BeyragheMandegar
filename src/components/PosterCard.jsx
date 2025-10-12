import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

export default function PosterCard() {
  const [open, setOpen] = useState(false);
  const posterSrc = "/poster.jpg"; // فایل پوستر را در public قرار بده

  return (
    <>
      {/* کارت کوچک با انیمیشن fade-in */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card overflow-hidden cursor-pointer group"
        onClick={() => setOpen(true)}
      >
        <h3 className="text-lg font-bold mb-3">پوستر نمایش</h3>
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={posterSrc}
            alt="پوستر نمایش"
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.outerHTML =
                '<div class="text-sm text-gray-500 dark:text-gray-400 p-4">فایل پوستر (poster.jpg) در پوشه public یافت نشد.</div>';
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition"></div>
        </div>
      </motion.div>

      {/* مودال نمایش پوستر در سایز بزرگ */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full"
            >
              {/* دکمه بستن */}
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 bg-black/40 dark:bg-white/20 text-white dark:text-gray-200 rounded-full p-2 hover:scale-110 transition"
                aria-label="بستن"
              >
                <X size={20} />
              </button>

              {/* تصویر پوستر */}
              <img
                src={posterSrc}
                alt="پوستر نمایش بزرگ"
                className="w-full h-auto object-contain rounded-t-2xl"
              />

              {/* دکمه دانلود پایین مودال */}
              <div className="flex justify-center items-center py-3 border-t dark:border-gray-700">
                <a
                  href={posterSrc}
                  download
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200"
                >
                  <Download size={18} />
                  دانلود پوستر
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}