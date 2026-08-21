
import {useState} from "react";

export default function PerformanceForm({onSubmit}){

 const [form,setForm]=useState({
  venue:"",
  date:"",
  time:"",
  capacity:0,
  price:0
 });

 function change(key,value){
  setForm({...form,[key]:value});
 }

 return (
  <div dir="rtl" className="space-y-4">

   {[
    ["venue","سالن"],
    ["date","تاریخ"],
    ["time","ساعت"],
    ["capacity","ظرفیت"],
    ["price","قیمت"]
   ].map(([key,label])=>(
    <input
     key={key}
     className="w-full bg-[#171717] p-4 rounded-xl"
     placeholder={label}
     value={form[key]}
     onChange={e=>change(key,e.target.value)}
    />
   ))}

   <button
    onClick={()=>onSubmit?.(form)}
    className="bg-[#d4af37] text-black px-6 py-3 rounded-xl"
   >
    ذخیره اجرا
   </button>

  </div>
 );
}
