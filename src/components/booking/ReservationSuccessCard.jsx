export default function ReservationSuccessCard({reservation}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-emerald-500/10 border border-emerald-500/30 p-6">
      <h2 className="text-2xl font-bold text-emerald-400">
        رزرو با موفقیت ثبت شد
      </h2>
      <p className="mt-3">
        شماره رزرو: {reservation?.id || "-"}
      </p>
    </div>
  );
}
