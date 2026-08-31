export default function PrimaryCard({children}) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-xl">
      {children}
    </div>
  );
}
