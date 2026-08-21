import GoldButton from "../components/common/GoldButton";

export default function Performance() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#111] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black text-[#d4af37]">
          جزئیات اجرا
        </h1>

        <div className="mt-8 bg-white/5 rounded-3xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold">
            بیرق ماندگار
          </h2>

          <p className="mt-4 text-gray-300 leading-8">
            اطلاعات کامل اجرا، زمان، مکان و ظرفیت در این بخش نمایش داده می‌شود.
          </p>

          <div className="mt-8">
            <GoldButton>
              رزرو بلیت
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}
