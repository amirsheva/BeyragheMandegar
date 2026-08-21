
import useShows from "./hooks/useShows";

export default function ShowManager(){

 const shows = useShows();

 return (
  <div dir="rtl">
   <div className="flex justify-between mb-8">
    <h2 className="text-3xl font-bold">
     مدیریت نمایش‌ها
    </h2>

    <button className="bg-[#d4af37] text-black px-5 py-3 rounded-xl">
     نمایش جدید
    </button>
   </div>

   <div className="space-y-4">
    {shows.map(show=>(
     <div
      key={show.id}
      className="bg-[#171717] border border-white/10 rounded-2xl p-6"
     >
      <h3 className="text-xl font-bold">
       {show.title}
      </h3>

      <p className="text-white/60 mt-2">
       {show.director}
      </p>
     </div>
    ))}
   </div>
  </div>
 );
}
