export default function CustomerInfoCard({form}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      <h3 className="font-bold text-[#d4af37]">اطلاعات مشتری</h3>
      <p>نام: {form?.name || "-"}</p>
      <p>موبایل: {form?.phone || "-"}</p>
    </div>
  );
}
