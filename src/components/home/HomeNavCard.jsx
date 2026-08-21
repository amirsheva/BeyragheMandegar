export default function HomeNavCard({title,href}) {
  return (
    <a href={href || "#"} className="rounded-3xl bg-white/5 p-5 block">
      {title || "بخش"}
    </a>
  );
}
