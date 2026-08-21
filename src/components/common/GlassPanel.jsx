export default function GlassPanel({children}) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur p-6">
      {children}
    </div>
  );
}
