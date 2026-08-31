export default function BookingSteps({step=1}) {
  const steps=["انتخاب اجرا","اطلاعات کاربر","تایید رزرو"];

  return (
    <div dir="rtl" className="flex gap-3 flex-wrap">
      {steps.map((x,i)=>(
        <div key={x} className={`px-4 py-2 rounded-full ${step===i+1 ? "bg-[#d4af37] text-black":"bg-white/10"}`}>
          {i+1}. {x}
        </div>
      ))}
    </div>
  );
}
