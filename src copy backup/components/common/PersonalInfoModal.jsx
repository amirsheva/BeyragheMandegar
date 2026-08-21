export default function PersonalInfoModal({ open, onClose, onNext }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" dir="rtl">
      <div className="bg-[#181818] p-6 rounded-3xl border border-white/10">
        <h2 className="text-xl text-[#d4af37] mb-4">اطلاعات رزرو</h2>
        <button onClick={onNext} className="bg-[#d4af37] text-black px-5 py-2 rounded-xl">
          ادامه
        </button>
        <button onClick={onClose} className="mr-3 text-white">
          بستن
        </button>
      </div>
    </div>
  );
}
