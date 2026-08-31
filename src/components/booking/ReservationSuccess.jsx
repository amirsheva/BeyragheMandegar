export default function ReservationSuccess({message}) {
  return (
    <div dir="rtl" className="p-6 rounded-3xl bg-emerald-900/30 border border-emerald-500/30">
      {message || "رزرو با موفقیت ثبت شد."}
    </div>
  );
}
