export default function PageShell({children}) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#111] text-white">
      {children}
    </div>
  );
}
