export default function GoldButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#d4af37] text-black px-7 py-3 rounded-xl font-bold hover:bg-[#f1c94a] transition"
    >
      {children}
    </button>
  );
}
