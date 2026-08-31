export default function BookingCountInput({value,onChange}) {
  return (
    <input
      type="number"
      min="1"
      className="w-full p-3 rounded-xl text-black"
      placeholder="تعداد"
      value={value || 1}
      onChange={e=>onChange?.(e.target.value)}
    />
  );
}
