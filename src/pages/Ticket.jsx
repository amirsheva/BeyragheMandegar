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
  CalendarDays,
  CheckCircle2,
  Clock3,
  Copy,
  Home,
  MapPin,
  Navigation,
  Ticket as TicketIcon,
  Users,
  XCircle,
} from "lucide-react";


function DetailItem({
  icon,
  title,
  value,
}) {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return null;
  }

  return (
    <div
      className="
        rounded-2xl
        border
        border-white/[0.06]
        bg-white/[0.025]
        p-4
      "
    >
      <div
        className="
          flex
          items-center
          gap-2
          text-[11px]
          text-white/40
        "
      >
        {icon}
        {title}
      </div>

      <div
        className="
          mt-2
          text-sm
          font-black
          text-[#e3d7d0]
        "
      >
        {value}
      </div>
    </div>
  );
}


export default function TicketPage() {
  const {
    trackingCode,
  } = useParams();

  const [
    ticket,
    setTicket,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    copied,
    setCopied,
  ] = useState(false);


  useEffect(() => {
    const controller =
      new AbortController();

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `/api/tickets/${encodeURIComponent(
              trackingCode || ""
            )}`,
            {
              signal:
                controller.signal,

              cache:
                "no-store",
            }
          );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (!response.ok) {
          throw new Error(
            data?.message ||
            "بلیت یافت نشد."
          );
        }

        setTicket(
          data.ticket
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
          "خطا در دریافت بلیت."
        );

      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }

    load();

    return () =>
      controller.abort();

  }, [
    trackingCode,
  ]);


  const navigationUrl =
    useMemo(() => {
      if (!ticket?.venue) {
        return null;
      }

      return (
        ticket.venue.googleMapsUrl ||
        ticket.venue.neshanUrl ||
        ticket.venue.baladUrl ||
        ticket.venue.wazeUrl ||
        null
      );
    }, [
      ticket,
    ]);


  async function copyTrackingCode() {
    if (
      !ticket?.trackingCode
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        ticket.trackingCode
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(false),
        1800
      );

    } catch {
      setCopied(false);
    }
  }


  if (loading) {
    return (
      <main
        dir="rtl"
        className="
          mx-auto
          min-h-[65vh]
          max-w-3xl
          px-5
          py-16
        "
      >
        <div
          className="
            rounded-[28px]
            border
            border-white/[0.06]
            bg-[#0d0b0a]
            p-8
            text-center
            text-sm
            text-white/50
          "
        >
          در حال دریافت اطلاعات بلیت...
        </div>
      </main>
    );
  }


  if (
    error ||
    !ticket
  ) {
    return (
      <main
        dir="rtl"
        className="
          mx-auto
          min-h-[65vh]
          max-w-3xl
          px-5
          py-16
        "
      >
        <div
          className="
            rounded-[28px]
            border
            border-[#5f2925]
            bg-[#160d0c]
            p-8
            text-center
          "
        >
          <XCircle
            size={38}
            className="
              mx-auto
              text-[#c56d62]
            "
          />

          <h1
            className="
              mt-4
              text-xl
              font-black
              text-[#eadbd5]
            "
          >
            بلیت در دسترس نیست
          </h1>

          <p
            className="
              mt-3
              text-sm
              text-white/45
            "
          >
            {error}
          </p>

          <Link
            to="/"
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-white/10
              px-5
              py-2.5
              text-xs
              font-bold
              text-white/70
            "
          >
            <Home size={15} />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </main>
    );
  }


  const confirmed =
    ticket.status ===
    "confirmed";

  const performanceTitle =
    ticket.performance?.label ||
    ticket.production?.title ||
    "بیرق ماندگار";


  return (
    <main
      dir="rtl"
      className="
        mx-auto
        max-w-3xl
        px-4
        py-10
        sm:px-6
        sm:py-16
      "
    >
      <section
        className="
          overflow-hidden
          rounded-[30px]
          border
          border-white/[0.07]
          bg-[#0c0a09]
          shadow-2xl
        "
      >
        <div
          className="
            border-b
            border-white/[0.06]
            bg-[#120c0b]
            px-5
            py-6
            sm:px-7
          "
        >
          <div
            className="
              flex
              flex-wrap
              items-start
              justify-between
              gap-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-[#66362f]
                  bg-[#331713]
                "
              >
                <TicketIcon
                  size={21}
                  className="
                    text-[#d28c80]
                  "
                />
              </div>

              <div>
                <div
                  className="
                    text-[10px]
                    font-black
                    tracking-[0.16em]
                    text-[#9a574d]
                  "
                >
                  BEYRAGH MANDGAR
                </div>

                <h1
                  className="
                    mt-1
                    text-xl
                    font-black
                    text-[#eadfd9]
                  "
                >
                  بلیت بیرق ماندگار
                </h1>
              </div>
            </div>


            <div
              className={`
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                px-3
                py-2
                text-[11px]
                font-black

                ${
                  confirmed
                    ? "border-[#315d48] bg-[#0d1913] text-[#78b991]"
                    : "border-[#6a302a] bg-[#1d0e0c] text-[#d17a6f]"
                }
              `}
            >
              {confirmed
                ? (
                  <CheckCircle2
                    size={14}
                  />
                )
                : (
                  <XCircle
                    size={14}
                  />
                )}

              {confirmed
                ? "بلیت معتبر"
                : "رزرو لغو شده"}
            </div>
          </div>


          {!confirmed && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-[#662d28]
                bg-[#1b0c0a]
                px-4
                py-3
                text-xs
                leading-6
                text-[#d18a80]
              "
            >
              این رزرو لغو شده و در
              وضعیت فعلی برای حضور معتبر
              نیست.
            </div>
          )}
        </div>


        <div
          className="
            px-5
            py-7
            sm:px-7
          "
        >
          <div>
            <div
              className="
                text-[11px]
                text-white/35
              "
            >
              اجرا
            </div>

            <div
              className="
                mt-1
                text-2xl
                font-black
                text-[#e7dad3]
              "
            >
              {performanceTitle}
            </div>

            {ticket.production?.title &&
              ticket.production.title !==
                performanceTitle && (
                <div
                  className="
                    mt-2
                    text-xs
                    text-white/35
                  "
                >
                  {
                    ticket.production
                      .title
                  }
                </div>
              )}
          </div>


          <div
            className="
              mt-7
              grid
              gap-3
              sm:grid-cols-2
            "
          >
            <DetailItem
              icon={
                <CalendarDays
                  size={14}
                />
              }
              title="تاریخ اجرا"
              value={
                ticket.performance
                  ?.date
              }
            />

            <DetailItem
              icon={
                <Clock3
                  size={14}
                />
              }
              title="ساعت حضور"
              value={
                ticket.performance
                  ?.attendanceTime ||
                ticket.performance
                  ?.time
              }
            />

            <DetailItem
              icon={
                <Clock3
                  size={14}
                />
              }
              title="شروع اجرا"
              value={
                ticket.performance
                  ?.time
              }
            />

            <DetailItem
              icon={
                <Users
                  size={14}
                />
              }
              title="تعداد بلیت"
              value={`${ticket.count} نفر`}
            />
          </div>


          {ticket.venue && (
            <div
              className="
                mt-6
                rounded-[22px]
                border
                border-white/[0.06]
                bg-white/[0.02]
                p-5
              "
            >
              <div
                className="
                  flex
                  items-start
                  gap-3
                "
              >
                <MapPin
                  size={18}
                  className="
                    mt-0.5
                    shrink-0
                    text-[#a7655a]
                  "
                />

                <div>
                  <div
                    className="
                      text-sm
                      font-black
                      text-[#ded0c9]
                    "
                  >
                    {
                      ticket.venue.name
                    }
                  </div>

                  {ticket.venue
                    .hallName && (
                    <div
                      className="
                        mt-1
                        text-xs
                        text-white/45
                      "
                    >
                      {
                        ticket.venue
                          .hallName
                      }
                    </div>
                  )}

                  {ticket.venue
                    .address && (
                    <div
                      className="
                        mt-3
                        text-xs
                        leading-6
                        text-white/40
                      "
                    >
                      {
                        ticket.venue
                          .address
                      }
                    </div>
                  )}
                </div>
              </div>

              {navigationUrl && (
                <a
                  href={
                    navigationUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-[#704037]
                    bg-[#351713]
                    px-4
                    py-2.5
                    text-[11px]
                    font-black
                    text-[#d99a8d]
                  "
                >
                  <Navigation
                    size={14}
                  />
                  مسیریابی
                </a>
              )}
            </div>
          )}


          {ticket.performance
            ?.ticketNote && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-[#67532d]
                bg-[#161208]
                px-4
                py-3
                text-xs
                leading-6
                text-[#ba9e5b]
              "
            >
              {
                ticket.performance
                  .ticketNote
              }
            </div>
          )}


          <div
            className="
              mt-7
              rounded-[22px]
              border
              border-dashed
              border-white/10
              bg-black/20
              p-5
              text-center
            "
          >
            <div
              className="
                text-[10px]
                font-bold
                text-white/35
              "
            >
              کد پیگیری
            </div>

            <div
              dir="ltr"
              className="
                mt-2
                break-all
                font-mono
                text-lg
                font-black
                tracking-wider
                text-[#e2b2a8]
                sm:text-xl
              "
            >
              {ticket.trackingCode}
            </div>

            <button
              type="button"
              onClick={
                copyTrackingCode
              }
              className="
                mt-4
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/10
                px-4
                py-2
                text-[11px]
                font-bold
                text-white/55
              "
            >
              <Copy size={13} />

              {copied
                ? "کپی شد"
                : "کپی کد پیگیری"}
            </button>
          </div>


          <div
            className="
              mt-7
              flex
              justify-center
            "
          >
            <Link
              to="/"
              className="
                inline-flex
                items-center
                gap-2
                text-xs
                font-bold
                text-white/45
                transition
                hover:text-white/70
              "
            >
              <Home size={14} />
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
