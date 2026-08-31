import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BrowserQRCodeReader,
} from "@zxing/browser";

import {
  Camera,
  CameraOff,
  CheckCircle2,
  LogIn,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  TicketCheck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";


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
      "خطا در ارتباط با سرور."
    );
  }

  return data;
}


function fa(
  value
) {
  return String(
    value ?? ""
  ).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹"[
        Number(
          digit
        )
      ]
  );
}


function resultTone(
  result
) {
  if (
    result ===
    "admitted"
  ) {
    return {
      icon:
        CheckCircle2,
      title:
        "پذیرش موفق",
      classes:
        "border-[#35604b] bg-[#0c1712] text-[#83c69e]",
    };
  }

  return {
    icon:
      XCircle,
    title:
      "پذیرش انجام نشد",
    classes:
      "border-[#6b302a] bg-[#1a0d0b] text-[#dc8276]",
  };
}


export default function CheckIn() {
  const [
    user,
    setUser,
  ] =
    useState(null);

  const [
    checkingSession,
    setCheckingSession,
  ] =
    useState(true);

  const [
    username,
    setUsername,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    loginBusy,
    setLoginBusy,
  ] =
    useState(false);

  const [
    performances,
    setPerformances,
  ] =
    useState([]);

  const [
    performanceId,
    setPerformanceId,
  ] =
    useState("");

  const [
    stats,
    setStats,
  ] =
    useState({
      total:
        0,
      admitted:
        0,
      remaining:
        0,
    });

  const [
    scannerRunning,
    setScannerRunning,
  ] =
    useState(false);

  const [
    cameraError,
    setCameraError,
  ] =
    useState("");

  const [
    result,
    setResult,
  ] =
    useState(null);

  const [
    recent,
    setRecent,
  ] =
    useState([]);

  const [
    manualCode,
    setManualCode,
  ] =
    useState("");

  const [
    busy,
    setBusy,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");


  const videoRef =
    useRef(null);

  const controlsRef =
    useRef(null);

  const performanceRef =
    useRef("");

  const lastPayloadRef =
    useRef({
      value:
        "",
      at:
        0,
    });


  useEffect(
    () => {
      performanceRef.current =
        performanceId;
    },
    [
      performanceId,
    ]
  );


  async function loadSession() {
    try {
      const data =
        await readJson(
          await fetch(
            "/api/checker/auth/me",
            {
              credentials:
                "include",
            }
          )
        );

      setUser(
        data.user
      );

    } catch {
      setUser(
        null
      );

    } finally {
      setCheckingSession(
        false
      );
    }
  }


  useEffect(
    () => {
      loadSession();

      return () => {
        controlsRef.current
          ?.stop?.();
      };
    },
    []
  );


  async function loadPerformances() {
    const data =
      await readJson(
        await fetch(
          "/api/checker/performances",
          {
            credentials:
              "include",
          }
        )
      );

    const items =
      Array.isArray(
        data.performances
      )
        ? data.performances
        : [];

    setPerformances(
      items
    );

    if (
      items.length > 0 &&
      !performanceRef.current
    ) {
      setPerformanceId(
        String(
          items[0].id
        )
      );

      setStats(
        items[0].stats
      );
    }
  }


  useEffect(
    () => {
      if (!user) {
        return;
      }

      loadPerformances()
        .catch(
          (err) =>
            setError(
              err.message
            )
        );
    },
    [
      user,
    ]
  );


  async function refreshStatus(
    id =
      performanceRef.current
  ) {
    if (!id) {
      return;
    }

    const data =
      await readJson(
        await fetch(
          `/api/checker/performances/${encodeURIComponent(
            id
          )}/status`,
          {
            credentials:
              "include",
          }
        )
      );

    setStats(
      data.stats
    );
  }


  async function login(
    event
  ) {
    event.preventDefault();

    setLoginBusy(
      true
    );

    setError("");

    try {
      const data =
        await readJson(
          await fetch(
            "/api/checker/auth/login",
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
                  username,
                  password,
                }),
            }
          )
        );

      setUser(
        data.user
      );

      setPassword(
        ""
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setLoginBusy(
        false
      );
    }
  }


  async function logout() {
    controlsRef.current
      ?.stop?.();

    setScannerRunning(
      false
    );

    await fetch(
      "/api/checker/auth/logout",
      {
        method:
          "DELETE",

        credentials:
          "include",
      }
    ).catch(
      () => {}
    );

    setUser(
      null
    );

    setPerformances(
      []
    );

    setPerformanceId(
      ""
    );
  }


  async function submitScan(
    payload
  ) {
    const id =
      performanceRef.current;

    if (!id) {
      setError(
        "ابتدا اجرا را انتخاب کنید."
      );

      return;
    }


    const now =
      Date.now();

    if (
      lastPayloadRef
        .current
        .value ===
        payload &&
      now -
        lastPayloadRef
          .current
          .at <
        1800
    ) {
      return;
    }

    lastPayloadRef.current = {
      value:
        payload,
      at:
        now,
    };


    setBusy(
      true
    );

    setError("");

    try {
      const data =
        await readJson(
          await fetch(
            "/api/checker/scan",
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
                  payload,

                  performanceId:
                    Number(
                      id
                    ),
                }),
            }
          )
        );

      setResult(
        data
      );

      setStats(
        data.stats
      );

      setRecent(
        (
          current
        ) => [
          {
            at:
              new Date()
                .toLocaleTimeString(
                  "fa-IR",
                  {
                    hour:
                      "2-digit",
                    minute:
                      "2-digit",
                    second:
                      "2-digit",
                  }
                ),

            result:
              data.result,

            message:
              data.message,

            ticket:
              data.ticket,
          },
          ...current,
        ].slice(
          0,
          8
        )
      );

      if (
        navigator.vibrate
      ) {
        navigator.vibrate(
          data.result ===
          "admitted"
            ? 80
            : [
                80,
                50,
                80,
              ]
        );
      }

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setBusy(
        false
      );
    }
  }


  async function startScanner() {
    if (
      scannerRunning
    ) {
      return;
    }

    if (
      !performanceRef.current
    ) {
      setError(
        "ابتدا اجرا را انتخاب کنید."
      );

      return;
    }

    setCameraError(
      ""
    );

    setError("");

    try {
      const reader =
        new BrowserQRCodeReader();

      const controls =
        await reader
          .decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (
              scanResult
            ) => {
              if (
                scanResult
              ) {
                submitScan(
                  scanResult
                    .getText()
                );
              }
            }
          );

      controlsRef.current =
        controls;

      setScannerRunning(
        true
      );

    } catch (err) {
      setCameraError(
        err?.message ||
        "دسترسی به دوربین ممکن نیست."
      );
    }
  }


  function stopScanner() {
    controlsRef.current
      ?.stop?.();

    controlsRef.current =
      null;

    setScannerRunning(
      false
    );
  }


  async function manualAdmit(
    event
  ) {
    event.preventDefault();

    const id =
      performanceRef.current;

    if (
      !id ||
      !manualCode.trim()
    ) {
      return;
    }

    setBusy(
      true
    );

    setError("");

    try {
      const response =
        await fetch(
          "/api/checker/manual-admit",
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
                trackingCode:
                  manualCode,

                performanceId:
                  Number(
                    id
                  ),
              }),
          }
        );

      const data =
        await readJson(
          response
        );

      setResult(
        data
      );

      setStats(
        data.stats
      );

      setManualCode(
        ""
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setBusy(
        false
      );
    }
  }


  const selectedPerformance =
    useMemo(
      () =>
        performances.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              performanceId
            )
        ) ||
        null,
      [
        performances,
        performanceId,
      ]
    );


  if (
    checkingSession
  ) {
    return (
      <main
        dir="rtl"
        className="
          mx-auto
          min-h-[70vh]
          max-w-xl
          px-4
          py-16
        "
      >
        <div
          className="
            rounded-[28px]
            border
            border-white/[0.07]
            bg-[#0d0b0a]
            p-8
            text-center
            text-sm
            text-white/50
          "
        >
          در حال بررسی دسترسی...
        </div>
      </main>
    );
  }


  if (!user) {
    return (
      <main
        dir="rtl"
        className="
          mx-auto
          min-h-[75vh]
          max-w-md
          px-4
          py-14
        "
      >
        <section
          className="
            rounded-[30px]
            border
            border-[#4b302a]
            bg-[#0d0a09]
            p-6
            shadow-2xl
            sm:p-8
          "
        >
          <div
            className="
              flex h-14 w-14
              items-center
              justify-center
              rounded-2xl
              border
              border-[#6d4037]
              bg-[#27120f]
              text-[#d88677]
            "
          >
            <ShieldCheck
              size={27}
            />
          </div>

          <h1
            className="
              mt-5
              text-2xl
              font-black
              text-[#eee1da]
            "
          >
            کنترل بلیت سالن
          </h1>

          <p
            className="
              mt-2
              text-sm
              leading-7
              text-white/45
            "
          >
            ورود مخصوص مسئولان پذیرش و کنترل QR بلیت
          </p>


          {error && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-[#6b302a]
                bg-[#190d0b]
                px-4
                py-3
                text-sm
                text-[#da8175]
              "
            >
              {error}
            </div>
          )}


          <form
            onSubmit={
              login
            }
            className="
              mt-6
              grid
              gap-4
            "
          >
            <label>
              <span
                className="
                  mb-2
                  block
                  text-xs
                  font-bold
                  text-white/45
                "
              >
                نام کاربری
              </span>

              <input
                value={
                  username
                }
                onChange={
                  (
                    event
                  ) =>
                    setUsername(
                      event
                        .target
                        .value
                    )
                }
                autoComplete="username"
                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/25
                  px-4
                  py-3.5
                  text-sm
                  text-[#eee1da]
                  outline-none
                "
              />
            </label>


            <label>
              <span
                className="
                  mb-2
                  block
                  text-xs
                  font-bold
                  text-white/45
                "
              >
                رمز عبور
              </span>

              <input
                type="password"
                value={
                  password
                }
                onChange={
                  (
                    event
                  ) =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                }
                autoComplete="current-password"
                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/25
                  px-4
                  py-3.5
                  text-sm
                  text-[#eee1da]
                  outline-none
                "
              />
            </label>


            <button
              type="submit"
              disabled={
                loginBusy
              }
              className="
                mt-2
                inline-flex
                min-h-12
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#8b392f]
                px-5
                text-sm
                font-black
                text-[#fff2ed]
                disabled:opacity-50
              "
            >
              <LogIn
                size={18}
              />

              {loginBusy
                ? "در حال ورود..."
                : "ورود به پذیرش"}
            </button>
          </form>
        </section>
      </main>
    );
  }


  return (
    <main
      dir="rtl"
      className="
        mx-auto
        max-w-6xl
        px-4
        py-8
        sm:px-6
      "
    >
      <div
        className="
          flex
          flex-wrap
          items-center
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
              text-xs
              font-black
              text-[#ad6255]
            "
          >
            <TicketCheck
              size={16}
            />
            پذیرش سالن
          </div>

          <h1
            className="
              mt-2
              text-2xl
              font-black
              text-[#eee1da]
              sm:text-3xl
            "
          >
            کنترل QR بلیت
          </h1>

          <div
            className="
              mt-2
              flex
              items-center
              gap-2
              text-xs
              text-white/45
            "
          >
            <UserRoundCheck
              size={15}
            />
            {user.displayName}
          </div>
        </div>


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
            border-white/10
            px-4
            py-2.5
            text-xs
            font-bold
            text-white/60
          "
        >
          <LogOut
            size={15}
          />
          خروج
        </button>
      </div>


      {error && (
        <div
          className="
            mt-5
            rounded-2xl
            border
            border-[#6b302a]
            bg-[#190d0b]
            px-4
            py-3
            text-sm
            text-[#da8175]
          "
        >
          {error}
        </div>
      )}


      <section
        className="
          mt-6
          rounded-[24px]
          border
          border-white/[0.07]
          bg-[#0d0b0a]
          p-4
          sm:p-5
        "
      >
        <label>
          <span
            className="
              mb-2
              block
              text-xs
              font-bold
              text-white/45
            "
          >
            اجرای در حال پذیرش
          </span>

          <select
            value={
              performanceId
            }
            onChange={
              (
                event
              ) => {
                const value =
                  event
                    .target
                    .value;

                setPerformanceId(
                  value
                );

                const item =
                  performances.find(
                    (
                      current
                    ) =>
                      String(
                        current.id
                      ) ===
                      value
                  );

                if (
                  item?.stats
                ) {
                  setStats(
                    item.stats
                  );
                }

                setResult(
                  null
                );
              }
            }
            className="
              w-full
              rounded-2xl
              border
              border-[#51342e]
              bg-[#15100e]
              px-4
              py-3.5
              text-sm
              font-bold
              text-[#e8d9d2]
              outline-none
            "
          >
            {performances.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {[
                    item.label,
                    item.productionTitle,
                    item.date,
                    item.time,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " — "
                    )}
                </option>
              )
            )}
          </select>
        </label>


        {selectedPerformance && (
          <div
            className="
              mt-4
              grid
              grid-cols-3
              gap-2
            "
          >
            <StatCard
              label="کل بلیت"
              value={
                stats.total
              }
            />

            <StatCard
              label="پذیرش شده"
              value={
                stats.admitted
              }
              success
            />

            <StatCard
              label="باقی‌مانده"
              value={
                stats.remaining
              }
            />
          </div>
        )}
      </section>


      <div
        className="
          mt-5
          grid
          gap-5
          lg:grid-cols-[1.2fr_.8fr]
        "
      >
        <section
          className="
            overflow-hidden
            rounded-[26px]
            border
            border-white/[0.07]
            bg-[#0b0908]
          "
        >
          <div
            className="
              relative
              aspect-[4/3]
              min-h-[320px]
              overflow-hidden
              bg-black
            "
          >
            <video
              ref={
                videoRef
              }
              muted
              playsInline
              className="
                h-full
                w-full
                object-cover
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                inset-[15%]
                rounded-[26px]
                border-2
                border-[#d47a69]/80
                shadow-[0_0_0_999px_rgba(0,0,0,.26)]
              "
            />

            {!scannerRunning && (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  bg-[#090807]
                "
              >
                <Camera
                  size={46}
                  className="text-white/25"
                />
              </div>
            )}
          </div>


          <div
            className="
              flex
              flex-wrap
              items-center
              gap-3
              p-4
            "
          >
            {!scannerRunning ? (
              <button
                type="button"
                onClick={
                  startScanner
                }
                className="
                  inline-flex
                  min-h-11
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  bg-[#8c3a30]
                  px-4
                  text-sm
                  font-black
                  text-[#fff2ed]
                "
              >
                <Camera
                  size={18}
                />
                شروع دوربین
              </button>

            ) : (
              <button
                type="button"
                onClick={
                  stopScanner
                }
                className="
                  inline-flex
                  min-h-11
                  flex-1
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border
                  border-white/10
                  px-4
                  text-sm
                  font-black
                  text-white/65
                "
              >
                <CameraOff
                  size={18}
                />
                توقف دوربین
              </button>
            )}


            <button
              type="button"
              onClick={() =>
                refreshStatus()
                  .catch(
                    (
                      err
                    ) =>
                      setError(
                        err.message
                      )
                  )
              }
              className="
                inline-flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                text-white/55
              "
              aria-label="به‌روزرسانی آمار"
            >
              <RefreshCw
                size={17}
              />
            </button>
          </div>


          {cameraError && (
            <div
              className="
                mx-4
                mb-4
                rounded-2xl
                border
                border-[#6b302a]
                bg-[#190d0b]
                px-4
                py-3
                text-xs
                leading-6
                text-[#da8175]
              "
            >
              {cameraError}
            </div>
          )}
        </section>


        <div
          className="
            grid
            content-start
            gap-5
          "
        >
          {result && (
            <ResultCard
              data={
                result
              }
            />
          )}


          <section
            className="
              rounded-[24px]
              border
              border-white/[0.07]
              bg-[#0d0b0a]
              p-5
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-sm
                font-black
                text-[#e8dad3]
              "
            >
              <Search
                size={17}
                className="text-[#ad6255]"
              />
              پذیرش دستی
            </div>

            <p
              className="
                mt-2
                text-xs
                leading-6
                text-white/40
              "
            >
              اگر دوربین یا QR در دسترس نبود، کد پیگیری رزرو را وارد کنید. هر بار یک بلیت استفاده‌نشده پذیرش می‌شود.
            </p>

            <form
              onSubmit={
                manualAdmit
              }
              className="
                mt-4
                grid
                gap-3
              "
            >
              <input
                dir="ltr"
                value={
                  manualCode
                }
                onChange={
                  (
                    event
                  ) =>
                    setManualCode(
                      event
                        .target
                        .value
                        .toUpperCase()
                    )
                }
                placeholder="BM-..."
                data-keep-latin-digits="true"
                className="
                  w-full
                  rounded-2xl
                  border
                  border-white/10
                  bg-black/25
                  px-4
                  py-3
                  font-mono
                  text-sm
                  text-[#e9d8d1]
                  outline-none
                "
              />

              <button
                type="submit"
                disabled={
                  busy ||
                  !manualCode.trim()
                }
                className="
                  min-h-11
                  rounded-2xl
                  border
                  border-[#633a32]
                  bg-[#24120f]
                  text-sm
                  font-black
                  text-[#d88879]
                  disabled:opacity-40
                "
              >
                پذیرش یک بلیت
              </button>
            </form>
          </section>


          {recent.length > 0 && (
            <section
              className="
                rounded-[24px]
                border
                border-white/[0.07]
                bg-[#0d0b0a]
                p-5
              "
            >
              <div
                className="
                  text-sm
                  font-black
                  text-[#e8dad3]
                "
              >
                آخرین بررسی‌ها
              </div>

              <div
                className="
                  mt-3
                  grid
                  gap-2
                "
              >
                {recent.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        index
                      }
                      className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        rounded-xl
                        border
                        border-white/[0.05]
                        px-3
                        py-2.5
                        text-xs
                      "
                    >
                      <span
                        className={
                          item.result ===
                          "admitted"
                            ? "text-[#75b890]"
                            : "text-[#cf766b]"
                        }
                      >
                        {
                          item.message
                        }
                      </span>

                      <span className="text-white/30">
                        {
                          item.at
                        }
                      </span>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}


function StatCard({
  label,
  value,
  success,
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/[0.06]
        bg-black/20
        px-3
        py-3
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
        {label}
      </div>

      <div
        className={`
          mt-1
          text-xl
          font-black
          ${
            success
              ? "text-[#77b991]"
              : "text-[#eadbd4]"
          }
        `}
      >
        {fa(
          value
        )}
      </div>
    </div>
  );
}


function ResultCard({
  data,
}) {
  const tone =
    resultTone(
      data.result
    );

  const Icon =
    tone.icon;

  const ticket =
    data.ticket;


  return (
    <section
      className={`
        rounded-[24px]
        border
        p-5
        ${tone.classes}
      `}
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <Icon
          size={28}
        />

        <div>
          <div
            className="
              text-lg
              font-black
            "
          >
            {tone.title}
          </div>

          <div
            className="
              mt-1
              text-xs
              opacity-80
            "
          >
            {data.message}
          </div>
        </div>
      </div>


      {ticket && (
        <div
          className="
            mt-4
            grid
            gap-2
            rounded-2xl
            border
            border-current/15
            bg-black/10
            p-4
            text-xs
          "
        >
          <div>
            بلیت{" "}
            <strong>
              {fa(
                ticket.ordinal
              )}
            </strong>
            {" "}از{" "}
            <strong>
              {fa(
                ticket.reservationCount
              )}
            </strong>
          </div>

          {ticket.holderName && (
            <div>
              نام رزروکننده:{" "}
              <strong>
                {ticket.holderName}
              </strong>
            </div>
          )}

          <div>
            اجرا:{" "}
            <strong>
              {
                ticket
                  .performance
                  ?.label ||
                ticket
                  .performance
                  ?.productionTitle ||
                "—"
              }
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}