export default function Modal({open, children}) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"><div className="bg-[#181818] rounded-3xl p-6">{children}</div></div>;
}
