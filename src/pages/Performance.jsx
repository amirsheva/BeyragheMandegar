import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Info,
  LockKeyhole,
  MapPin,
  Navigation,
  Ticket,
  Timer,
  Users,
} from "lucide-react";

import fallbackPoster from "../assets/images/performance-posters/beyragh-mandegar.webp";

import {
  toFaDigits,
} from "../theme/persianDigits";

import "./performance-page.css";


function fa(value) {
  return toFaDigits(
    value ?? ""
  );
}


function hasValue(value) {
  return !(
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  );
}


function buildStatus({
  archived,
  soldOut,
  canBook,
  bookingEnabled,
  remaining,
}) {
  if (archived) {
    return {
      type: "archived",
      label:
        "فروش بلیت پایان یافته",
      description:
        "این اجرا به پایان رسیده و امکان رزرو بلیت برای آن وجود ندارد.",
    };
  }

  if (soldOut) {
    return {
      type: "soldout",
      label:
        "تکمیل ظرفیت",
      description:
        "ظرفیت این شب تکمیل شده است.",
    };
  }

  if (!bookingEnabled) {
    return {
      type: "closed",
      label:
        "رزرو بسته",
      description:
        "رزرو این شب در حال حاضر غیرفعال است.",
    };
  }

  if (canBook && remaining <= 10) {
    return {
      type: "warning",
      label:
        "ظرفیت محدود",
      description:
        `تنها ${fa(remaining)} صندلی برای این شب باقی مانده است.`,
    };
  }

  return {
    type: "active",
    label:
      "رزرو فعال",
    description:
      `${fa(remaining)} صندلی برای این شب باقی مانده است.`,
  };
}


