export function validateReservation(data) {
  if (!data.name) return "نام الزامی است.";
  if (!data.phone) return "شماره موبایل الزامی است.";
  if (!data.nationalId) return "کد ملی الزامی است.";
  if (!data.count || data.count < 1) return "تعداد نامعتبر است.";

  return null;
}
