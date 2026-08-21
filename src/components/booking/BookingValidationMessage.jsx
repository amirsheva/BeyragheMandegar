export default function BookingValidationMessage({message}) {
  if (!message) return null;
  return <div dir="rtl" className="rounded-2xl bg-yellow-500/10 p-4">{message}</div>;
}
