import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  CalendarDays,
  Clock3,
  Ticket,
  Phone,
  KeyRound,
  Minus,
  Plus,
  ArrowLeft,
  CircleCheck,
} from "lucide-react";


const FA_DIGITS =
  "۰۱۲۳۴۵۶۷۸۹";


function fa(value) {
  return String(
    value ?? ""
  ).replace(
    /\d/g,
    (digit) =>
      FA_DIGITS[
        Number(digit)
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


function isShowBookable(
  show
) {
  if (!show) {
    return false;
  }

  const available =
    Number(
      show.remainingCapacity ??
        show.remaining_capacity ??
        show.capacity ??
        0
    );

  return (
    available > 0 &&
    show.bookingEnabled !==
      false &&
    show.booking_enabled !==
      false &&
    show.status ===
      "active"
  );
}


const MAX_TICKETS_PER_RESERVATION = 5;


export default function Booking() {
  const [
    searchParams,
  ] = useSearchParams();


  const initialId =
    searchParams.get(
      "performanceId"
    );


  const [
    shows,
    setShows,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    selectedId,
    setSelectedId,
  ] = useState(
    initialId || ""
  );


  const [
    count,
    setCount,
  ] = useState(1);


  const [
    phone,
    setPhone,
  ] = useState("");


  const [
    otpModalOpen,
    setOtpModalOpen,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    result,
    setResult,
  ] = useState(null);


  const [
    otpChallengeId,
    setOtpChallengeId,
  ] = useState("");


  const [
    otpPhone,
    setOtpPhone,
  ] = useState("");


  const [
    otpCode,
    setOtpCode,
  ] = useState("");


  const [
    otpRequesting,
    setOtpRequesting,
  ] = useState(false);


  const [
    otpVerifying,
    setOtpVerifying,
  ] = useState(false);


  const [
    verificationToken,
    setVerificationToken,
  ] = useState("");


  const [
    verifiedPhone,
    setVerifiedPhone,
  ] = useState("");


  const [
    resendAfter,
    setResendAfter,
  ] = useState(0);


  const [
    devOtpCode,
    setDevOtpCode,
  ] = useState("");


  const bookingStageRef =
    useRef(null);



  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior:
        "instant",
    });


    fetch(
      "/api/shows"
    )
      .then(
        (
          response
        ) =>
          response.json()
      )
      .then(
        (data) => {
          const activeShows =
            Array.isArray(
              data
            )
              ? data.filter(
                  (show) =>
                    show.status ===
                    "active"
                )
              : [];


          setShows(
            activeShows
          );
        }
      )
      .finally(
        () => {
          setLoading(false);
        }
      );
  }, []);


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
                current - 1
              )
          );
        },
        1000
      );


    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    resendAfter,
  ]);




  const selected =
    useMemo(
      () =>
        shows.find(
          (
            show
          ) =>
            String(
              show.id
            ) ===
            String(
              selectedId
            )
        ),
      [
        shows,
        selectedId,
      ]
    );


  const remaining =
    Number(
      selected
        ?.remainingCapacity ??
        selected
          ?.remaining_capacity ??
        selected
          ?.capacity ??
        0
    );


  function selectShow(
    show
  ) {
    const available =
      Number(
        show.remainingCapacity ??
          show.remaining_capacity ??
          show.capacity ??
          0
      );


    const closed =
      show.bookingEnabled ===
        false ||
      show.booking_enabled ===
        false ||
      show.status !==
        "active" ||
      available <= 0;


    if (closed) {
      return;
    }


    setSelectedId(
      String(show.id)
    );

    setCount(1);
    setError("");
  }


  function nextFromStepOne() {
    if (
      !selected
    ) {
      setError(
        "ابتدا یکی از شب‌های قابل رزرو را انتخاب کنید."
      );

      return;
    }


    if (
      count < 1 ||
      count >
        Math.min(
          remaining,
          MAX_TICKETS_PER_RESERVATION
        )
    ) {
      setError(
        "تعداد بلیت انتخاب‌شده معتبر نیست."
      );

      return;
    }


    setError("");
    setOtpModalOpen(true);
  }


  function validatePhone() {
    const cleanPhone =
      normalizeDigits(
        phone
      )
        .replace(
          /\D/g,
          ""
        );


    if (
      !/^09\d{9}$/.test(
        cleanPhone
      )
    ) {
      setError(
        "شماره موبایل معتبر وارد کنید."
      );

      return null;
    }


    setPhone(
      cleanPhone
    );


    return {
      phone: cleanPhone,
    };
  }


  async function requestOtp(
    phone
  ) {
    setOtpRequesting(true);
    setError("");


    try {
      const response =
        await fetch(
          "/api/otp/request",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                phone,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {
        if (
          Number.isFinite(
            Number(
              data
                ?.retryAfterSeconds
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


        setError(
          data.message ||
          "ارسال کد تأیید انجام نشد."
        );

        return false;
      }


      setOtpChallengeId(
        data.challengeId ||
        ""
      );

      setOtpPhone(
        phone
      );

      setOtpCode("");

      setVerificationToken("");

      setVerifiedPhone("");

      setDevOtpCode(
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


      return true;

    } catch {
      setError(
        "ارتباط با سرویس ارسال کد تأیید برقرار نشد."
      );

      return false;

    } finally {
      setOtpRequesting(
        false
      );
    }
  }


  async function verifyOtp(
    phone
  ) {
    const code =
      normalizeDigits(
        otpCode
      )
        .replace(
          /\D/g,
          ""
        );


    if (
      !/^\d{6}$/.test(
        code
      )
    ) {
      setError(
        "کد تأیید ۶ رقمی را وارد کنید."
      );

      return false;
    }


    setOtpVerifying(true);
    setError("");


    try {
      const response =
        await fetch(
          "/api/otp/verify",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                challengeId:
                  otpChallengeId,

                code,
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {
        setError(
          data.message ||
          "کد تأیید معتبر نیست."
        );

        return false;
      }


      setVerificationToken(
        data.verificationToken ||
        ""
      );

      setVerifiedPhone(
        phone
      );

      setOtpCode(
        code
      );

      setError("");


      return true;

    } catch {
      setError(
        "ارتباط با سرویس تأیید شماره موبایل برقرار نشد."
      );

      return false;

    } finally {
      setOtpVerifying(
        false
      );
    }
  }


  async function handleSendCode() {
    const validated =
      validatePhone();


    if (!validated) {
      return;
    }


    const {
      phone:
        cleanPhone,
    } =
      validated;


    const alreadyVerified =
      Boolean(
        verificationToken
      ) &&
      verifiedPhone ===
        cleanPhone;


    if (
      alreadyVerified
    ) {
      setError("");

      await submitReservation();

      return;
    }


    const challengeMatches =
      Boolean(
        otpChallengeId
      ) &&
      otpPhone ===
        cleanPhone;


    if (
      challengeMatches
    ) {
      return;
    }


    await requestOtp(
      cleanPhone
    );
  }


  async function handleVerifyCode() {
    const validated =
      validatePhone();


    if (!validated) {
      return;
    }


    const {
      phone:
        cleanPhone,
    } =
      validated;


    const challengeMatches =
      Boolean(
        otpChallengeId
      ) &&
      otpPhone ===
        cleanPhone;


    if (
      !challengeMatches
    ) {
      setError(
        "برای این شماره موبایل کد تأیید فعالی وجود ندارد. دوباره کد دریافت کنید."
      );

      setOtpChallengeId(
        ""
      );

      setOtpPhone(
        ""
      );

      return;
    }


    const verified =
      await verifyOtp(
        cleanPhone
      );


    if (
      verified
    ) {
      await submitReservation();
    }
  }


  function changePhoneNumber() {
    setOtpChallengeId(
      ""
    );

    setOtpPhone(
      ""
    );

    setOtpCode(
      ""
    );

    setVerificationToken(
      ""
    );

    setVerifiedPhone(
      ""
    );

    setError("");
  }


  async function resendOtp() {
    const validated =
      validatePhone();


    if (
      !validated ||
      resendAfter > 0
    ) {
      return;
    }


    await requestOtp(
      validated.phone
    );
  }


  async function submitReservation() {
    if (
      !selected
    ) {
      return;
    }


    setSubmitting(true);
    setError("");


    try {
      const response =
        await fetch(
          "/api/reservations",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  "",

                phone:
                  normalizeDigits(
                    phone
                  ),

                nationalId:
                  "",

                count,

                verificationToken,

                showtime: {
                  showtimeId:
                    selected.id,
                },
              }),
          }
        );


      const data =
        await response.json();


      if (
        !response.ok
      ) {
        setError(
          data.message ||
            "ثبت رزرو انجام نشد."
        );


        if (
          String(
            data.code ||
            ""
          ).startsWith(
            "OTP_"
          )
        ) {
          setVerificationToken(
            ""
          );

          setVerifiedPhone(
            ""
          );

          setOtpChallengeId(
            ""
          );

          setOtpPhone(
            ""
          );

          setOtpCode(
            ""
          );

          setOtpModalOpen(
            true
          );
        }


        return;
      }


      setOtpModalOpen(
        false
      );

      setResult(
        data
      );

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

    } catch {
      setError(
        "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
      );

    } finally {
      setSubmitting(
        false
      );
    }
  }


  if (result) {
    return (
      <main
        dir="rtl"
        className="
          min-h-screen
          bg-[#070707]
          px-4 py-20
          sm:px-6
        "
      >
        <div
          className="
            mx-auto
            max-w-xl
            rounded-[30px]
            border
            border-[#315a40]
            bg-[#0b100d]
            p-8
            text-center
            shadow-[0_30px_80px_rgba(0,0,0,.45)]
          "
        >
          <CircleCheck
            size={54}
            strokeWidth={1.5}
            className="
              mx-auto
              text-[#6fb687]
            "
          />

          <h1
            className="
              mt-5
              text-[30px]
              font-black
              text-[#eff4f0]
            "
          >
            رزرو با موفقیت ثبت شد
          </h1>


          {/* <p
            className="
              mt-3
              leading-7
              text-[#98a49c]
            "
          >
            اطلاعات رزرو شما ثبت شد. کد پیگیری را برای مراجعات بعدی نگه دارید.
          </p> */}


          {/* <div
            className="
              mt-7
              rounded-[20px]
              border
              border-white/[0.07]
              bg-black/20
              p-5
            "
          > */}
            {/* <div
              className="
                text-[12px]
                text-[#78827b]
              "
            >
              کد پیگیری
            </div>

            <div
              dir="ltr"
              lang="en"
              data-keep-latin-digits="true"
              className="
                tracking-code-technical
                mt-2
                text-[21px]
                font-black
                tracking-wide
                text-[#e7eee9]
              "
            >
              {result.trackingCode}
            </div>
          </div> */}


          <div
            className="
              mt-7
              flex
              flex-col
              items-center
              justify-center
              gap-3
              sm:flex-row
            "
          >
            <Link
              to={`/ticket/${encodeURIComponent(
                result.trackingCode
              )}`}
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#477057]
                bg-[#15311f]
                px-6 py-3
                font-black
                text-[#dce7df]
                transition
                hover:border-[#6a9a78]
                hover:bg-[#1b3b27]
              "
            >
              <Ticket
                size={18}
              />

              مشاهده بلیت
            </Link>

            <Link
              to="/"
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#476951]
                px-6 py-3
                font-black
                text-[#dce7df]
              "
            >
              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main
      dir="rtl"
      className="
        booking-page
        min-h-screen
        bg-[#070707]
        px-4
        py-6
        text-[#efe5dd]
        sm:px-6
        lg:py-8
      "
    >
      <div
        className="
          mx-auto
          max-w-[1100px]
        "
      >



                <h1
          className="
            mt-1
            text-center
            text-[36px]
            font-black
            leading-[1.35]
            text-[#f2e7df]
            md:text-[48px]
          "
        >
          تکمیل رزرو
        </h1>


                <p
          className="
            mx-auto
            mt-2
            max-w-2xl
            text-center
            text-[14px]
            leading-7
            text-[#91867f]
          "
        >
          شب اجرا و تعداد بلیت را انتخاب کنید؛ با تأیید کد پیامکی، رزرو شما فوراً ثبت می‌شود.
        </p>





        <div
          className="
            mt-8
            grid
            gap-6
            lg:grid-cols-[1fr_340px]
          "
        >
          <section
            ref={
              bookingStageRef
            }
            className="
              scroll-mt-24
              rounded-[28px]
              border
              border-[#4d3530]
              bg-[#0b0909]
              p-5
              sm:p-7
            "
          >
            <StepOne
              shows={
                shows
              }
              loading={
                loading
              }
              selectedId={
                selectedId
              }
              onSelect={
                selectShow
              }

              selected={
                selected
              }
              count={
                count
              }
              setCount={
                setCount
              }
              remaining={
                remaining
              }
              lockedToPreselection={
                Boolean(
                  initialId
                )
              }
              onNext={
                nextFromStepOne
              }
            />


            {error && (
              <div
                className="
                  mt-5
                  rounded-[16px]
                  border
                  border-[#793d39]
                  bg-[#2a1110]
                  px-4 py-3
                  text-[14px]
                  font-bold
                  leading-6
                  text-[#ef8e86]
                "
              >
                {error}
              </div>
            )}
          </section>


          <div
            className="
              hidden
              lg:block
            "
          >
            <BookingSummary
              selected={
                selected
              }
              count={
                count
              }
              setCount={
                setCount
              }
              editable
            />
          </div>
        </div>
      </div>


      {otpModalOpen && (
        <OtpModal
          phone={
            phone
          }
          setPhone={
            setPhone
          }
          codeSent={
            Boolean(
              otpChallengeId
            ) &&
            otpPhone ===
              phone
          }
          otpCode={
            otpCode
          }
          setOtpCode={
            setOtpCode
          }
          otpRequesting={
            otpRequesting
          }
          otpVerifying={
            otpVerifying
          }
          submitting={
            submitting
          }
          resendAfter={
            resendAfter
          }
          devOtpCode={
            devOtpCode
          }
          onResend={
            resendOtp
          }
          onSendCode={
            handleSendCode
          }
          onVerifyCode={
            handleVerifyCode
          }
          onChangePhone={
            changePhoneNumber
          }
          onClose={() =>
            setOtpModalOpen(
              false
            )
          }
        />
      )}
    </main>
  );
}

function StepOne({
  shows,
  loading,
  selectedId,
  onSelect,
  selected,
  count,
  setCount,
  remaining,
  lockedToPreselection,
  onNext,
}) {
  const mobileSummaryRef =
    useRef(null);

  const transitionTimerRef =
    useRef(null);

  const reduceMotion =
    useReducedMotion();

  const [
    mobileSummaryId,
    setMobileSummaryId,
  ] = useState(
    () =>
      String(
        selectedId || ""
      )
  );

  useEffect(
    () => () => {
      if (
        transitionTimerRef.current
      ) {
        window.clearTimeout(
          transitionTimerRef.current
        );
      }
    },
    []
  );

  function handleSelect(
    show
  ) {
    onSelect(show);

    const isMobile =
      typeof window !==
        "undefined" &&
      window.matchMedia(
        "(max-width: 639px)"
      ).matches;

    if (!isMobile) {
      return;
    }

    const nextId =
      String(show.id);

    /*
     * Give the selected card a very short
     * tactile/visual confirmation before
     * revealing the details below.
     */
    setMobileSummaryId("");

    if (
      transitionTimerRef.current
    ) {
      window.clearTimeout(
        transitionTimerRef.current
      );
    }

    transitionTimerRef.current =
      window.setTimeout(
        () => {
          setMobileSummaryId(
            nextId
          );

          window.requestAnimationFrame(
            () => {
              window.requestAnimationFrame(
                () => {
                  mobileSummaryRef
                    .current
                    ?.scrollIntoView({
                      behavior:
                        reduceMotion
                          ? "auto"
                          : "smooth",
                      block:
                        "start",
                    });
                }
              );
            }
          );
        },
        reduceMotion
          ? 0
          : 140
      );
  }

  if (
    lockedToPreselection &&
    (loading ||
      isShowBookable(
        selected
      ))
  ) {
    return (
      <>
        <SectionTitle
          icon={
            Ticket
          }
          title="تعداد بلیت"
          description="شب اجرا از صفحه قبل انتخاب شده است؛ فقط تعداد بلیت را مشخص کنید."
        />

        {loading ? (
          <div
            className="
              py-16
              text-center
              text-[#887d76]
            "
          >
            در حال دریافت اطلاعات اجرا...
          </div>
        ) : (
          <div
            className="
              mt-6
            "
          >
            <BookingSummary
              selected={
                selected
              }
              count={
                count
              }
              setCount={
                setCount
              }
              editable
            />
          </div>
        )}

        <PrimaryButton
          onClick={
            onNext
          }
        >
          ادامه و تأیید شماره موبایل
        </PrimaryButton>
      </>
    );
  }

  return (
    <>
      <SectionTitle
        icon={
          Ticket
        }
        title="انتخاب شب اجرا"
        description="شب موردنظر را انتخاب کنید."
      />

      {lockedToPreselection && (
        <div
          className="
            mt-4
            rounded-[14px]
            border
            border-[#6b5730]
            bg-[#201907]
            px-4 py-3
            text-[13px]
            font-bold
            text-[#d4b75b]
          "
        >
          اجرای انتخاب‌شده دیگر قابل رزرو نیست؛ شب دیگری را انتخاب کنید.
        </div>
      )}


      {loading ? (
        <div
          className="
            py-16
            text-center
            text-[#887d76]
          "
        >
          در حال دریافت اجراها...
        </div>
      ) : (
        <div
          className="
            mt-6 grid
            gap-3
            sm:grid-cols-2
          "
        >
          {shows.map(
            (
              show
            ) => {
              const available =
                Number(
                  show.remainingCapacity ??
                    show.remaining_capacity ??
                    show.capacity ??
                    0
                );


              const disabled =
                available <=
                  0 ||
                show.bookingEnabled ===
                  false ||
                show.booking_enabled ===
                  false ||
                show.status !==
                  "active";


              const selected =
                String(
                  selectedId
                ) ===
                String(
                  show.id
                );


              return (
                <button
                  key={
                    show.id
                  }
                  type="button"
                  disabled={
                    disabled
                  }
                  onClick={() =>
                    handleSelect(
                      show
                    )
                  }
                  className={`
                    rounded-[20px]
                    border
                    p-4
                    text-right
                    transition
                    duration-150
                    active:scale-[0.985]
                    sm:active:scale-100

                    ${
                      selected
                        ? "border-[#a35c50] bg-[#251310]"
                        : "border-white/[0.06] bg-white/[0.018] hover:border-[#5d3c35]"
                    }

                    ${
                      disabled
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }
                  `}
                >
                  <div
                    className="
                      text-[17px]
                      font-black
                      text-[#e8ddd5]
                    "
                  >
                    {show.label ||
                      "اجرای ویژه"}
                  </div>

                  <div
                    className="
                      mt-2
                      flex
                      flex-wrap
                      gap-x-3 gap-y-1
                      text-[12px]
                      text-[#92867f]
                    "
                  >
                    <span>
                      {fa(
                        show.date
                      )}
                    </span>

                    <span>
                       ساعت شروع{" "}
                      {fa(
                        show.time
                      )}
                    </span>

                    {show.attendanceTime && (
                      <span>
                        ساعت حضور{" "}
                        {fa(
                          show.attendanceTime
                        )}
                      </span>
                    )}
                  </div>

                  <div
                    className="
                      mt-3
                      text-[12px]
                      font-bold
                    "
                  >
                    {disabled
                      ? "غیرقابل رزرو"
                      : "قابل رزرو"}
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}


      {/* BOOKING_MOBILE_STEP1_SUMMARY */}
      {selected && (
        <>
          {mobileSummaryId ===
            String(
              selected.id
            ) && (
            <motion.div
              key={`mobile-booking-summary-${selected.id}`}
              ref={
                mobileSummaryRef
              }
              initial={
                reduceMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 34,
                      scale: 0.985,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              transition={
                reduceMotion
                  ? {
                      duration: 0,
                    }
                  : {
                      duration: 0.4,
                      ease: [
                        0.22,
                        1,
                        0.36,
                        1,
                      ],
                    }
              }
              className="
                mt-6
                scroll-mt-24
                sm:hidden
              "
            >
              <BookingSummary
                selected={
                  selected
                }
                count={
                  count
                }
                setCount={
                  setCount
                }
                editable
                compact
              />
            </motion.div>
          )}

          <div
            className="
              mt-6
              hidden
              sm:block
              lg:hidden
            "
          >
            <BookingSummary
              selected={
                selected
              }
              count={
                count
              }
              setCount={
                setCount
              }
              editable
              compact
            />
          </div>
        </>
      )}

      <PrimaryButton
        onClick={
          onNext
        }
      >
        ادامه و تأیید شماره موبایل
      </PrimaryButton>
    </>
  );
}
function OtpStep({
  phone,
  otpCode,
  setOtpCode,
  otpRequesting,
  otpVerifying,
  submitting,
  resendAfter,
  onResend,
  onChangePhone,
  onVerify,
  devOtpCode,
}) {
  return (
    <>
      <SectionTitle
        icon={
          KeyRound
        }
        title="تأیید شماره موبایل"
        description={`کد ۶ رقمی ارسال‌شده به ${fa(
          phone
        )} را وارد کنید.`}
      />


      <div
        className="
          mt-6
          rounded-[22px]
          border
          border-[#634239]
          bg-[#100b0a]
          p-5
          sm:p-6
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <div
            className="
              flex h-11 w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#70483f]
              bg-[#21100e]
              text-[#b76557]
            "
          >
            <KeyRound
              size={19}
            />
          </div>


          <div>
            <div
              className="
                text-[15px]
                font-black
                text-[#dfd1c8]
              "
            >
              کد تأیید ارسال شد
            </div>

            <div
              className="
                mt-1
                text-[12px]
                leading-6
                text-[#857b74]
              "
            >
              برای ادامه رزرو، شماره موبایل رزروکننده باید تأیید شود.
            </div>
          </div>
        </div>


        <div
          className="
            mt-5
          "
        >
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
        </div>


        {devOtpCode && (
          <div
            className="
              mt-3
              rounded-[14px]
              border
              border-[#6b5730]
              bg-[#201907]
              px-3 py-2
              text-[12px]
              font-bold
              text-[#d4b75b]
            "
          >
            حالت توسعه — کد تست:
            {" "}
            <span
              dir="ltr"
              data-keep-latin-digits="true"
              className="
                font-mono
                text-[13px]
              "
            >
              {devOtpCode}
            </span>
          </div>
        )}


        <button
          type="button"
          disabled={
            resendAfter > 0 ||
            otpRequesting
          }
          onClick={
            onResend
          }
          className="
            mt-4
            text-[12px]
            font-black
            text-[#b36b5e]
            transition
            hover:text-[#d88d7e]
            disabled:cursor-not-allowed
            disabled:text-[#5e5651]
          "
        >
          {resendAfter > 0
            ? `ارسال مجدد تا ${fa(
                resendAfter
              )} ثانیه دیگر`
            : otpRequesting
              ? "در حال ارسال مجدد..."
              : "ارسال مجدد کد"}
        </button>
      </div>


      <div
        className="
          mt-7
          flex
          gap-3
        "
      >
        <SecondaryButton
          onClick={
            onChangePhone
          }
          disabled={
            otpVerifying ||
            submitting
          }
        >
          تغییر شماره موبایل
        </SecondaryButton>

        <PrimaryButton
          onClick={
            onVerify
          }
          disabled={
            otpVerifying ||
            otpRequesting ||
            submitting
          }
          compact
        >
          {otpVerifying
            ? "در حال تأیید..."
            : submitting
              ? "در حال ثبت رزرو..."
              : "تأیید و ثبت رزرو"}
        </PrimaryButton>
      </div>
    </>
  );
}


function PhoneEntryStep({
  phone,
  setPhone,
  otpRequesting,
  onSubmit,
}) {
  return (
    <>
      <SectionTitle
        icon={
          Phone
        }
        title="تأیید شماره موبایل"
        description="برای ثبت نهایی رزرو، شماره موبایل خود را وارد و با کد پیامکی تأیید کنید."
      />


      <div
        className="
          mt-6
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
                  11
                )
            )
          }
          placeholder="۰۹۱۲۱۲۳۴۵۶۷"
          inputMode="numeric"
        />
      </div>


      <div
        className="
          mt-7
        "
      >
        <PrimaryButton
          onClick={
            onSubmit
          }
          disabled={
            otpRequesting
          }
          compact
        >
          {otpRequesting
            ? "در حال ارسال کد..."
            : "ارسال کد تأیید"}
        </PrimaryButton>
      </div>
    </>
  );
}


function OtpModal({
  phone,
  setPhone,
  codeSent,
  otpCode,
  setOtpCode,
  otpRequesting,
  otpVerifying,
  submitting,
  resendAfter,
  devOtpCode,
  onResend,
  onSendCode,
  onVerifyCode,
  onChangePhone,
  onClose,
}) {
  return (
    <div
      dir="rtl"
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70
        px-4
        py-8
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-[26px]
          border
          border-[#4d3530]
          bg-[#0b0909]
          p-6
          shadow-[0_30px_80px_rgba(0,0,0,.45)]
          sm:p-7
        "
      >
        <div
          className="
            flex
            justify-end
          "
        >
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              submitting ||
              otpVerifying
            }
            className="
              rounded-full
              border
              border-white/[0.08]
              px-3
              py-1.5
              text-[12px]
              font-bold
              text-[#a79a92]
              transition
              hover:text-[#dfd1c8]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            بستن
          </button>
        </div>


        {codeSent ? (
          <OtpStep
            phone={
              phone
            }
            otpCode={
              otpCode
            }
            setOtpCode={
              setOtpCode
            }
            otpRequesting={
              otpRequesting
            }
            otpVerifying={
              otpVerifying
            }
            submitting={
              submitting
            }
            resendAfter={
              resendAfter
            }
            onResend={
              onResend
            }
            onChangePhone={
              onChangePhone
            }
            onVerify={
              onVerifyCode
            }
            devOtpCode={
              devOtpCode
            }
          />
        ) : (
          <PhoneEntryStep
            phone={
              phone
            }
            setPhone={
              setPhone
            }
            otpRequesting={
              otpRequesting
            }
            onSubmit={
              onSendCode
            }
          />
        )}
      </div>
    </div>
  );
}

function BookingSummary({
  selected,
  count,
  setCount,
  editable = false,
  compact = false,
}) {
  if (!selected) {
    return (
      <aside
        className={`
          h-fit
          rounded-[24px]
          border
          border-white/[0.06]
          bg-[#0a0908]
          ${
            compact
              ? "p-5"
              : "p-6"
          }
        `}
      >
        <Ticket
          size={24}
          className="
            text-[#825046]
          "
        />

        <div
          className="
            mt-4
            text-[20px]
            font-black
            leading-8
            text-[#eee2d9]
          "
        >
          خلاصه رزرو
        </div>

        <p
          className="
            mt-2
            text-[14px]
            leading-7
            text-[#857b74]
          "
        >
          پس از انتخاب شب اجرا، اطلاعات آن اینجا نمایش داده می‌شود.
        </p>
      </aside>
    );
  }


  const remaining =
    Number(
      selected
        .remainingCapacity ??
      selected
        .remaining_capacity ??
      selected
        .capacity ??
      0
    );

  const maxSelectable =
    Math.min(
      remaining,
      MAX_TICKETS_PER_RESERVATION
    );


  return (
    <aside
      className={`
        h-fit
        rounded-[24px]
        border
        border-[#51352f]
        bg-[#0d0a09]
        ${
          compact
            ? "p-5"
            : "p-6 lg:sticky lg:top-6"
        }
      `}
    >
      <div
        className="
          text-[15px]
          font-black
          leading-6
          text-[#a95e52]
        "
      >
        نمایش «بیرق ماندگار»
      </div>


      <div
        className="
          mt-2
          text-[28px]
          font-black
          leading-[1.45]
          text-[#f2e6de]
        "
      >
        {selected.label}
      </div>


      <div
        className="
          mt-5
          space-y-4
        "
      >
        <SummaryItem
          icon={
            CalendarDays
          }
          label="تاریخ"
          value={fa(
            selected.date
          )}
        />

        <SummaryItem
          icon={
            Clock3
          }
          label="ساعت شروع"
          value={fa(
            selected.time
          )}
        />

        {selected.attendanceTime && (
          <SummaryItem
            icon={
              Clock3
            }
            label="ساعت حضور"
            value={fa(
              selected.attendanceTime
            )}
          />
        )}
      </div>


      <TicketQuantityControl
        count={
          count
        }
        setCount={
          setCount
        }
        maxSelectable={
          maxSelectable
        }
        editable={
          editable
        }
      />
    </aside>
  );
}


function TicketQuantityControl({
  count,
  setCount,
  maxSelectable,
  editable,
}) {
  return (
    <div
      className="
        mt-6
        rounded-[20px]
        border
        border-[#573830]
        bg-[#130d0c]
        p-4
      "
    >
      <div
        className="
          flex
          items-start
          gap-3
        "
      >
        <Ticket
          size={24}
          className="
            mt-0.5
            shrink-0
            text-[#b86b5d]
          "
        />

        <div>
          <div
            className="
              text-[16px]
              font-black
              leading-7
              text-[#e3d6cd]
            "
          >
            تعداد بلیت
          </div>

          <div
            className="
              mt-1
              text-[14px]
              font-bold
              leading-6
              text-[#9a8e87]
            "
          >
            {editable
              ? "حداکثر ۵ بلیت در هر رزرو"
              : "تعداد انتخاب‌شده در مرحله اول"}
          </div>
        </div>
      </div>


      {editable ? (
        <div
          className="
            mt-5
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <button
            type="button"
            aria-label="کاهش تعداد بلیت"
            disabled={
              count <= 1
            }
            onClick={() =>
              setCount(
                Math.max(
                  1,
                  count - 1
                )
              )
            }
            className="
              flex h-12 w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#553830]
              bg-[#0c0908]
              text-[#d4b8af]
              transition
              hover:border-[#855247]
              hover:bg-[#18100e]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Minus
              size={21}
            />
          </button>


          <div
            className="
              min-w-[90px]
              text-center
            "
          >
            <div
              className="
                text-[32px]
                font-black
                leading-none
                text-[#f3e7df]
              "
            >
              {fa(
                count
              )}
            </div>

            <div
              className="
                mt-2
                text-[13px]
                font-bold
                text-[#91857e]
              "
            >
              بلیت
            </div>
          </div>


          <button
            type="button"
            aria-label="افزایش تعداد بلیت"
            disabled={
              count >=
              maxSelectable
            }
            onClick={() =>
              setCount(
                Math.min(
                  Math.max(
                    1,
                    maxSelectable
                  ),
                  count + 1
                )
              )
            }
            className="
              flex h-12 w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#875044]
              bg-[#401b17]
              text-[#f0d7ce]
              transition
              hover:bg-[#54231d]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Plus
              size={21}
            />
          </button>
        </div>
      ) : (
        <div
          className="
            mt-5
            flex
            items-end
            gap-2
          "
        >
          <span
            className="
              text-[32px]
              font-black
              leading-none
              text-[#f3e7df]
            "
          >
            {fa(
              count
            )}
          </span>

          <span
            className="
              pb-0.5
              text-[14px]
              font-bold
              text-[#a89b93]
            "
          >
            بلیت
          </span>
        </div>
      )}
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div>
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className="
            flex h-10 w-10
            shrink-0
            items-center
            justify-center
            rounded-full
            border
            border-[#633f37]
            bg-[#21100e]
            text-[#b76557]
          "
        >
          <Icon
            size={20}
          />
        </div>

        <h2
          className="
            text-[20px]
            font-black
            leading-8
            text-[#eee2d9]
          "
        >
          {title}
        </h2>
      </div>

      <p
        className="
          mt-3
          text-[14px]
          leading-7
          text-[#857b74]
        "
      >
        {description}
      </p>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  ...props
}) {
  return (
    <label
      className="block"
    >
      <div
        className="
          mb-2
          text-[14px]
          font-black
          leading-6
          text-[#b9aaa1]
        "
      >
        {label}
      </div>

      <div
        className="
          flex
          items-center
          gap-3
          rounded-[16px]
          border
          border-[#45322d]
          bg-[#070606]
          px-4
          transition
          focus-within:border-[#98574c]
          focus-within:bg-[#0d0807]
        "
      >
        <Icon
          size={20}
          className="
            shrink-0
            text-[#8c554a]
          "
        />

        <input
          {...props}
          className="
            h-14
            w-full
            bg-transparent
            text-[16px]
            font-bold
            text-[#eee4dc]
            outline-none
            placeholder:text-[#5d5651]
          "
        />
      </div>
    </label>
  );
}

function ReviewRow({
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-5
        py-4
      "
    >
      <span
        className="
          text-[14px]
          font-bold
          leading-6
          text-[#857b74]
        "
      >
        {label}
      </span>

      <span
        className="
          text-left
          text-[16px]
          font-black
          leading-7
          text-[#e1d5cd]
        "
      >
        {value}
      </span>
    </div>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >
      <Icon
        size={23}
        className="
          shrink-0
          text-[#b66a5c]
        "
      />

      <div>
        <div
          className="
            text-[14px]
            font-bold
            leading-6
            text-[#91857e]
          "
        >
          {label}
        </div>

        <div
          className="
            mt-1
            text-[18px]
            font-black
            leading-7
            text-[#e5d8cf]
          "
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  compact,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className={`
        ${compact
          ? "flex-1"
          : "mt-7 w-full"
        }

        flex
        items-center
        justify-center
        gap-2
        rounded-full
        border
        border-[#98574c]
        bg-gradient-to-l
        from-[#57211e]
        to-[#7a2d28]
        px-6 py-3.5
        text-[15px]
        font-black
        text-[#f5e6dd]
        transition
        hover:border-[#bb7062]
        disabled:cursor-not-allowed
        disabled:opacity-50
      `}
    >
      {children}

      <ArrowLeft
        size={18}
      />
    </button>
  );
}


function SecondaryButton({
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="
        rounded-full
        border
        border-white/[0.08]
        bg-white/[0.025]
        px-5 py-3.5
        text-[14px]
        font-black
        text-[#a99d95]
      "
    >
      {children}
    </button>
  );
}
