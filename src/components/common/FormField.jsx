export default function FormField({label, ...props}) {
  return (
    <label dir="rtl" className="block space-y-2">
      <span>{label}</span>
      <input
        {...props}
        className="w-full rounded-xl p-3 text-black"
      />
    </label>
  );
}
