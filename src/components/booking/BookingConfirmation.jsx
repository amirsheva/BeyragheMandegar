export default function BookingConfirmation({reservation}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-emerald-900/20 border border-emerald-500/30 p-8">
      <h2 className="text-2xl font-bold text-emerald-400">
        رزرو تایید شد
      </h2>
      <p className="mt-4 text-gray-300">
        شماره رزرو: {reservation?.id || "-"}
      </p>
    </div>
  );
}
