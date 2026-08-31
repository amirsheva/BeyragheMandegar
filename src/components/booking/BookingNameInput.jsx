export default function BookingNameInput({value,onChange}) {
  return (
    <input
      className="w-full p-3 rounded-xl text-black"
      placeholder="نام"
      value={value || ""}
      onChange={e=>onChange?.(e.target.value)}
    />
  );
}
