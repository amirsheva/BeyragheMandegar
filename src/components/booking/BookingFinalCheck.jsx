export default function BookingFinalCheck({valid}) {
  return (
    <div dir="rtl">
      {valid ? "اطلاعات آماده ثبت است" : "اطلاعات ناقص است"}
    </div>
  );
}
