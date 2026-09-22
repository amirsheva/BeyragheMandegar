import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./break-glass-pii.css";


const REASONS = [
  {
    value:
      "security-incident",
    label:
      "رخداد امنیتی",
  },
  {
    value:
      "identity-verification",
    label:
      "احراز هویت مخاطب",
  },
  {
    value:
      "legal-request",
    label:
      "درخواست قانونی",
  },
  {
    value:
      "support-escalation",
    label:
      "پیگیری پشتیبانی حساس",
  },
  {
    value:
      "other",
    label:
      "سایر موارد ضروری",
  },
];


async function readJson(
  response
) {
  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data.message ||
      "خطا در ارتباط با سرور"
    );
  }

  return data;
}


export default function BreakGlassPii() {
  const [status, setStatus] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [reasonCode, setReasonCode] =
    useState(
      "security-incident"
    );

  const [grant, setGrant] =
    useState("");

  const [expiresAt, setExpiresAt] =
    useState("");

  const [reservationId, setReservationId] =
    useState("");

  const [confirmed, setConfirmed] =
    useState(false);

  const [revealed, setRevealed] =
    useState(null);

  const hideTimerRef =
    useRef(null);


  function clearReveal() {
    setRevealed(null);

    if (
      hideTimerRef.current
    ) {
      clearTimeout(
        hideTimerRef.current
      );

      hideTimerRef.current =
        null;
    }
  }


  useEffect(
    () => {
      let active = true;

      async function loadStatus() {
        try {
          const data =
            await readJson(
              await fetch(
                "/api/auth/break-glass/status",
                {
                  credentials:
                    "include",
                  cache:
                    "no-store",
                }
              )
            );

          if (active) {
            setStatus(data);
          }

        } catch (err) {
          if (active) {
            setError(
              err.message
            );
          }

        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadStatus();

      return () => {
        active = false;

        if (
          hideTimerRef.current
        ) {
          clearTimeout(
            hideTimerRef.current
          );
        }
      };
    },
    []
  );


  async function unlock(
    event
  ) {
    event.preventDefault();

    setBusy(true);
    setError("");
    clearReveal();

    try {
      const data =
        await readJson(
          await fetch(
            "/api/auth/break-glass/unlock",
            {
              method:
                "POST",
              credentials:
                "include",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body:
                JSON.stringify({
                  password,
                  reasonCode,
                }),
            }
          )
        );

      setGrant(
        data.grant ||
        ""
      );

      setExpiresAt(
        data.expiresAt ||
        ""
      );

      setPassword("");
      setConfirmed(false);

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setBusy(false);
    }
  }


  async function reveal(
    event
  ) {
    event.preventDefault();

    if (
      !grant ||
      !confirmed ||
      !reservationId
    ) {
      return;
    }

    setBusy(true);
    setError("");
    clearReveal();

    try {
      const data =
        await readJson(
          await fetch(
            `/api/auth/break-glass/reveal/${encodeURIComponent(
              reservationId
            )}`,
            {
              method:
                "POST",
              credentials:
                "include",
              cache:
                "no-store",
              headers: {
                "Content-Type":
                  "application/json",
                "X-Break-Glass-Grant":
                  grant,
              },
              body:
                JSON.stringify({
                  confirm:
                    "REVEAL",
                }),
            }
          )
        );

      setRevealed(data);
      setConfirmed(false);

      hideTimerRef.current =
        setTimeout(
          () => {
            setRevealed(null);
          },
          60_000
        );

      if (
        Number(
          data.remainingReveals
        ) <= 0
      ) {
        setGrant("");
        setExpiresAt("");
      }

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setBusy(false);
    }
  }


  async function lock() {
    const currentGrant =
      grant;

    setGrant("");
    setExpiresAt("");
    setConfirmed(false);
    clearReveal();

    if (!currentGrant) {
      return;
    }

    try {
      await fetch(
        "/api/auth/break-glass/lock",
        {
          method:
            "POST",
          credentials:
            "include",
          headers: {
            "X-Break-Glass-Grant":
              currentGrant,
          },
        }
      );
    } catch {
      // Local grant is already cleared.
    }
  }


  if (loading) {
    return (
      <div
        dir="rtl"
        className="break-glass-page"
      >
        در حال بررسی دسترسی امن...
      </div>
    );
  }


  if (
    !status?.enabled
  ) {
    return (
      <div
        dir="rtl"
        className="break-glass-page"
      >
        <section className="break-glass-card">
          <span className="break-glass-kicker">
            Security
          </span>

          <h1>
            دسترسی اضطراری اطلاعات حساس
          </h1>

          <p>
            این قابلیت برای حساب فعلی فعال نیست.
          </p>

          {error && (
            <div className="break-glass-error">
              {error}
            </div>
          )}
        </section>
      </div>
    );
  }


  return (
    <div
      dir="rtl"
      className="break-glass-page"
    >
      <section className="break-glass-card">
        <span className="break-glass-kicker">
          Break Glass
        </span>

        <h1>
          مشاهده اضطراری اطلاعات حساس
        </h1>

        <p className="break-glass-lead">
          شماره موبایل و کد ملی در حالت عادی Mask باقی می‌مانند. هر مشاهده در Audit ثبت می‌شود و این نشست کوتاه‌مدت است.
        </p>

        {error && (
          <div className="break-glass-error">
            {error}
          </div>
        )}

        {!grant ? (
          <form
            className="break-glass-form"
            onSubmit={unlock}
          >
            <label>
              <span>
                دلیل دسترسی
              </span>

              <select
                value={reasonCode}
                onChange={
                  (event) =>
                    setReasonCode(
                      event.target.value
                    )
                }
              >
                {REASONS.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span>
                رمز مستقل دسترسی اضطراری
              </span>

              <input
                type="password"
                autoComplete="off"
                value={password}
                onChange={
                  (event) =>
                    setPassword(
                      event.target.value
                    )
                }
                required
              />
            </label>

            <button
              type="submit"
              disabled={
                busy ||
                !password
              }
            >
              {busy
                ? "در حال بررسی..."
                : "باز کردن دسترسی اضطراری"}
            </button>
          </form>
        ) : (
          <>
            <div className="break-glass-active">
              <div>
                <strong>
                  نشست اضطراری فعال است
                </strong>

                <span>
                  اعتبار تا: {expiresAt || "—"}
                </span>
              </div>

              <button
                type="button"
                className="break-glass-secondary"
                onClick={lock}
              >
                قفل فوری
              </button>
            </div>

            <form
              className="break-glass-form"
              onSubmit={reveal}
            >
              <label>
                <span>
                  شناسه رزرو
                </span>

                <input
                  inputMode="numeric"
                  value={reservationId}
                  onChange={
                    (event) =>
                      setReservationId(
                        event.target.value
                      )
                  }
                  placeholder="مثلاً 6"
                  required
                />
              </label>

              <label className="break-glass-confirm">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={
                    (event) =>
                      setConfirmed(
                        event.target.checked
                      )
                  }
                />

                <span>
                  تأیید می‌کنم مشاهده اطلاعات خام این رزرو ضروری است.
                </span>
              </label>

              <button
                type="submit"
                disabled={
                  busy ||
                  !confirmed ||
                  !reservationId
                }
              >
                {busy
                  ? "در حال دریافت..."
                  : "نمایش اطلاعات خام"}
              </button>
            </form>
          </>
        )}

        {revealed && (
          <section className="break-glass-result">
            <div className="break-glass-result__header">
              <strong>
                اطلاعات رزرو #{revealed.reservationId}
              </strong>

              <button
                type="button"
                onClick={clearReveal}
              >
                پاک‌کردن از صفحه
              </button>
            </div>

            <div className="break-glass-values">
              <div>
                <span>
                  شماره موبایل
                </span>

                <bdi>
                  {revealed.phone || "—"}
                </bdi>
              </div>

              <div>
                <span>
                  کد ملی
                </span>

                <bdi>
                  {revealed.nationalId || "—"}
                </bdi>
              </div>
            </div>

            <small>
              این اطلاعات حداکثر ۶۰ ثانیه روی صفحه باقی می‌مانند. تعداد مشاهده باقی‌مانده در این نشست: {revealed.remainingReveals ?? "—"}
            </small>
          </section>
        )}
      </section>
    </div>
  );
}
