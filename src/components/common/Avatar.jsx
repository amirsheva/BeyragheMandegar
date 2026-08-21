export default function Avatar({src, name}) {
  return (
    <div dir="rtl" className="flex items-center gap-3">
      {src ? <img src={src} className="w-12 h-12 rounded-full" /> :
      <div className="w-12 h-12 rounded-full bg-[#d4af37]/20 flex items-center justify-center">{name?.[0]}</div>}
      <span>{name}</span>
    </div>
  );
}
