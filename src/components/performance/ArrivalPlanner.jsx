import {
  useState,
} from "react";

import {
  Navigation,
  MapPin,
  Clock3,
  Route,
  LocateFixed,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";


function fa(value) {
  return String(
    value ?? ""
  ).replace(
    /\d/g,
    (d) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(d)
      ]
  );
}


function formatDistance(
  meters
) {
  const value =
    Number(meters || 0);

  if (value < 1000) {
    return `${fa(
      Math.round(value)
    )} متر`;
  }

  return `${fa(
    (
      value / 1000
    ).toFixed(1)
  )} کیلومتر`;
}


function formatDuration(
  seconds
) {
  const minutes =
    Math.max(
      1,
      Math.ceil(
        Number(seconds || 0) /
          60
      )
    );

  if (minutes < 60) {
    return `${fa(
      minutes
    )} دقیقه`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const rest =
    minutes % 60;

  return rest
    ? `${fa(
        hours
      )} ساعت و ${fa(
        rest
      )} دقیقه`
    : `${fa(
        hours
      )} ساعت`;
}


function calculateLeaveTime(
  attendanceTime,
  durationSeconds
) {
  if (
    !attendanceTime ||
    !durationSeconds
  ) {
    return null;
  }

  const [
    hour,
    minute,
  ] = attendanceTime
    .split(":")
    .map(Number);


  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }


  /*
   * حاشیه اطمینان برای:
   * پارک، ورود، پیدا کردن سالن و...
   */
  const bufferMinutes = 15;

  const routeMinutes =
    Math.ceil(
      durationSeconds /
        60
    );


  let total =
    hour * 60 +
    minute -
    routeMinutes -
    bufferMinutes;


  while (total < 0) {
    total +=
      24 * 60;
  }


  const leaveHour =
    Math.floor(
      total / 60
    );

  const leaveMinute =
    total % 60;


  return (
    String(
      leaveHour
    ).padStart(2, "0") +
    ":" +
    String(
      leaveMinute
    ).padStart(2, "0")
  );
}


