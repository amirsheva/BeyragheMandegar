export default function BookingGuard({children, valid=true}) {
  if (!valid) {
    return (
      <div dir="rtl" className="rounded-2xl bg-red-500/10 p-5">
        اطلاعات رزرو کامل نیست.
      </div>
    );
  }

  return children;
}
