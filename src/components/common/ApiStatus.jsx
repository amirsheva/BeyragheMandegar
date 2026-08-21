export default function ApiStatus({status="ready"}) {
  return (
    <div dir="rtl" className="rounded-2xl bg-white/5 border border-white/10 p-4">
      وضعیت API: {status}
    </div>
  );
}
