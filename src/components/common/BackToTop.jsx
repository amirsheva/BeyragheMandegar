import { useEffect, useState } from "react";

export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const fn = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({top:0, behavior:"smooth"})}
      className="fixed bottom-6 left-6 bg-[#d4af37] text-black px-4 py-3 rounded-full z-40"
    >
      ↑
    </button>
  );
}
