export default function DirectionLinks() {
  return (
    <div className="card">
      <p>برای پیدا کردن مسیر سالن نمایش، می‌توانید از یکی از اپلیکیشن‌های زیر استفاده کنید:</p>

      <div className="flex flex-wrap gap-4 items-center mt-4">
        <a
          className="btn btn-primary"
          href="https://www.google.com/maps"
          target="_blank"
          rel="noreferrer"
        >
          Google Maps
        </a>

        <a
          className="btn btn-primary"
          href="https://neshan.org/maps/routing/car/destination/35.688297,51.459129/poi_hash/0b2d07c7def55a5c9520157209514d3b#c35.688-51.459-19z-0p"
          target="_blank"
          rel="noreferrer"
        >
          Neshan
        </a>

        <a
          className="btn btn-primary"
          href="https://www.waze.com"
          target="_blank"
          rel="noreferrer"
        >
          Waze
        </a>
      </div>

      <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
        برای دسترسی سریع به نقشه و هدایت به سالن، روی یکی از گزینه‌ها کلیک کنید.
      </p>
    </div>
  );
}
