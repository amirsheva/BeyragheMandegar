export default function EnvironmentBadge({env="production"}) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/10">
      {env}
    </span>
  );
}
