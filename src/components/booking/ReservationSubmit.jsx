import { useState } from "react";
import { createReservation } from "../../lib/api";

export default function ReservationSubmit({payload}) {
  const [message, setMessage] = useState("");

  async function submit() {
    try {
      await createReservation(payload);
      setMessage("رزرو با موفقیت ثبت شد.");
    } catch(e) {
      setMessage(e.message);
    }
  }

  return (
    <div dir="rtl">
      <button
        onClick={submit}
        className="bg-[#d4af37] text-black px-6 py-3 rounded-xl"
      >
        ثبت نهایی رزرو
      </button>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
