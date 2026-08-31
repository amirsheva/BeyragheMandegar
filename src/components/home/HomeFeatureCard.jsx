export default function HomeFeatureCard({title, text}) {
  return (
    <div dir="rtl" className="rounded-3xl bg-white/5 p-6">
      <h3 className="font-bold text-[#d4af37]">{title}</h3>
      <p>{text}</p>
    </div>
  );
}
