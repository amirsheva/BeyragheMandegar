import PersonalInfoModal from "../components/common/PersonalInfoModal";
import { useState } from "react";

export default function Booking() {
  const [open, setOpen] = useState(true);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#111] text-white flex items-center justify-center p-6"
    >
      <PersonalInfoModal
        open={open}
        onClose={() => setOpen(false)}
        onNext={() => setOpen(false)}
      />
    </div>
  );
}
