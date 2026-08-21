export default function ErrorState({message}) {
  return (
    <div dir="rtl" className="p-6 rounded-2xl bg-red-500/10">
      {message || "خطایی رخ داده است"}
    </div>
  );
}
