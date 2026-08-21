export default function BookingFinalTicket({reservation}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-emerald-500/10 p-6">
      <h3 className="font-bold">بلیط نهایی</h3>
      <p>کد رزرو: {reservation?.id || "-"}</p>
    </div>
  );
}
