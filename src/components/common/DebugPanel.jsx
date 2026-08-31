export default function DebugPanel({enabled=false, data}) {
  if (!enabled) return null;

  return (
    <pre className="p-4 text-xs bg-black/30 rounded-xl overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
