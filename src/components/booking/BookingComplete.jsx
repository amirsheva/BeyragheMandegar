export default function BookingComplete({reservation}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-emerald-500/10 p-6">
      رزرو نهایی شد: {reservation?.id || "-"}
    </div>
  );
}
