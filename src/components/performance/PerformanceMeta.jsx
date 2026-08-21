export default function PerformanceMeta({show}) {
  return (
    <div dir="rtl" className="space-y-3 text-gray-300">
      <p>تاریخ: {show?.date || "-"}</p>
      <p>ساعت: {show?.time || "-"}</p>
      <p>ظرفیت: {show?.capacity || "-"}</p>
    </div>
  );
}
