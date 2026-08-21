export default function Toast({message,type="success"}) {
  if (!message) return null;
  return (
    <div dir="rtl" className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl ${
      type==="error" ? "bg-red-600" : "bg-emerald-600"
    } text-white shadow-xl`}>
      {message}
    </div>
  );
}
