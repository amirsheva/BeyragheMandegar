export default function ReservationResult({success, reservation}) {
  if (!success) return null;

  return (
    <div dir="rtl" className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-6">
      <h2 className="text-xl font-bold">رزرو با موفقیت ثبت شد</h2>
      <p className="mt-3">
        کد پیگیری: {reservation?.id || "-"}
      </p>
    </div>
  );
}
