export default function RouteGuard({children, condition=true}) {
  if (!condition) {
    return (
      <div dir="rtl" className="p-6 rounded-3xl bg-white/5">
        دسترسی امکان‌پذیر نیست.
      </div>
    );
  }

  return children;
}