export default function ArrivalPlanner({
  performance,
}) {
  const venue =
    performance?.venue;

  const [
    state,
    setState,
  ] = useState("idle");

  const [
    estimate,
    setEstimate,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");


  if (
    !venue ||
    performance?.status ===
      "archived"
  ) {
    return null;
  }


  const navigationUrl =
    venue.google_maps_url ||
    venue.neshan_url ||
    null;


  const hasCoordinates =
    Number.isFinite(
      Number(
        venue.latitude
      )
    ) &&
    Number.isFinite(
      Number(
        venue.longitude
      )
    );


  async function calculate() {
    setError("");
    setEstimate(null);


    if (!hasCoordinates) {
      setError(
        "موقعیت دقیق این محل هنوز برای محاسبه مسیر ثبت نشده است."
      );

      return;
    }


    if (
      !navigator.geolocation
    ) {
      setError(
        "مرورگر شما امکان دریافت موقعیت فعلی را ندارد."
      );

      return;
    }


    setState(
      "locating"
    );


    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setState(
            "calculating"
          );


          const response =
            await fetch(
              "/api/navigation/estimate",
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    origin: {
                      latitude:
                        position
                          .coords
                          .latitude,

                      longitude:
                        position
                          .coords
                          .longitude,
                    },

                    destination: {
                      latitude:
                        Number(
                          venue.latitude
                        ),

                      longitude:
                        Number(
                          venue.longitude
                        ),
                    },
                  }),
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
              data.message ||
                "محاسبه مسیر انجام نشد."
            );
          }


          setEstimate(
            data
          );

          setState(
            "done"
          );

        } catch (err) {
          setState(
            "error"
          );

          setError(
            err.message
          );
        }
      },

      (geoError) => {
        setState(
          "error"
        );


        if (
          geoError.code ===
          geoError.PERMISSION_DENIED
        ) {
          setError(
            "برای محاسبه مسیر، دسترسی به موقعیت فعلی را اجازه دهید."
          );

          return;
        }


        setError(
          "موقعیت فعلی شما دریافت نشد."
        );
      },

      {
        enableHighAccuracy:
          false,

        timeout:
          10000,

        maximumAge:
          120000,
      }
    );
  }


  const leaveTime =
    estimate
      ? calculateLeaveTime(
          performance
            .attendance_time,

          estimate
            .durationSeconds
        )
      : null;


  return (
    <section
      dir="rtl"
      className="
        mt-6
        overflow-hidden
        rounded-[28px]
        border
        border-[#50362f]
        bg-gradient-to-br
        from-[#130d0b]
        to-[#090807]
      "
    >
      <div
        className="
          p-6
          sm:p-8
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            md:flex-row
            md:items-start
            md:justify-between
          "
        >
          <div>
            <div
              className="
                flex
                items-center
                gap-2
                text-[11px]
                font-black
                text-[#b46255]
              "
            >
              <Navigation
                size={16}
              />

              برنامه رسیدن به اجرا
            </div>


            <h2
              className="
                mt-2
                text-[22px]
                font-black
                text-[#eaded6]
              "
            >
              به‌موقع برس
            </h2>


            <p
              className="
                mt-2
                max-w-2xl
                text-[12px]
                leading-7
                text-[#81766f]
              "
            >
              مسیر را از موقعیت فعلی
              شما تا محل اجرا محاسبه
              می‌کنیم تا زمان حرکت را
              بهتر برنامه‌ریزی کنید.
            </p>
          </div>


          <div
            className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-white/[0.06]
              bg-black/20
              px-3
              py-2
              text-[10px]
              font-bold
              text-[#756b65]
            "
          >
            <ShieldCheck
              size={13}
            />

            موقعیت شما ذخیره نمی‌شود
          </div>
        </div>


        <div
          className="
            mt-6
            flex
            items-start
            gap-3
            rounded-[18px]
            border
            border-white/[0.055]
            bg-black/20
            p-4
          "
        >
          <MapPin
            size={18}
            className="
              mt-1
              shrink-0
              text-[#ad6053]
            "
          />

          <div>
            <div
              className="
                text-[10px]
                font-black
                text-[#716762]
              "
            >
              مقصد
            </div>

            <div
              className="
                mt-1
                text-[14px]
                font-black
                text-[#cdbdb4]
              "
            >
              {venue.name}
            </div>

            {venue.hall_name && (
              <div
                className="
                  mt-1
                  text-[11px]
                  text-[#82766f]
                "
              >
                {
                  venue.hall_name
                }
              </div>
            )}
          </div>
        </div>


        {estimate && (
          <div
            className="
              mt-4
              grid
              gap-3
              sm:grid-cols-3
            "
          >
            <Metric
              icon={Route}
              label="مسافت مسیر"
              value={
                formatDistance(
                  estimate
                    .distanceMeters
                )
              }
            />

            <Metric
              icon={Clock3}
              label="زمان تقریبی مسیر"
              value={
                formatDuration(
                  estimate
                    .durationSeconds
                )
              }
            />

            <Metric
              icon={Navigation}
              label="پیشنهاد حرکت"
              value={
                leaveTime
                  ? `حداکثر ${fa(
                      leaveTime
                    )}`
                  : "پس از اعلام ساعت حضور"
              }
              accent
            />
          </div>
        )}


        {estimate &&
          performance
            .attendance_time && (
            <div
              className="
                mt-4
                text-[10px]
                leading-6
                text-[#716762]
              "
            >
              زمان پیشنهادی حرکت با
              درنظرگرفتن حدود ۱۵ دقیقه
              حاشیه برای پارک، ورود و
              پیدا کردن سالن محاسبه شده
              است.
            </div>
          )}


        {error && (
          <div
            className="
              mt-4
              rounded-[14px]
              border
              border-[#663b35]
              bg-[#1e0f0d]
              px-4
              py-3
              text-[11px]
              font-bold
              leading-6
              text-[#d18175]
            "
          >
            {error}
          </div>
        )}


        <div
          className="
            mt-6
            flex
            flex-wrap
            gap-3
          "
        >
          <button
            type="button"
            disabled={
              state ===
                "locating" ||
              state ===
                "calculating"
            }
            onClick={
              calculate
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#935448]
              bg-[#65261f]
              px-5
              py-3
              text-[12px]
              font-black
              text-[#f0dfd7]
              disabled:opacity-50
            "
          >
            <LocateFixed
              size={17}
            />

            {state ===
              "locating"
              ? "دریافت موقعیت..."
              : state ===
                  "calculating"
                ? "محاسبه مسیر..."
                : estimate
                  ? "محاسبه دوباره"
                  : "محاسبه مسیر من"}
          </button>


          {navigationUrl && (
            <a
              href={
                navigationUrl
              }
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/[0.08]
                px-5
                py-3
                text-[12px]
                font-black
                text-[#a99a92]
              "
            >
              <Navigation
                size={16}
              />

              شروع مسیریابی

              <ExternalLink
                size={12}
              />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}


function Metric({
  icon: Icon,
  label,
  value,
  accent,
}) {
  return (
    <div
      className="
        rounded-[18px]
        border
        border-white/[0.055]
        bg-[#090807]
        p-4
      "
    >
      <Icon
        size={17}
        className={
          accent
            ? "text-[#c36d5e]"
            : "text-[#8f554b]"
        }
      />

      <div
        className="
          mt-3
          text-[10px]
          font-black
          text-[#6d645f]
        "
      >
        {label}
      </div>

      <div
        className="
          mt-1
          text-[14px]
          font-black
          text-[#d2c3ba]
        "
      >
        {value}
      </div>
    </div>
  );
}
