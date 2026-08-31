import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  KeyRound,
  LogOut,
  Phone,
  RefreshCw,
  Ticket,
  UserRound,
} from "lucide-react";


const FA_DIGITS =
  "۰۱۲۳۴۵۶۷۸۹";


function fa(
  value
) {
  return String(
    value ?? ""
  ).replace(
    /\d/g,
    (digit) =>
      FA_DIGITS[
        Number(
          digit
        )
      ]
  );
}


function normalizeDigits(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /[۰-۹]/g,
      (char) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(
            char
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (char) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            char
          )
        )
    );
}


function cleanPhone(
  value
) {
  return normalizeDigits(
    value
  ).replace(
    /\D/g,
    ""
  );
}


function statusMeta(
  status
) {
  if (
    status ===
    "confirmed"
  ) {
    return {
      label:
        "فعال",
      tone:
        "success",
    };
  }

  if (
    status ===
    "cancelled"
  ) {
    return {
      label:
        "لغوشده",
      tone:
        "danger",
    };
  }

  if (
    status ===
    "restored"
  ) {
    return {
      label:
        "دوباره فعال",
      tone:
        "success",
    };
  }

  return {
    label:
      status ||
      "نامشخص",
    tone:
      "muted",
  };
}


function StatusBadge({
  status,
}) {
  const meta =
    statusMeta(
      status
    );

  const styles = {
    success: {
      color:
        "var(--ui-success)",
      borderColor:
        "color-mix(in srgb, var(--ui-success) 35%, transparent)",
      background:
        "color-mix(in srgb, var(--ui-success) 10%, transparent)",
    },

    danger: {
      color:
        "var(--ui-danger)",
      borderColor:
        "color-mix(in srgb, var(--ui-danger) 35%, transparent)",
      background:
        "color-mix(in srgb, var(--ui-danger) 10%, transparent)",
    },

    muted: {
      color:
        "var(--ui-text-muted)",
      borderColor:
        "var(--ui-border-soft)",
      background:
        "var(--ui-surface-2)",
    },
  };

  return (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        border
        px-3
        py-1
        text-[11px]
        font-black
      "
      style={
        styles[
          meta.tone
        ]
      }
    >
      {
        meta.label
      }
    </span>
  );
}


function Field({
  label,
  icon: Icon,
  ...props
}) {
  return (
    <label
      className="
        block
        text-right
      "
    >
      <span
        className="
          mb-2
          block
          text-[12px]
          font-black
        "
        style={{
          color:
            "var(--ui-text-soft)",
        }}
      >
        {label}
      </span>

      <span
        className="
          flex
          items-center
          gap-3
          rounded-[18px]
          border
          px-4
          py-3
        "
        style={{
          borderColor:
            "var(--ui-border-soft)",

          background:
            "var(--ui-surface-2)",
        }}
      >
        <Icon
          size={18}
          style={{
            color:
              "var(--ui-accent)",
          }}
        />

        <input
          {...props}
          className="
            min-w-0
            flex-1
            bg-transparent
            text-right
            text-[15px]
            font-bold
            outline-none
          "
          style={{
            color:
              "var(--ui-text)",
          }}
        />
      </span>
    </label>
  );
}


