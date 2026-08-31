export default function SystemStatus() {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6 border border-white/10">
      <h3 className="font-bold text-[#d4af37]">وضعیت سیستم</h3>
      <p className="mt-3 text-gray-300">Frontend: OK</p>
      <p className="text-gray-300">API: Ready</p>
      <p className="text-gray-300">Database: Connected</p>
    </div>
  );
}
