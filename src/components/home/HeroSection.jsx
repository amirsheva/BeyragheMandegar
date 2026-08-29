import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Ticket,
} from "lucide-react";

import heroImage from "../../assets/images/hero-beyragh-fatemeh-azra.webp";

import {
  toFaDigits,
} from "../../theme/persianDigits";


function remainingOf(show) {
  return Number(
    show?.remainingCapacity ??
    show?.remaining_capacity ??
    show?.capacity ??
    0
  );
}


function isBookable(show) {
  return (
    show?.status === "active" &&
    show?.bookingEnabled !== false &&
    show?.booking_enabled !== false &&
    remainingOf(show) > 0
  );
}


export default function HeroSection() {
  const [
    shows,
    setShows,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    const controller =
      new AbortController();

    fetch(
      "/api/shows",
      {
        signal:
          controller.signal,
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error();
        }

        return response.json();
      })
      .then((data) => {
        setShows(
          Array.isArray(data)
            ? data
            : []
        );
      })
      .catch((error) => {
        if (
          error?.name !==
          "AbortError"
        ) {
          setShows([]);
        }
      })
      .finally(() => {
        if (
          !controller
            .signal
            .aborted
        ) {
          setLoading(false);
        }
      });

    return () =>
      controller.abort();
  }, []);


  const bookable =
    useMemo(
      () =>
        shows
          .filter(
            isBookable
          )
          .sort(
            (a, b) =>
              `${a.date || ""} ${a.time || ""}`
                .localeCompare(
                  `${b.date || ""} ${b.time || ""}`
                )
          ),
      [shows]
    );


  const next =
    bookable[0] ||
    null;


  return (
    <section
      className="home-hero"
      dir="rtl"
    >
      <div className="home-hero__media">
        <img
          src={heroImage}
          alt="نمایش بیرق ماندگار"
        />
      </div>

      <div className="home-hero__veil" />
      <div className="home-hero__bottom-fade" />

      <div className="home-container home-hero__inner">
        <div className="home-hero__content">

          <div className="home-hero__brand">
            <span>
              بیرق ماندگار
            </span>

            <span className="home-hero__brand-line" />
          </div>

          <h1>
            روایتی که
            <br />
            ماندگار می‌شود
          </h1>

          <p className="home-hero__lead">
            تجربه‌ای از هنر نمایش، روایت و احساس؛
            روی صحنه‌ای که قصه‌هایش با مخاطب ادامه پیدا می‌کند.
          </p>


          <div className="home-hero__availability">
            {loading ? (
              <div className="home-hero__availability-loading">
                در حال بررسی اجراهای قابل رزرو...
              </div>
            ) : next ? (
              <>
                <div className="home-hero__availability-top">
                  <Ticket size={18} />

                  <strong>
                    رزرو{" "}
                    {toFaDigits(
                      bookable.length
                    )}{" "}
                    شب فعال است
                  </strong>
                </div>

                <div className="home-hero__next">
                  <span>
                    {next.label}
                  </span>

                  <span>
                    <CalendarDays
                      size={15}
                    />

                    {toFaDigits(
                      next.date
                    )}
                  </span>

                  <span>
                    <Clock3
                      size={15}
                    />

                    ساعت{" "}
                    {toFaDigits(
                      next.time
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className="home-hero__availability-loading">
                در حال حاضر رزرو فعالی وجود ندارد.
              </div>
            )}
          </div>


          <div className="home-hero__actions">
            {next ? (
              <Link
                to="/booking"
                className="home-button home-button--primary"
              >
                <Ticket size={19} />

                رزرو بلیت

                <ArrowLeft size={18} />
              </Link>
            ) : null}

            <Link
              to="/#archive"
              className="home-button home-button--ghost"
            >
              مشاهده آرشیو اجراها
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
