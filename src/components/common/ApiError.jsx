export default function ApiError({message}) {
  if (!message) return null;

  return (
    <div dir="rtl" className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
      {message}
    </div>
  );
}
