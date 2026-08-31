export default function Timeline() {
  const items = [
    "شروع تولید",
    "تمرین گروه",
    "اولین اجرا"
  ];

  return (
    <div dir="rtl" className="space-y-4 px-6 py-20">
      {items.map((x,i)=>(
        <div key={x} className="bg-white/5 rounded-2xl p-5">
          مرحله {i+1}: {x}
        </div>
      ))}
    </div>
  );
}
