export default function ReleaseChecklist() {
  const items = [
    "Build production",
    "Routes verified",
    "Booking flow verified",
    "API verified",
    "Responsive checked"
  ];

  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      {items.map((item, i) => (
        <div key={i} className="py-2">✓ {item}</div>
      ))}
    </div>
  );
}
