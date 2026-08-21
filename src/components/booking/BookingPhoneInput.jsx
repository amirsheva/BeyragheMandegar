export default function BookingPhoneInput({value,onChange}) {
  return (
    <input
      className="w-full p-3 rounded-xl text-black"
      placeholder="شماره موبایل"
      value={value || ""}
      onChange={e=>onChange?.(e.target.value)}
    />
  );
}
