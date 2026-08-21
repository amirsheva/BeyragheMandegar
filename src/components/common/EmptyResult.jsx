export default function EmptyResult({text="موردی پیدا نشد"}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6 text-center">
      {text}
    </div>
  );
}
