export default function ReservationTicket({reservation, show}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-3">
      <h3 className="text-xl font-bold text-[#d4af37]">
        رسید رزرو
      </h3>
      <p>اجرا: {show?.title || "-"}</p>
      <p>کد رزرو: {reservation?.id || "-"}</p>
    </div>
  );
}
