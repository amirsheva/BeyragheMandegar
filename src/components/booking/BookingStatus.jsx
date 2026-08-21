export default function BookingStatus({status}) {
  const text = {success:"رزرو با موفقیت انجام شد.", pending:"در انتظار تایید", error:"خطا در ثبت رزرو"};
  return <div dir="rtl" className="p-5 rounded-2xl bg-white/5">{text[status] || status}</div>;
}
