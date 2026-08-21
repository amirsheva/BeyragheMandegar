export default function BookingReview({data}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6 space-y-2">
      <h3 className="font-bold text-[#d4af37]">بازبینی رزرو</h3>
      <p>نام: {data?.name || "-"}</p>
      <p>تعداد: {data?.count || 0}</p>
    </div>
  );
}