function ReservationCard({
  item,
}) {
  const title =
    item.production
      ?.title ||
    item.performance
      ?.label ||
    "بیرق ماندگار";

  return (
    <article
      className="
        rounded-[24px]
        border
        p-5
        sm:p-6
      "
      style={{
        borderColor:
          "var(--ui-border-soft)",

        background:
          "var(--ui-surface)",
      }}
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
        <div>
          <div
            className="
              flex
              items-center
              gap-2
              text-[12px]
              font-bold
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            <Ticket
              size={16}
            />

            رزرو
          </div>

          <h2
            className="
              mt-2
              text-[20px]
              font-black
              sm:text-[22px]
            "
            style={{
              color:
                "var(--ui-text)",
            }}
          >
            {title}
          </h2>

          {item.performance
            ?.label &&
          item.performance
            .label !==
            title && (
            <div
              className="
                mt-1
                text-[13px]
                font-bold
              "
              style={{
                color:
                  "var(--ui-text-muted)",
              }}
            >
              {
                item.performance
                  .label
              }
            </div>
          )}
        </div>

        <StatusBadge
          status={
            item.status
          }
        />
      </div>


      <div
        className="
          mt-5
          grid
          gap-3
          sm:grid-cols-3
        "
      >
        <div
          className="
            rounded-[16px]
            border
            p-3
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-bg-elevated)",
          }}
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-[11px]
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            <CalendarDays
              size={14}
            />
            تاریخ اجرا
          </div>

          <div
            className="
              mt-1
              text-[14px]
              font-black
            "
          >
            {fa(
              item.performance
                ?.date ||
              "—"
            )}
          </div>
        </div>


        <div
          className="
            rounded-[16px]
            border
            p-3
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-bg-elevated)",
          }}
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-[11px]
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            <Clock3
              size={14}
            />
            ساعت
          </div>

          <div
            className="
              mt-1
              text-[14px]
              font-black
            "
          >
            {fa(
              item.performance
                ?.time ||
              "—"
            )}
          </div>
        </div>


        <div
          className="
            rounded-[16px]
            border
            p-3
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-bg-elevated)",
          }}
        >
          <div
            className="
              text-[11px]
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            تعداد بلیت
          </div>

          <div
            className="
              mt-1
              text-[14px]
              font-black
            "
          >
            {fa(
              item.count
            )}
          </div>
        </div>
      </div>


      <div
        className="
          mt-4
          flex
          flex-col
          gap-3
          rounded-[18px]
          border
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
        style={{
          borderColor:
            "var(--ui-border-soft)",

          background:
            "var(--ui-bg-elevated)",
        }}
      >
        <div>
          <div
            className="
              text-[11px]
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            کد پیگیری
          </div>

          <div
            dir="ltr"
            lang="en"
            data-keep-latin-digits="true"
            className="
              tracking-code-technical
              mt-1
              font-mono
              text-[13px]
              font-black
            "
            style={{
              color:
                "var(--ui-text)",
            }}
          >
            {
              item.trackingCode
            }
          </div>
        </div>

        <Link
          to={`/ticket/${encodeURIComponent(
            item.trackingCode
          )}`}
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-full
            px-5
            py-2.5
            text-[12px]
            font-black
          "
          style={{
            color:
              "var(--ui-bg)",

            background:
              "var(--ui-accent)",
          }}
        >
          <Ticket
            size={15}
          />
          مشاهده بلیت
        </Link>
      </div>


      {item.venue && (
        <div
          className="
            mt-3
            text-[12px]
          "
          style={{
            color:
              "var(--ui-text-muted)",
          }}
        >
          {item.venue
            .name}

          {item.venue
            .hallName
            ? ` — ${item.venue.hallName}`
            : ""}
        </div>
      )}
    </article>
  );
}


