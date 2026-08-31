export default function AboutSection() {
  return (
    <section
      id="about"
      dir="rtl"
      className="home-section home-about"
    >
      <div className="home-container home-about__grid">

        <div className="home-about__copy">
          <div className="home-section-kicker">
            درباره بیرق ماندگار
          </div>

          <h2>
            روایت‌هایی برای
            <span>
              {" "}
              ماندگار شدن
            </span>
          </h2>

          <p>
            بیرق ماندگار با تکیه بر هنر نمایش،
            داستان‌گویی و ارتباط نزدیک با مخاطب
            شکل گرفته است. هر اجرا تلاشی است برای
            تبدیل یک روایت تاریخی و فرهنگی به
            تجربه‌ای زنده روی صحنه؛ تجربه‌ای که
            با پایان نمایش تمام نمی‌شود.
          </p>
        </div>


        <div className="home-about__manifesto">
          <span className="home-about__symbol">
            ✦
          </span>

          <h3>
            هنر، روایت، احساس
          </h3>

          <p>
            صحنه برای ما فقط محل اجرا نیست؛
            جایی است برای ساختن تجربه‌ای که در
            حافظه مخاطب باقی بماند.
          </p>
        </div>

      </div>
    </section>
  );
}
