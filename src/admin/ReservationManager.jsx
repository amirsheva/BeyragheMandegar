
export default function ReservationManager(){
 return (
  <div dir="rtl">
   <h2 className="text-3xl font-bold mb-8">مدیریت رزروها</h2>

   <div className="grid md:grid-cols-3 gap-5">
    <div className="bg-[#171717] p-6 rounded-2xl">
     رزرو امروز
     <strong className="block text-3xl text-[#d4af37] mt-3">0</strong>
    </div>
    <div className="bg-[#171717] p-6 rounded-2xl">
     کل بلیت‌ها
     <strong className="block text-3xl text-[#d4af37] mt-3">0</strong>
    </div>
   </div>
  </div>
 );
}
