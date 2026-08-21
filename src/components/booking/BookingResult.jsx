export default function BookingResult({result}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      نتیجه رزرو: {result || "-"}
    </div>
  );
}
