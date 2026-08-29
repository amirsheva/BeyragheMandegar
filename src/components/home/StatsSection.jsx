const items = [
  {
    value:
      "۵۰+",
    title:
      "اجرا",
    description:
      "روی صحنه در دوره‌های مختلف",
  },
  {
    value:
      "۱۰٬۰۰۰+",
    title:
      "مخاطب",
    description:
      "همراه بیرق ماندگار در سال‌های اجرا",
  },
  {
    value:
      "۲۲",
    title:
      "سال اجرا",
    description:
      "بیش از دو دهه استمرار روی صحنه",
  },
];


export default function StatsSection() {
  return (
    <section
      className="home-stats"
      dir="rtl"
      aria-label="آمار بیرق ماندگار"
    >
      <div className="home-container home-stats__grid">
        {items.map(
          (item) => (
            <article
              key={item.title}
              className="home-stat-card"
            >
              <div className="home-stat-card__value">
                {item.value}
              </div>

              <div className="home-stat-card__title">
                {item.title}
              </div>

              <p>
                {item.description}
              </p>
            </article>
          )
        )}
      </div>
    </section>
  );
}