export default function Performance() {
  const {
    id,
  } = useParams();

  const [
    performance,
    setPerformance,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  useEffect(() => {
    const controller =
      new AbortController();

    async function loadPerformance() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/performances/${encodeURIComponent(
              id || ""
            )}/details`,
            {
              signal:
                controller.signal,

              cache:
                "no-store",
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "اطلاعات اجرای موردنظر دریافت نشد."
          );
        }

        setPerformance(
          data?.performance ||
            null
        );

      } catch (err) {
        if (
          err?.name ===
          "AbortError"
        ) {
          return;
        }

        setError(
          err?.message ||
            "دریافت اطلاعات اجرا با مشکل مواجه شد."
        );

      } finally {
        if (
          !controller
            .signal
            .aborted
        ) {
          setLoading(false);
        }
      }
    }

    loadPerformance();

    return () =>
      controller.abort();

  }, [
    id,
  ]);


  const model =
    useMemo(
      () => {
        if (!performance) {
          return null;
        }

        const remaining =
          Number(
            performance
              .remainingCapacity ??
              0
          );

        const totalCapacity =
          Number(
            performance
              .capacity ??
              0
          );

        const archived =
          performance.status ===
          "archived";

        const soldOut =
          !archived &&
          totalCapacity > 0 &&
          remaining <= 0;

        const bookingEnabled =
          performance.status ===
            "active" &&
          performance
            .bookingEnabled ===
            true;

        const canBook =
          bookingEnabled &&
          remaining > 0;

        const status =
          buildStatus({
            archived,
            soldOut,
            canBook,
            bookingEnabled,
            remaining,
          });

        return {
          ...performance,

          remaining,
          totalCapacity,
          archived,
          soldOut,
          canBook,
          bookingEnabled,
          status,
        };
      },
      [
        performance,
      ]
    );


  if (loading) {
    return (
      <main
        dir="rtl"
        className="performance-page"
      >
        <div className="performance-page__state">
          <div className="performance-page__loader" />

          <strong>
            در حال دریافت اطلاعات اجرا
          </strong>

          <span>
            جزئیات این شب از سامانه دریافت می‌شود.
          </span>
        </div>
      </main>
    );
  }


  if (
    error ||
    !model
  ) {
    return (
      <main
        dir="rtl"
        className="performance-page"
      >
        <div className="performance-page__state performance-page__state--error">
          <Info size={34} />

          <h1>
            اجرا در دسترس نیست
          </h1>

          <p>
            {error ||
              "اجرای انتخاب‌شده وجود ندارد یا دیگر در دسترس نیست."}
          </p>

          <Link
            to="/#performances"
            className="performance-page__secondary-button"
          >
            <ArrowRight
              size={18}
            />

            بازگشت به اجراها
          </Link>
        </div>
      </main>
    );
  }


  const productionTitle =
    model.production?.title ||
    "بیرق ماندگار";

  const title =
    model.label ||
    productionTitle;

  const poster =
    model.production?.poster ||
    fallbackPoster;

  const venue =
    model.venue;

  const routeLinks =
    venue
      ? [
          {
            label:
              "گوگل مپ",
            href:
              venue.googleMapsUrl,
          },
          {
            label:
              "نشان",
            href:
              venue.neshanUrl,
          },
          {
            label:
              "بلد",
            href:
              venue.baladUrl,
          },
          {
            label:
              "ویز",
            href:
              venue.wazeUrl,
          },
        ].filter(
          (item) =>
            hasValue(
              item.href
            )
        )
      : [];


  return (
    <main
      dir="rtl"
      className="performance-page"
    >
      <section className="performance-hero">
        <div className="performance-hero__glow" />

        <div className="performance-container performance-hero__grid">

          <div className="performance-poster">
            <img
              src={poster}
              alt={`پوستر ${productionTitle}`}
            />

            <div className="performance-poster__shade" />
          </div>


          <div className="performance-hero__content">

            <Link
              to="/#performances"
              className="performance-page__back"
            >
              <ArrowRight
                size={18}
              />

              بازگشت به شب‌های اجرا
            </Link>


            <div className="performance-page__kicker">
              اجرای «{productionTitle}»
            </div>


            <h1 className="performance-page__title">
              {title}
            </h1>


            {hasValue(
              model.production
                ?.subtitle
            ) && (
              <p className="performance-page__subtitle">
                {
                  model.production
                    .subtitle
                }
              </p>
            )}


            <div className="performance-meta-grid">

              <MetaCard
                icon={
                  CalendarDays
                }
                label="تاریخ اجرا"
                value={fa(
                  model.date
                )}
              />

              <MetaCard
                icon={
                  Clock3
                }
                label="شروع اجرا"
                value={fa(
                  model.time
                )}
              />

              {hasValue(
                model.attendanceTime
              ) && (
                <MetaCard
                  icon={
                    Users
                  }
                  label="زمان حضور"
                  value={fa(
                    model.attendanceTime
                  )}
                />
              )}

              {hasValue(
                model.endTime
              ) && (
                <MetaCard
                  icon={
                    Timer
                  }
                  label="پایان تقریبی"
                  value={fa(
                    model.endTime
                  )}
                />
              )}

            </div>


            <div
              className={
                `performance-status performance-status--${model.status.type}`
              }
            >
              <div className="performance-status__icon">
                {model.canBook ? (
                  <CheckCircle2
                    size={22}
                  />
                ) : (
                  <LockKeyhole
                    size={21}
                  />
                )}
              </div>

              <div>
                <strong>
                  {
                    model.status
                      .label
                  }
                </strong>

                <p>
                  {
                    model.status
                      .description
                  }
                </p>
              </div>
            </div>


            {model.canBook ? (
              <Link
                to={`/booking?performanceId=${model.id}`}
                className="performance-page__primary-button"
              >
                <Ticket
                  size={21}
                />

                رزرو بلیت این شب

                <ArrowLeft
                  size={19}
                />
              </Link>
            ) : (
              <div className="performance-page__disabled-button">
                <LockKeyhole
                  size={19}
                />

                امکان رزرو این شب وجود ندارد
              </div>
            )}

          </div>
        </div>
      </section>


      <section className="performance-section">
        <div className="performance-container performance-details-layout">

          <div className="performance-details-main">

            <SectionHeading
              kicker="اطلاعات اجرا"
              title="جزئیات این شب"
              description="اطلاعات ثبت‌شده برای حضور در این اجرا را پیش از مراجعه بررسی کنید."
            />


            <div className="performance-detail-list">

              <DetailRow
                label="نمایش"
                value={
                  productionTitle
                }
              />

              <DetailRow
                label="شب اجرا"
                value={title}
              />

              <DetailRow
                label="تاریخ"
                value={fa(
                  model.date
                )}
              />

              <DetailRow
                label="ساعت شروع"
                value={fa(
                  model.time
                )}
              />

              {hasValue(
                model.attendanceTime
              ) && (
                <DetailRow
                  label="زمان حضور"
                  value={fa(
                    model.attendanceTime
                  )}
                />
              )}

              {hasValue(
                model.endTime
              ) && (
                <DetailRow
                  label="پایان تقریبی"
                  value={fa(
                    model.endTime
                  )}
                />
              )}

            </div>


            {hasValue(
              model.ticketNote
            ) && (
              <div className="performance-note">
                <Info
                  size={20}
                />

                <div>
                  <strong>
                    نکته مهم بلیت
                  </strong>

                  <p>
                    {
                      model.ticketNote
                    }
                  </p>
                </div>
              </div>
            )}

          </div>


          <aside className="performance-sidebar">

            <div className="performance-capacity-card">
              <Ticket size={24} />

              <span>
                وضعیت رزرو
              </span>

              <strong>
                {
                  model.status
                    .label
                }
              </strong>

              {model.canBook && (
                <>
                  <div className="performance-capacity-card__number">
                    {fa(
                      model.remaining
                    )}
                  </div>

                  <div className="performance-capacity-card__caption">
                    صندلی باقی مانده
                  </div>
                </>
              )}

              {!model.canBook && (
                <p className="performance-capacity-card__message">
                  {
                    model.status
                      .description
                  }
                </p>
              )}

              {model.canBook &&
                model.totalCapacity >
                  0 && (
                  <div className="performance-capacity-card__total">
                    ظرفیت کل این شب:{" "}
                    {fa(
                      model.totalCapacity
                    )}
                  </div>
                )}
            </div>

          </aside>

        </div>
      </section>


      {venue && (
        <section className="performance-section performance-section--venue">
          <div className="performance-container">

            <SectionHeading
              kicker="محل اجرا"
              title={
                venue.name ||
                "محل اجرا"
              }
              description={
                venue.hallName ||
                "اطلاعات محل برگزاری این اجرا"
              }
            />


            <div className="performance-venue-card">

              <div className="performance-venue-card__main">

                <div className="performance-venue-card__icon">
                  <MapPin
                    size={25}
                  />
                </div>

                <div>
                  <h3>
                    {venue.name}
                  </h3>

                  {hasValue(
                    venue.hallName
                  ) && (
                    <div className="performance-venue-card__hall">
                      {
                        venue.hallName
                      }
                    </div>
                  )}

                  {hasValue(
                    venue.address
                  ) && (
                    <p className="performance-venue-card__address">
                      {
                        venue.address
                      }
                    </p>
                  )}
                </div>

              </div>


              {hasValue(
                venue.entranceNote
              ) && (
                <VenueNote
                  title="راهنمای ورود"
                  text={
                    venue.entranceNote
                  }
                />
              )}


              {hasValue(
                venue.accessNote
              ) && (
                <VenueNote
                  title="راهنمای دسترسی"
                  text={
                    venue.accessNote
                  }
                />
              )}


              {routeLinks.length >
                0 && (
                <div className="performance-route-links">
                  {routeLinks.map(
                    (item) => (
                      <a
                        key={
                          item.label
                        }
                        href={
                          item.href
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="performance-route-link"
                      >
                        <Navigation
                          size={17}
                        />

                        {
                          item.label
                        }

                        <ExternalLink
                          size={14}
                        />
                      </a>
                    )
                  )}
                </div>
              )}

            </div>

          </div>
        </section>
      )}


      <section className="performance-bottom-cta">
        <div className="performance-container performance-bottom-cta__inner">

          <div>
            <div className="performance-page__kicker">
              بیرق ماندگار
            </div>

            <h2>
              {model.canBook
                ? "برای حضور در این شب آماده‌اید؟"
                : "اجرای دیگری را انتخاب کنید"}
            </h2>

            <p>
              {model.canBook
                ? "رزرو بلیت را تکمیل کنید و اطلاعات حضور در اجرا را همراه خود داشته باشید."
                : "برای مشاهده وضعیت سایر شب‌های اجرا به فهرست اجراها بازگردید."}
            </p>
          </div>


          <div className="performance-bottom-cta__actions">

            {model.canBook && (
              <Link
                to={`/booking?performanceId=${model.id}`}
                className="performance-page__primary-button performance-page__primary-button--compact"
              >
                <Ticket
                  size={19}
                />

                رزرو بلیت
              </Link>
            )}

            <Link
              to="/#performances"
              className="performance-page__secondary-button"
            >
              مشاهده همه اجراها
            </Link>

          </div>
        </div>
      </section>
    </main>
  );
}


function MetaCard({
  icon: Icon,
  label,
  value,
}) {
  if (!hasValue(value)) {
    return null;
  }

  return (
    <div className="performance-meta-card">
      <Icon
        size={21}
      />

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


function SectionHeading({
  kicker,
  title,
  description,
}) {
  return (
    <div className="performance-section-heading">
      <div className="performance-page__kicker">
        {kicker}
      </div>

      <h2>
        {title}
      </h2>

      {description && (
        <p>
          {description}
        </p>
      )}
    </div>
  );
}


function DetailRow({
  label,
  value,
}) {
  if (!hasValue(value)) {
    return null;
  }

  return (
    <div className="performance-detail-row">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


function VenueNote({
  title,
  text,
}) {
  return (
    <div className="performance-venue-note">
      <Info
        size={18}
      />

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}
