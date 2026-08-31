export default function HomeAnnouncement({text}) {
  if (!text) return null;
  return (
    <div dir="rtl" className="rounded-2xl bg-[#d4af37]/10 p-4">
      {text}
    </div>
  );
}
