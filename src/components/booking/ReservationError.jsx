export default function ReservationError({message}) {
  return (
    <div dir="rtl" className="p-6 rounded-3xl bg-red-900/30 border border-red-500/30">
      {message || "خطایی رخ داده است."}
    </div>
  );
}
