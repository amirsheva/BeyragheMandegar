import GlassCard from "../common/GlassCard";
import GoldButton from "../common/GoldButton";

export default function ReservationCard({ show, onReserve }) {
  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-bold text-[#d4af37]">
        {show?.title || "اجرای نمایشی"}
      </h3>

      <p className="mt-3 text-gray-300">
        {show?.date || "تاریخ اجرا"}
      </p>

      <p className="text-gray-400">
        ساعت {show?.time || "--:--"}
      </p>

      <div className="mt-6">
        <GoldButton onClick={onReserve}>
          رزرو بلیت
        </GoldButton>
      </div>
    </GlassCard>
  );
}
