export default function HomeFooterInfo({text}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      {text || "اطلاعات تکمیلی"}
    </div>
  );
}
