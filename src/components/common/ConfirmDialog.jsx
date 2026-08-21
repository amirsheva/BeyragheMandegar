export default function ConfirmDialog({open, children, onConfirm}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6" dir="rtl">
      <div className="bg-[#181818] rounded-3xl p-6 border border-white/10">
        {children}
        <button
          onClick={onConfirm}
          className="mt-5 bg-[#d4af37] text-black px-5 py-2 rounded-xl"
        >
          تایید
        </button>
      </div>
    </div>
  );
}
