import { useState } from "react";
import PersonalInfoModal from "../common/PersonalInfoModal";

export default function BookingFlow({ show }) {
  const [open, setOpen] = useState(false);

  return (
    <div dir="rtl">
      <button
        onClick={() => setOpen(true)}
        className="bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold"
      >
        رزرو بلیت
      </button>

      <PersonalInfoModal
        open={open}
        onClose={() => setOpen(false)}
        onNext={() => setOpen(false)}
      />
    </div>
  );
}
