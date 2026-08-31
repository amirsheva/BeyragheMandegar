export default function PerformanceGallery({images=[]}) {
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {images.map((img,i)=>(
        <img key={i} src={img} className="rounded-3xl" />
      ))}
    </div>
  );
}
