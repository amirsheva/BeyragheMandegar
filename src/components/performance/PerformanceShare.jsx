export default function PerformanceShare() {
  function share(){
    navigator.share?.({
      title: "بیرق ماندگار"
    });
  }

  return (
    <button onClick={share} className="px-5 py-2 rounded-xl bg-white/10">
      اشتراک‌گذاری
    </button>
  );
}
