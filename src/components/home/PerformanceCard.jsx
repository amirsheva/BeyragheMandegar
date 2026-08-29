import {
  Link,
} from "react-router-dom";

import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  LockKeyhole,
  Ticket,
  UsersRound,
} from "lucide-react";

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


export default function PerformanceCard({
  show,
}) {
  const remaining =
    remainingOf(show);

  const bookingEnabled =
    show?.bookingEnabled !==
      false &&
    show?.booking_enabled !==
      false;

  const soldOut =
    remaining <= 0;

  const canBook =
    show?.status ===
      "active" &&
    bookingEnabled &&
    !soldOut;


  let statusText =
    "رزرو فعال";

  let statusClass =
    "is-open";


  if (soldOut) {
    statusText =
      "تکمیل ظرفیت";

    statusClass =
      "is-sold-out";

  } else if (
    !bookingEnabled
  ) {
    statusText =
      "رزرو بسته";

    statusClass =
      "is-closed";
  }


  return (
    <article
      className="home-performance-card"
      dir="rtl"
    >
      <div className="home-performance-card__top">
        <div>
          <div className="home-performance-card__kicker">
            اجرای بیرق ماندگار
          </div>

          <h3>
            {show?.label ||
              "اجرای ویژه"}
          </h3>
        </div>

        <span
          className={`home-performance-status ${statusClass}`}
        >
          {canBook ? (
            <Ticket size={14} />
          ) : (
            <LockKeyhole
              size={14}
            />
          )}

          {statusText}
        </span>
      </div>


      <div className="home-performance-card__meta">
        <div>
          <CalendarDays
            size={17}
          />

          <span>
            {toFaDigits(
              show?.date || "—"
            )}
          </span>
        </div>

        <div>
          <Clock3 size={17} />

          <span>
            ساعت{" "}
            {toFaDigits(
              show?.time || "—"
            )}
          </span>
        </div>
      </div>


      <div className="home-performance-card__capacity">
        <UsersRound size={17} />

        {soldOut ? (
          <span>
            ظرفیت این شب تکمیل شده است
          </span>
        ) : (
          <span>
            {toFaDigits(
              remaining
            )}{" "}
            صندلی باقی مانده
          </span>
        )}
      </div>


      <Link
        to={`/performance/${show.id}`}
        className={
          canBook
            ? "home-performance-card__action is-primary"
            : "home-performance-card__action"
        }
      >
        {canBook
          ? "مشاهده و رزرو"
          : "جزئیات اجرا"}

        <ArrowLeft size={17} />
      </Link>
    </article>
  );
}
