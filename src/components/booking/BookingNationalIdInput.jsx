export default function BookingNationalIdInput({value,onChange}) {
  return (
    <input
      className="w-full p-3 rounded-xl text-black"
      placeholder="کد ملی"
      value={value || ""}
      onChange={e=>onChange?.(e.target.value)}
    />
  );
}
