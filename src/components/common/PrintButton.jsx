export default function PrintButton() {
  return <button onClick={()=>window.print()} className="px-4 py-2 rounded-xl bg-white/10">چاپ</button>;
}
