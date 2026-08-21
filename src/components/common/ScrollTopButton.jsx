export default function ScrollTopButton() {
  return (
    <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
      بالا
    </button>
  );
}