export default function MyReservations() {
  const [
    booting,
    setBooting,
  ] =
    useState(true);

  const [
    authenticated,
    setAuthenticated,
  ] =
    useState(false);

  const [
    reservations,
    setReservations,
  ] =
    useState([]);

  const [
    loadingReservations,
    setLoadingReservations,
  ] =
    useState(false);

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    challengeId,
    setChallengeId,
  ] =
    useState("");

  const [
    otpCode,
    setOtpCode,
  ] =
    useState("");

  const [
    devCode,
    setDevCode,
  ] =
    useState("");

  const [
    resendAfter,
    setResendAfter,
  ] =
    useState(0);

  const [
    requesting,
    setRequesting,
  ] =
    useState(false);

  const [
    verifying,
    setVerifying,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");


  const normalizedPhone =
    useMemo(
      () =>
        cleanPhone(
          phone
        ),
      [
        phone,
      ]
    );


  useEffect(() => {
    if (
      resendAfter <= 0
    ) {
      return undefined;
    }

    const timer =
      window.setInterval(
        () => {
          setResendAfter(
            (current) =>
              Math.max(
                0,
                current -
                1
              )
          );
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );

  }, [
    resendAfter,
  ]);


  useEffect(() => {
    let cancelled =
      false;

    async function boot() {
      try {
        const response =
          await fetch(
            "/api/customer/session",
            {
              cache:
                "no-store",

              credentials:
                "same-origin",
            }
          );

        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        if (
          !cancelled &&
          response.ok &&
          data
            .authenticated
        ) {
          setAuthenticated(
            true
          );
        }

      } catch {
        if (
          !cancelled
        ) {
          setAuthenticated(
            false
          );
        }

      } finally {
        if (
          !cancelled
        ) {
          setBooting(
            false
          );
        }
      }
    }

    boot();

    return () => {
      cancelled =
        true;
    };
  }, []);


  useEffect(() => {
    if (
      authenticated
    ) {
      loadReservations();
    }
  }, [
    authenticated,
  ]);


  async function loadReservations() {
    setLoadingReservations(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/customer/reservations",
          {
            cache:
              "no-store",

            credentials:
              "same-origin",
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        response.status ===
        401
      ) {
        setAuthenticated(
          false
        );

        setReservations(
          []
        );

        return;
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
          "دریافت رزروها انجام نشد."
        );
      }

      setReservations(
        Array.isArray(
          data.reservations
        )
          ? data.reservations
          : []
      );

    } catch (err) {
      setError(
        err?.message ||
        "خطا در دریافت رزروها."
      );

    } finally {
      setLoadingReservations(
        false
      );
    }
  }


  async function requestOtp(
    event
  ) {
    event
      ?.preventDefault();

    if (
      !/^09\d{9}$/.test(
        normalizedPhone
      )
    ) {
      setError(
        "شماره موبایل معتبر وارد کنید."
      );

      return;
    }

    if (
      resendAfter > 0
    ) {
      return;
    }

    setRequesting(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/customer/auth/request",
          {
            method:
              "POST",

            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                phone:
                  normalizedPhone,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok
      ) {
        if (
          Number.isFinite(
            Number(
              data
                .retryAfterSeconds
            )
          )
        ) {
          setResendAfter(
            Number(
              data
                .retryAfterSeconds
            )
          );
        }

        throw new Error(
          data.message ||
          "ارسال کد تأیید انجام نشد."
        );
      }

      setPhone(
        normalizedPhone
      );

      setChallengeId(
        data.challengeId ||
        ""
      );

      setOtpCode(
        ""
      );

      setDevCode(
        data.devCode ||
        ""
      );

      setResendAfter(
        Number(
          data
            .resendAfterSeconds ||
          0
        )
      );

    } catch (err) {
      setError(
        err?.message ||
        "ارسال کد تأیید انجام نشد."
      );

    } finally {
      setRequesting(
        false
      );
    }
  }


  async function verifyOtp(
    event
  ) {
    event
      ?.preventDefault();

    const code =
      normalizeDigits(
        otpCode
      )
        .replace(
          /\D/g,
          ""
        );

    if (
      !challengeId
    ) {
      setError(
        "ابتدا کد تأیید دریافت کنید."
      );

      return;
    }

    if (
      !/^\d{6}$/.test(
        code
      )
    ) {
      setError(
        "کد تأیید ۶ رقمی را وارد کنید."
      );

      return;
    }

    setVerifying(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/customer/auth/verify",
          {
            method:
              "POST",

            credentials:
              "same-origin",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                phone:
                  normalizedPhone,

                challengeId,

                code,
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok
      ) {
        throw new Error(
          data.message ||
          "کد تأیید معتبر نیست."
        );
      }

      setAuthenticated(
        true
      );

      setChallengeId(
        ""
      );

      setOtpCode(
        ""
      );

      setDevCode(
        ""
      );

    } catch (err) {
      setError(
        err?.message ||
        "تأیید شماره موبایل انجام نشد."
      );

    } finally {
      setVerifying(
        false
      );
    }
  }


  async function logout() {
    try {
      await fetch(
        "/api/customer/session",
        {
          method:
            "DELETE",

          credentials:
            "same-origin",
        }
      );
    } catch {}

    setAuthenticated(
      false
    );

    setReservations(
      []
    );

    setPhone(
      ""
    );

    setChallengeId(
      ""
    );

    setOtpCode(
      ""
    );

    setDevCode(
      ""
    );

    setError(
      ""
    );
  }


  function editPhone() {
    setChallengeId(
      ""
    );

    setOtpCode(
      ""
    );

    setDevCode(
      ""
    );

    setResendAfter(
      0
    );

    setError(
      ""
    );
  }


  if (
    booting
  ) {
    return (
      <main
        dir="rtl"
        className="
          mx-auto
          min-h-[65vh]
          max-w-4xl
          px-4
          py-16
          sm:px-6
        "
      >
        <div
          className="
            rounded-[28px]
            border
            p-8
            text-center
            text-sm
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-surface)",

            color:
              "var(--ui-text-muted)",
          }}
        >
          در حال بررسی وضعیت ورود...
        </div>
      </main>
    );
  }


  if (
    !authenticated
  ) {
    return (
      <main
        dir="rtl"
        className="
          mx-auto
          min-h-[70vh]
          max-w-xl
          px-4
          py-12
          sm:px-6
          sm:py-16
        "
      >
        <section
          className="
            rounded-[30px]
            border
            p-6
            shadow-2xl
            sm:p-8
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-surface)",
          }}
        >
          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
              "
              style={{
                borderColor:
                  "var(--ui-border-strong)",

                background:
                  "var(--ui-accent-soft)",
              }}
            >
              <UserRound
                size={23}
                style={{
                  color:
                    "var(--ui-accent)",
                }}
              />
            </div>

            <div>
              <h1
                className="
                  text-[28px]
                  font-black
                  sm:text-[32px]
                "
              >
                رزروهای من
              </h1>

              <p
                className="
                  mt-1
                  text-[13px]
                  leading-7
                "
                style={{
                  color:
                    "var(--ui-text-muted)",
                }}
              >
                با تأیید شماره موبایل، رزروهای ثبت‌شده با همان شماره را مشاهده کنید.
              </p>
            </div>
          </div>


          {!challengeId ? (
            <form
              onSubmit={
                requestOtp
              }
              className="
                mt-7
              "
            >
              <Field
                icon={
                  Phone
                }
                label="شماره موبایل"
                value={
                  phone
                }
                onChange={(
                  event
                ) =>
                  setPhone(
                    event
                      .target
                      .value
                  )
                }
                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                inputMode="numeric"
                autoComplete="tel"
              />

              <button
                type="submit"
                disabled={
                  requesting
                }
                className="
                  mt-5
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  px-6
                  py-3.5
                  text-[14px]
                  font-black
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                style={{
                  color:
                    "var(--ui-bg)",

                  background:
                    "var(--ui-accent)",
                }}
              >
                <KeyRound
                  size={17}
                />

                {requesting
                  ? "در حال ارسال کد..."
                  : "دریافت کد تأیید"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={
                verifyOtp
              }
              className="
                mt-7
              "
            >
              <div
                className="
                  mb-5
                  rounded-[18px]
                  border
                  p-4
                  text-[12px]
                  leading-7
                "
                style={{
                  borderColor:
                    "var(--ui-border-soft)",

                  background:
                    "var(--ui-bg-elevated)",

                  color:
                    "var(--ui-text-muted)",
                }}
              >
                کد ۶ رقمی برای شماره{" "}
                <strong
                  style={{
                    color:
                      "var(--ui-text)",
                  }}
                >
                  {fa(
                    normalizedPhone
                  )}
                </strong>{" "}
                ایجاد شد.
              </div>

              <Field
                icon={
                  KeyRound
                }
                label="کد تأیید"
                value={
                  otpCode
                }
                onChange={(
                  event
                ) =>
                  setOtpCode(
                    normalizeDigits(
                      event
                        .target
                        .value
                    )
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        6
                      )
                  )
                }
                placeholder="۶ رقم"
                inputMode="numeric"
                autoComplete="one-time-code"
              />

              {devCode && (
                <div
                  className="
                    mt-3
                    rounded-[14px]
                    border
                    px-3
                    py-2
                    text-[12px]
                    font-bold
                  "
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--ui-warning) 35%, transparent)",

                    background:
                      "color-mix(in srgb, var(--ui-warning) 10%, transparent)",

                    color:
                      "var(--ui-warning)",
                  }}
                >
                  حالت تست — کد موقت:{" "}
                  <span
                    dir="ltr"
                    lang="en"
                    data-keep-latin-digits="true"
                    className="
                      font-mono
                      font-black
                    "
                  >
                    {devCode}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  verifying
                }
                className="
                  mt-5
                  inline-flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  px-6
                  py-3.5
                  text-[14px]
                  font-black
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                style={{
                  color:
                    "var(--ui-bg)",

                  background:
                    "var(--ui-accent)",
                }}
              >
                <KeyRound
                  size={17}
                />

                {verifying
                  ? "در حال تأیید..."
                  : "ورود به رزروهای من"}
              </button>

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                "
              >
                <button
                  type="button"
                  onClick={
                    editPhone
                  }
                  className="
                    text-[12px]
                    font-black
                  "
                  style={{
                    color:
                      "var(--ui-text-muted)",
                  }}
                >
                  ویرایش شماره
                </button>

                <button
                  type="button"
                  disabled={
                    resendAfter >
                      0 ||
                    requesting
                  }
                  onClick={
                    requestOtp
                  }
                  className="
                    text-[12px]
                    font-black
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                  style={{
                    color:
                      "var(--ui-accent)",
                  }}
                >
                  {resendAfter >
                  0
                    ? `ارسال مجدد تا ${fa(
                        resendAfter
                      )} ثانیه دیگر`
                    : "ارسال مجدد کد"}
                </button>
              </div>
            </form>
          )}


          {error && (
            <div
              className="
                mt-5
                rounded-[16px]
                border
                px-4
                py-3
                text-[13px]
                font-bold
                leading-6
              "
              style={{
                borderColor:
                  "color-mix(in srgb, var(--ui-danger) 35%, transparent)",

                background:
                  "color-mix(in srgb, var(--ui-danger) 10%, transparent)",

                color:
                  "var(--ui-danger)",
              }}
            >
              {error}
            </div>
          )}
        </section>
      </main>
    );
  }


  return (
    <main
      dir="rtl"
      className="
        mx-auto
        min-h-[70vh]
        max-w-5xl
        px-4
        py-10
        sm:px-6
        sm:py-14
      "
    >
      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-end
          sm:justify-between
        "
      >
        <div>
          <div
            className="
              text-[12px]
              font-black
            "
            style={{
              color:
                "var(--ui-accent)",
            }}
          >
            حساب رزرو
          </div>

          <h1
            className="
              mt-1
              text-[30px]
              font-black
              sm:text-[38px]
            "
          >
            رزروهای من
          </h1>

          <p
            className="
              mt-2
              text-[13px]
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            همه رزروهایی که با شماره موبایل تأییدشده ثبت شده‌اند.
          </p>
        </div>


        <div
          className="
            flex
            gap-2
          "
        >
          <button
            type="button"
            onClick={
              loadReservations
            }
            disabled={
              loadingReservations
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              px-4
              py-2.5
              text-[12px]
              font-black
              disabled:opacity-50
            "
            style={{
              borderColor:
                "var(--ui-border-soft)",

              color:
                "var(--ui-text-soft)",
            }}
          >
            <RefreshCw
              size={15}
            />
            بروزرسانی
          </button>

          <button
            type="button"
            onClick={
              logout
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              px-4
              py-2.5
              text-[12px]
              font-black
            "
            style={{
              borderColor:
                "var(--ui-border-soft)",

              color:
                "var(--ui-danger)",
            }}
          >
            <LogOut
              size={15}
            />
            خروج
          </button>
        </div>
      </div>


      {error && (
        <div
          className="
            mt-6
            rounded-[16px]
            border
            px-4
            py-3
            text-[13px]
            font-bold
          "
          style={{
            borderColor:
              "color-mix(in srgb, var(--ui-danger) 35%, transparent)",

            background:
              "color-mix(in srgb, var(--ui-danger) 10%, transparent)",

            color:
              "var(--ui-danger)",
          }}
        >
          {error}
        </div>
      )}


      {loadingReservations ? (
        <div
          className="
            mt-8
            rounded-[24px]
            border
            p-8
            text-center
            text-[13px]
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-surface)",

            color:
              "var(--ui-text-muted)",
          }}
        >
          در حال دریافت رزروها...
        </div>
      ) : reservations.length ===
        0 ? (
        <div
          className="
            mt-8
            rounded-[28px]
            border
            p-8
            text-center
          "
          style={{
            borderColor:
              "var(--ui-border-soft)",

            background:
              "var(--ui-surface)",
          }}
        >
          <Ticket
            size={34}
            className="
              mx-auto
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          />

          <h2
            className="
              mt-4
              text-[20px]
              font-black
            "
          >
            هنوز رزروی با این شماره پیدا نشد
          </h2>

          <p
            className="
              mt-2
              text-[13px]
            "
            style={{
              color:
                "var(--ui-text-muted)",
            }}
          >
            پس از ثبت رزرو، اطلاعات آن در این صفحه نمایش داده می‌شود.
          </p>

          <Link
            to="/booking"
            className="
              mt-5
              inline-flex
              rounded-full
              px-5
              py-2.5
              text-[12px]
              font-black
            "
            style={{
              color:
                "var(--ui-bg)",

              background:
                "var(--ui-accent)",
            }}
          >
            رزرو بلیت
          </Link>
        </div>
      ) : (
        <div
          className="
            mt-8
            grid
            gap-4
          "
        >
          {reservations.map(
            (item) => (
              <ReservationCard
                key={
                  item.id
                }
                item={
                  item
                }
              />
            )
          )}
        </div>
      )}
    </main>
  );
}