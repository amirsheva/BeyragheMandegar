export function validateBooking(data) {
  if (!data.name) return "نام الزامی است";
  if (!data.phone) return "شماره موبایل الزامی است";
  return null;
}
