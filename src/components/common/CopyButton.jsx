export default function CopyButton({text}) {
  return (
    <button onClick={()=>navigator.clipboard.writeText(text)}
      className="px-4 py-2 rounded-xl bg-white/10">
      کپی
    </button>
  );
}
