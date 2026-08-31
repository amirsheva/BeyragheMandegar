export default function PerformanceActors({actors=[]}) {
  return (
    <div dir="rtl">
      {actors.join("، ") || "-"}
    </div>
  );
}
