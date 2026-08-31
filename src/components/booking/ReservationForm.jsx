import { useState } from "react";
import { buildReservationPayload } from "./ReservationPayload";
import { createReservation } from "../../lib/api";
import { useBooking } from "./BookingContext";

export default function ReservationForm() {
  const { selectedShow } = useBooking();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    nationalId: "",
    count: 1
  });

  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();

    try {
      const payload = buildReservationPayload(selectedShow, form);
      await createReservation(payload);
      setMessage("رزرو با موفقیت ثبت شد.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={submit} dir="rtl" className="space-y-4">
      <input
        className="w-full p-3 rounded-xl text-black"
        placeholder="نام"
        value={form.name}
        onChange={(e)=>setForm({...form, name:e.target.value})}
      />

      <input
        className="w-full p-3 rounded-xl text-black"
        placeholder="موبایل"
        value={form.phone}
        onChange={(e)=>setForm({...form, phone:e.target.value})}
      />

      <input
        className="w-full p-3 rounded-xl text-black"
        placeholder="کد ملی"
        value={form.nationalId}
        onChange={(e)=>setForm({...form, nationalId:e.target.value})}
      />

      <input
        className="w-full p-3 rounded-xl text-black"
        type="number"
        min="1"
        placeholder="تعداد"
        value={form.count}
        onChange={(e)=>setForm({...form, count:e.target.value})}
      />

      <button className="bg-[#d4af37] text-black px-6 py-3 rounded-xl">
        ثبت رزرو
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
