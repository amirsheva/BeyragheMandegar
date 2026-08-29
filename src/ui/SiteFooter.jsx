import {
  Link,
} from "react-router-dom";


export default function SiteFooter() {
  return (
    <footer
      className="site-footer"
      dir="rtl"
    >
      <div className="ui-container site-footer__main">

        <section>
          <Link
            to="/"
            className="site-footer__brand"
          >
            <span
              className="site-brand__mark"
              aria-hidden="true"
            />

            <span>
              بیرق ماندگار
            </span>
          </Link>

          <p className="site-footer__description">
            روایت صحنه، هنر و تجربه‌ای که در سال‌های
            اجرا شکل گرفته و با مخاطبان بیرق ماندگار
            ادامه پیدا می‌کند.
          </p>
        </section>


        <section>
          <h2 className="site-footer__heading">
            دسترسی سریع
          </h2>

          <nav
            className="site-footer__links"
            aria-label="دسترسی سریع"
          >
            <Link
              to="/"
              className="site-footer__link"
            >
              صفحه اصلی
            </Link>

            <Link
              to="/#performances"
              className="site-footer__link"
            >
              اجراها
            </Link>

            <Link
              to="/#about"
              className="site-footer__link"
            >
              درباره ما
            </Link>

            <Link
              to="/news"
              className="site-footer__link"
            >
              اخبار
            </Link>

            <Link
              to="/#archive"
              className="site-footer__link"
            >
              آرشیو اجراها
            </Link>
          </nav>
        </section>


        <section>
          <h2 className="site-footer__heading">
            حضور در اجرا
          </h2>

          <p className="site-footer__note">
            زمان حضور، ساعت شروع، محل اجرا و شرایط
            هر شب در صفحه جزئیات همان اجرا نمایش
            داده می‌شود.
          </p>

          <Link
            to="/booking"
            className="site-footer__booking"
          >
            رزرو بلیت
          </Link>
        </section>

      </div>


      <div className="ui-container site-footer__bottom">
        <span>
          بیرق ماندگار
        </span>

        <span>
          تمامی حقوق محفوظ است.
        </span>
      </div>
    </footer>
  );
}