import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  Ticket,
} from "lucide-react";


export default function HomeFooterCTA() {
  return (
    <section
      dir="rtl"
      className="home-final-cta"
    >
      <div className="home-container">
        <div className="home-final-cta__card">

          <div className="home-section-kicker">
            بیرق ماندگار
          </div>

          <h2>
            برای شب بعدی اجرا آماده‌اید؟
          </h2>

          <p>
            وضعیت شب‌های قابل رزرو را ببینید و
            بلیت خود را مستقیماً از سایت ثبت کنید.
          </p>

          <div className="home-final-cta__actions">
            <Link
              to="/booking"
              className="home-button home-button--primary"
            >
              <Ticket size={19} />

              رزرو بلیت

              <ArrowLeft size={18} />
            </Link>

            <Link
              to="/news"
              className="home-button home-button--ghost"
            >
              اخبار بیرق ماندگار
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
