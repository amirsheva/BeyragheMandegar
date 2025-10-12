import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_COUNT = 5; // سقف مجاز تعداد بلیت (به‌دلخواه قابل تغییر)

// ✅ اعتبارسنجی کد ملی ایران
function isValidNationalId(input) {
  const code = String(input || "").trim();
  if (!/^\d{10}$/.test(code)) return false;
  if (
    [
      "0000000000",
      "1111111111",
      "2222222222",
      "3333333333",
      "4444444444",
      "5555555555",
      "6666666666",
      "7777777777",
      "8888888888",
      "9999999999",
    ].includes(code)
  )
    return false;
  const check = parseInt(code[9], 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(code[i], 10) * (10 - i);
  const mod = sum % 11;
  return (mod < 2 && check === mod) || (mod >= 2 && check === 11 - mod);
}

export function PersonalInfoModal({
  open,
  onClose,
  onNext,
  defaultPhone = "",
  busy = false,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [nationalId, setNationalId] = useState("");
  const [count, setCount] = useState(1);
  const [error, setError] = useState("");
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (open) firstInputRef.current?.focus();
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  const iranMobile = /^(?:\+98|0)?9\d{9}$/;

  function submit(e) {
    e.preventDefault();
    if (!name.trim()) return setError("لطفاً نام و نام خانوادگی خود را وارد کنید.");
    if (!iranMobile.test(String(phone)))
      return setError("شماره موبایل معتبر نیست (مثلاً 09123456789).");
    if (!isValidNationalId(nationalId))
      return setError("کد ملی واردشده معتبر نیست.");
    if (count < 1 || count > MAX_COUNT)
      return setError(`تعداد نفرات باید بین ۱ تا ${MAX_COUNT} نفر باشد.`);
    setError("");

    onNext({
      name: name.trim(),
      phone: String(phone).trim(),
      nationalId: nationalId.trim(),
      count: Number(count),
    });
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">اطلاعات رزرو</h3>

            <form onSubmit={submit} className="space-y-3">
              {/* 🔹 نام */}
              <div>
                <label className="block mb-1">نام و نام خانوادگی</label>
                <input
                  ref={firstInputRef}
                  className="w-full border rounded p-2 dark:bg-gray-800"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  onInvalid={(e) =>
                    e.target.setCustomValidity("نام را وارد کنید.")
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                />
              </div>

              {/* 🔹 موبایل */}
              <div>
                <label className="block mb-1">شماره موبایل</label>
                <input
                  className="w-full border rounded p-2 dark:bg-gray-800"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="09123456789"
                  pattern="^(?:\+98|0)?9\d{9}$"
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      "شماره موبایل معتبر نیست (مثلاً 09123456789)."
                    )
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                />
              </div>

              {/* 🔹 کد ملی */}
              <div>
                <label className="block mb-1">کد ملی</label>
                <input
                  className="w-full border rounded p-2 dark:bg-gray-800"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  required
                  placeholder="0123456789"
                  pattern="\d{10}"
                  onInvalid={(e) =>
                    e.target.setCustomValidity("کد ملی باید ۱۰ رقم باشد.")
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                />
              </div>

              {/* 🔹 تعداد نفرات */}
              <div>
                <label className="block mb-1">تعداد نفرات</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_COUNT}
                  className="w-full border rounded p-2 dark:bg-gray-800"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  required
                  onInvalid={(e) =>
                    e.target.setCustomValidity(
                      `تعداد باید بین ۱ تا ${MAX_COUNT} نفر باشد.`
                    )
                  }
                  onInput={(e) => e.target.setCustomValidity("")}
                />
              </div>

              {/* 🔹 خطا */}
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

              {/* 🔹 دکمه‌ها */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn"
                  onClick={onClose}
                  disabled={busy}
                >
                  بستن
                </button>
                <button
                  className="btn btn-primary disabled:opacity-60"
                  disabled={busy}
                >
                  {busy ? "در حال ثبت..." : "ثبت رزرو"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}