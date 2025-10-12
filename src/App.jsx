import { useEffect, useState } from "react";
import Header from "./components/Header";
import MapSection from "./components/MapSection";
import DirectionLinks from "./components/DirectionLinks";
import ScheduleList from "./components/ScheduleList";
import { PersonalInfoModal } from "./components/Modals";
import { AnimatePresence, motion } from "framer-motion";
import PosterCard from "./components/PosterCard"; // 🎭 پوستر جدید

// ✅ Toast زیبا برای پیام موفقیت/خطا
function Toast({ msg, type, onClose, duration = 7000 }) {
  const [open, setOpen] = useState(Boolean(msg));

  useEffect(() => {
    setOpen(Boolean(msg));
    if (!msg) return;
    const t = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(t);
  }, [msg, duration, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className={`fixed bottom-6 right-6 z-50 rounded-lg px-4 py-3 shadow-lg ${
            type === "error"
              ? "bg-red-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{msg}</span>
            <button
              className="ml-4 underline"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
            >
              بستن
            </button>
          </div>
          <div className="toast-bar mt-2 h-[4px] bg-white/60 rounded-full animate-[toastShrink_7s_linear_forwards]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  const [shows, setShows] = useState([]);
  const [piOpen, setPiOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "ok" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/shows")
      .then((r) => r.json())
      .then(setShows);
  }, []);

  function onReserve(payload) {
    setPending(payload);
    setPiOpen(true);
  }

  async function confirmReservation(personal) {
    try {
      setBusy(true);
      setPiOpen(false);
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: personal.name,
          phone: personal.phone,
          nationalId: personal.nationalId,
          count: personal.count,
          showtime: pending,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setToast({ msg: "✅ رزرو با موفقیت انجام شد.", type: "ok" });
      fetch("/api/shows").then((r) => r.json()).then(setShows);
    } catch (e) {
      setToast({ msg: e.message || "خطای رزرو", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container py-8 space-y-8">
      <Header />

      {/* 🎭 ساختار جدید صفحه */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* ستون راست: لیست سانس‌ها و مسیرها */}
        <div className="md:col-span-2 space-y-6">
          <ScheduleList shows={shows} onReserve={onReserve} />
          <DirectionLinks />
        </div>

        {/* ستون چپ: پوستر در بالا، نقشه در پایین */}
        <div className="space-y-6">
          <PosterCard />  {/* 🎭 پوستر جدید */}
          <MapSection />   {/* 🗺️ نقشه پایین‌تر */}
        </div>
      </div>

      {/* مودال ثبت اطلاعات کاربر */}
      <PersonalInfoModal
        open={piOpen}
        onClose={() => setPiOpen(false)}
        onNext={confirmReservation}
        busy={busy}
      />

      {/* پیام موفقیت / خطا */}
      <Toast
        msg={toast.msg}
        type={toast.type}
        onClose={() => setToast({ msg: "" })}
      />
    </main>
  );
}