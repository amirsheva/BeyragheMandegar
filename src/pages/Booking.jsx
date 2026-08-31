import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  Ticket,
  UserRound,
  Phone,
  BadgeCheck,
  KeyRound,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Pencil,
  Clapperboard,
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
    step,
    setStep,
  ] = useState(1);


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
    form,
    setForm,
  ] = useState({
    name: "",
    phone: "",
    nationalId: "",
  });


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
        remaining
    ) {
      setError(
        "تعداد بلیت انتخاب‌شده معتبر نیست."
      );

      return;
    }


    setError("");
    setStep(2);
  }


  function validateStepTwo() {
    const phone =
      normalizeDigits(
        form.phone
      )
        .replace(
          /\D/g,
          ""
        );


    const nationalId =
      normalizeDigits(
        form.nationalId
      )
        .replace(
          /\D/g,
          ""
        );


    if (
      !form.name.trim()
    ) {
      setError(
        "نام و نام خانوادگی را وارد کنید."
      );

      return null;
    }


    if (
      !/^09\d{9}$/.test(
        phone
      )
    ) {
      setError(
        "شماره موبایل معتبر وارد کنید."
      );

      return null;
    }


    if (
      !/^\d{10}$/.test(
        nationalId
      )
    ) {
      setError(
        "کد ملی باید ۱۰ رقم باشد."
      );

      return null;
    }


    setForm(
      (
        current
      ) => ({
        ...current,
        phone,
        nationalId,
      })
    );


    return {
      phone,
      nationalId,
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


  async function nextFromStepTwo() {
    const validated =
      validateStepTwo();


    if (!validated) {
      return;
    }


    const {
      phone,
    } =
      validated;


    const alreadyVerified =
      Boolean(
        verificationToken
      ) &&
      verifiedPhone ===
        phone;


    if (
      alreadyVerified
    ) {
      setError("");
      setStep(4);

      return;
    }


    const challengeMatches =
      Boolean(
        otpChallengeId
      ) &&
      otpPhone ===
        phone;


    if (
      challengeMatches
    ) {
      setError("");
      setStep(3);

      return;
    }


    const requested =
      await requestOtp(
        phone
      );


    if (
      requested
    ) {
      setStep(3);
    }
  }


  async function nextFromOtpStep() {
    const validated =
      validateStepTwo();


    if (!validated) {
      setStep(2);
      return;
    }


    const {
      phone,
    } =
      validated;


    const challengeMatches =
      Boolean(
        otpChallengeId
      ) &&
      otpPhone ===
        phone;


    if (
      !challengeMatches
    ) {
      setError(
        "برای این شماره موبایل کد تأیید فعالی وجود ندارد. دوباره کد دریافت کنید."
      );

      setStep(2);
      return;
    }


    const verified =
      await verifyOtp(
        phone
      );


    if (
      verified
    ) {
      setStep(4);
    }
  }

  async function resendOtp() {
    const validated =
      validateStepTwo();


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
                  form.name.trim(),

                phone:
                  normalizeDigits(
                    form.phone
                  ),

                nationalId:
                  normalizeDigits(
                    form.nationalId
                  ),

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

          setStep(2);
        }


        return;
      }


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


          <p
            className="
              mt-3
              leading-7
              text-[#98a49c]
            "
          >
            اطلاعات رزرو شما ثبت شد. کد پیگیری را برای مراجعات بعدی نگه دارید.
          </p>


          <div
            className="
              mt-7
              rounded-[20px]
              border
              border-white/[0.07]
              bg-black/20
              p-5
            "
          >
            <div
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
          </div>


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



        {/* BOOKING_STEPPER_ABOVE_TITLE_V5 */}
        <Stepper
          current={
            step
          }
        />




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
          شب اجرا را انتخاب کنید، اطلاعات خود را وارد کنید و پیش از ثبت نهایی همه‌چیز را مرور کنید.
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
            className={`
              rounded-[28px]
              border
              border-[#4d3530]
              bg-[#0b0909]
              p-5
              sm:p-7
              ${
                step === 4
                  ? "lg:col-span-2 booking-final-shell"
                  : ""
              }
            `}
          >
            {step ===
              1 && (
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
                }                onNext={
                  nextFromStepOne
                }
              />
            )}


            {/* BOOKING_MOBILE_READONLY_SUMMARY */}
            {(step === 2 ||
              step === 3) &&
            selected && (
              <div
                className="
                  mb-5
                  lg:hidden
                "
              >
                <MobileSelectionBar
                  selected={
                    selected
                  }
                  count={
                    count
                  }
                  onEdit={() =>
                    setStep(1)
                  }
                />
              </div>
            )}

            {step ===
              2 && (
              <StepTwo
                form={
                  form
                }
                setForm={
                  setForm
                }
                onBack={() =>
                  setStep(
                    1
                  )
                }
                onNext={
                  nextFromStepTwo
                }
                requesting={
                  otpRequesting
                }
              />
            )}


            {step ===
              3 && (
              <OtpStep
                phone={
                  normalizeDigits(
                    form.phone
                  ).replace(
                    /\D/g,
                    ""
                  )
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
                resendAfter={
                  resendAfter
                }
                onResend={
                  resendOtp
                }
                onBack={() =>
                  setStep(
                    2
                  )
                }
                onNext={
                  nextFromOtpStep
                }
                devOtpCode={
                  devOtpCode
                }
              />
            )}


            {step ===
              4 && (
              <StepThree
                selected={
                  selected
                }
                form={
                  form
                }
                count={
                  count
                }
                submitting={
                  submitting
                }
                onBack={() =>
                  setStep(
                    2
                  )
                }
                onSubmit={
                  submitReservation
                }
              />
            )}


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
                        {/* FINAL_NORMAL_SUMMARY_GUARD */}
            {step !== 4 && (
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
              editable={
                step === 1
              }
            />
            )}

          </div>
        </div>
      </div>
    </main>
  );
}


function Stepper({
  current,
}) {
  const items = [
    {
      id: 1,
      title:
        "انتخاب اجرا",
    },
    {
      id: 2,
      title:
        "اطلاعات شما",
    },
    {
      id: 3,
      title:
        "تأیید موبایل",
    },
    {
      id: 4,
      title:
        "تأیید نهایی",
    },
  ];


  const activeItem =
    items.find(
      (item) =>
        item.id ===
        current
    ) ||
    items[0];


  return (
    <>
      <div
        dir="rtl"
        className="
          mt-1
          mb-6
          flex
          items-center
          justify-between
          gap-4
          rounded-[16px]
          border
          border-[#3f2c28]
          bg-[#0b0909]
          px-4
          py-3
          sm:hidden
        "
      >
        <div
          className="
            flex
            items-center
            justify-start
            gap-3
          "
        >
          <div
            className="
              flex h-8 w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-[#9d574c]
              bg-[#642821]
              text-[13px]
              font-black
              text-[#fff1eb]
            "
          >
            {fa(
              current
            )}
          </div>

          <div>
            <div
              className="
                text-[12px]
                font-bold
                text-[#8d817a]
              "
            >
              مرحله {fa(
                current
              )} از {fa(
                items.length
              )}
            </div>

            <div
              className="
                mt-0.5
                text-[15px]
                font-black
                text-[#eee2d9]
              "
            >
              {
                activeItem.title
              }
            </div>
          </div>
        </div>
      </div>


      <div
        dir="rtl"
        className="
          mt-1
          mb-7
          hidden
          grid-cols-4
          gap-4
          sm:grid
        "
      >
        {items.map(
          (item) => {
            const done =
              item.id <
              current;

            const active =
              item.id ===
              current;


            return (
              <div
                key={
                  item.id
                }
                className={`
                  flex
                  min-h-[52px]
                  items-center
                  justify-start
                  gap-3
                  border-b
                  px-2
                  pb-3
                  ${
                    active
                      ? "border-[#b76456] text-[#eee2d9]"
                      : done
                        ? "border-[#684037] text-[#b7aaa2]"
                        : "border-white/[0.06] text-[#817773]"
                  }
                `}
              >
                <div
                  className={`
                    flex h-8 w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    text-[13px]
                    font-black
                    ${
                      active
                        ? "border-[#a75d51] bg-[#7a3029] text-[#fff4ef]"
                        : done
                          ? "border-[#654039] bg-[#291613] text-[#c88275]"
                          : "border-[#403733] bg-[#0a0908] text-[#817873]"
                    }
                  `}
                >
                  {done ? (
                    <Check
                      size={15}
                      strokeWidth={2}
                    />
                  ) : (
                    fa(
                      item.id
                    )
                  )}
                </div>


                <div
                  className="
                    text-[14px]
                    font-black
                    leading-6
                  "
                >
                  {
                    item.title
                  }
                </div>
              </div>
            );
          }
        )}
      </div>
    </>
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
  onNext,
}) {
  return (
    <>
      <SectionTitle
        icon={
          Ticket
        }
        title="انتخاب شب اجرا"
        description="شب موردنظر را انتخاب کنید."
      />


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
                    onSelect(
                      show
                    )
                  }
                  className={`
                    rounded-[20px]
                    border
                    p-4
                    text-right
                    transition

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
                      ساعت{" "}
                      {fa(
                        show.time
                      )}
                    </span>
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
                      : `${fa(
                          available
                        )} صندلی باقی مانده`}
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}


      {/* BOOKING_MOBILE_STEP1_SUMMARY */}
      {selected && (
        <div
          className="
            mt-6
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
      )}

      <PrimaryButton
        onClick={
          onNext
        }
      >
        ادامه به اطلاعات رزروکننده
      </PrimaryButton>
    </>
  );
}


function StepTwo({
  form,
  setForm,
  onBack,
  onNext,
  requesting,
}) {
  function update(
    key,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );
  }


  return (
    <>
      <SectionTitle
        icon={
          UserRound
        }
        title="اطلاعات رزروکننده"
        description="اطلاعات زیر فقط برای ثبت و پیگیری رزرو استفاده می‌شود."
      />


      <div
        className="
          mt-6
          grid
          gap-5
        "
      >
        <Field
          icon={
            UserRound
          }
          label="نام و نام خانوادگی"
          value={
            form.name
          }
          onChange={(
            event
          ) =>
            update(
              "name",
              event
                .target
                .value
            )
          }
          placeholder="نام و نام خانوادگی"
        />


        <Field
          icon={
            Phone
          }
          label="شماره موبایل"
          value={
            form.phone
          }
          onChange={(
            event
          ) =>
            update(
              "phone",
              event
                .target
                .value
            )
          }
          placeholder="۰۹۱۲۱۲۳۴۵۶۷"
          inputMode="numeric"
        />


        <Field
          icon={
            BadgeCheck
          }
          label="کد ملی"
          value={
            form.nationalId
          }
          onChange={(
            event
          ) =>
            update(
              "nationalId",
              event
                .target
                .value
            )
          }
          placeholder="۱۰ رقم"
          inputMode="numeric"
        />
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
            onBack
          }
        >
          مرحله قبل
        </SecondaryButton>

        <PrimaryButton
          onClick={
            onNext
          }
          disabled={
            requesting
          }
          compact
        >
          {requesting
            ? "در حال ارسال کد..."
            : "ادامه به تأیید موبایل"}
        </PrimaryButton>
      </div>
    </>
  );
}


function OtpStep({
  phone,
  otpCode,
  setOtpCode,
  otpRequesting,
  otpVerifying,
  resendAfter,
  onResend,
  onBack,
  onNext,
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
            onBack
          }
          disabled={
            otpVerifying
          }
        >
          ویرایش اطلاعات
        </SecondaryButton>

        <PrimaryButton
          onClick={
            onNext
          }
          disabled={
            otpVerifying ||
            otpRequesting
          }
          compact
        >
          {otpVerifying
            ? "در حال تأیید..."
            : "تأیید کد و ادامه"}
        </PrimaryButton>
      </div>
    </>
  );
}

function StepThree({
  selected,
  form,
  count,
  submitting,
  onBack,
  onSubmit,
}) {
  return (
    <div
      dir="rtl"
      className="
        booking-final-review
        w-full
        text-right
      "
    >
      <div
        className="
          booking-final-review__layout
          grid
          grid-cols-1
          gap-8
          lg:grid-cols-[330px_minmax(0,1fr)]
          lg:items-stretch
        "
        style={{
          direction:
            "ltr",
        }}
      >
        <FinalTicketStub
          selected={
            selected
          }
          count={
            count
          }
        />


        <div
          dir="rtl"
          className="
            booking-final-review__details
            min-w-0
            text-right
          "
        >
          <div
            className="
              booking-final-review__heading
              flex
              items-start
              justify-start
              gap-4
              text-right
            "
          >
            <FinalApprovalSealVector
              size={64}
              className="
                booking-final-review__seal
                shrink-0
                text-[#c87867]
              "
            />


            <div
              className="
                min-w-0
                text-right
              "
            >
              <h2
                className="
                  booking-final-review__title
                  font-black
                  text-[#f1e6de]
                "
              >
                تأیید نهایی
              </h2>

              <p
                className="
                  booking-final-review__subtitle
                  mt-1.5
                  font-bold
                  text-[#8f837c]
                "
              >
                قبل از ثبت نهایی، اطلاعات رزرو را بررسی کنید.
              </p>
            </div>
          </div>


          <div
            className="
              booking-final-review__header-divider
              mt-5
              border-t
              border-dashed
              border-[#543831]
            "
          />


          <FinalReviewSection
            title="اطلاعات اجرا"
            icon={
              Ticket
            }
          >
            <FinalReviewRow
              icon={
                ShowMetaVector
              }
              label="نمایش"
              value="«بیرق ماندگار»"
            />

            <FinalReviewRow
              icon={
                NightMetaVector
              }
              label="شب"
              value={
                selected
                  ?.label ||
                "—"
              }
            />

            <FinalReviewRow
              icon={
                DateMetaVector
              }
              label="تاریخ"
              value={fa(
                selected
                  ?.date
              )}
            />

            <FinalReviewRow
              icon={
                TimeMetaVector
              }
              label="ساعت"
              value={fa(
                selected
                  ?.time
              )}
            />
          </FinalReviewSection>


          <FinalReviewSection
            title="اطلاعات خریدار"
            icon={
              UserRound
            }
            separated
          >
            <FinalReviewRow
              icon={
                NameMetaVector
              }
              label="نام"
              value={
                form.name ||
                "—"
              }
            />

            <FinalReviewRow
              icon={
                Phone
              }
              label="موبایل"
              value={fa(
                form.phone
              )}
            />

            <FinalReviewRow
              icon={
                IdCardMetaVector
              }
              label="کد ملی"
              value="ثبت شده"
            />
          </FinalReviewSection>


          <div
            className="
              booking-final-review__actions
              mt-7
            "
          >
            <button
              type="button"
              onClick={
                onBack
              }
              disabled={
                submitting
              }
              className="
                booking-final-review__edit
                inline-flex
                min-h-[58px]
                items-center
                justify-center
                gap-3
                rounded-full
                border
                border-[#8e5a4c]
                bg-[#0b0909]
                px-6
                text-[16px]
                font-black
                text-[#d79a87]
                transition
                hover:border-[#b56c5b]
                hover:bg-[#130d0c]
                disabled:cursor-not-allowed
                disabled:opacity-55
              "
            >
              <Pencil
                size={19}
                strokeWidth={1.75}
              />

              <span>
                ویرایش
              </span>
            </button>


            <button
              type="button"
              onClick={
                onSubmit
              }
              disabled={
                submitting
              }
              className="
                booking-final-review__submit
                inline-flex
                min-h-[58px]
                items-center
                justify-center
                gap-3
                rounded-full
                border
                border-[#bd6759]
                px-7
                text-[16px]
                font-black
                text-[#fff2ec]
                shadow-[0_14px_36px_rgba(90,27,22,0.28)]
                transition
                disabled:cursor-not-allowed
                disabled:opacity-55
              "
            >
              <span>
                {submitting
                  ? "در حال ثبت..."
                  : "ثبت نهایی رزرو"}
              </span>

              {!submitting && (
                <ArrowLeft
                  size={19}
                  strokeWidth={1.9}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function FinalApprovalSealVector({
  size = 64,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* FINAL_APPROVAL_ROSETTE_V5 */}
      <path
        d="
          M32 3.5
          C35.2 3.5 37.1 7.1 40 8
          C43 8.9 46.3 6.8 48.7 9.3
          C51.2 11.7 49.1 15 50 18
          C50.9 20.9 54.5 22.8 54.5 26
          C54.5 29.2 50.9 31.1 50 34
          C49.1 37 51.2 40.3 48.7 42.7
          C46.3 45.2 43 43.1 40 44
          C37.1 44.9 35.2 48.5 32 48.5
          C28.8 48.5 26.9 44.9 24 44
          C21 43.1 17.7 45.2 15.3 42.7
          C12.8 40.3 14.9 37 14 34
          C13.1 31.1 9.5 29.2 9.5 26
          C9.5 22.8 13.1 20.9 14 18
          C14.9 15 12.8 11.7 15.3 9.3
          C17.7 6.8 21 8.9 24 8
          C26.9 7.1 28.8 3.5 32 3.5
          Z
        "
        transform="translate(0 6)"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinejoin="round"
      />

      <circle
        cx="32"
        cy="32"
        r="13.2"
        stroke="currentColor"
        strokeWidth="1.25"
      />

      <path
        d="M25.5 32.2 30 36.6 39.3 26.9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function FinalTicketStub({
  selected,
  count,
}) {
  return (
    <aside
      dir="rtl"
      className="
        booking-final-ticket
        relative
        min-h-full
        text-right
      "
    >
      <TicketOutlineVector />


      <div
        className="
          booking-final-ticket__content
          relative
          z-[2]
          flex
          h-full
          flex-col
          text-right
        "
      >
        <div
          className="
            booking-final-ticket__eyebrow
            font-black
            text-[#c46f60]
          "
        >
          نمایش «بیرق ماندگار»
        </div>


        <div
          className="
            booking-final-ticket__night
            font-black
            text-[#f1e6de]
          "
        >
          {
            selected
              ?.label ||
            "—"
          }
        </div>


        <div
          className="
            booking-final-ticket__divider
            h-px
            bg-[#4f352f]
          "
        />


        <div
          className="
            booking-final-ticket__meta-list
          "
        >
          <FinalTicketMeta
            icon={
              CalendarDays
            }
            label="تاریخ"
            value={fa(
              selected
                ?.date
            )}
          />

          <FinalTicketMeta
            icon={
              Clock3
            }
            label="ساعت"
            value={fa(
              selected
                ?.time
            )}
          />
        </div>


        <div
          className="
            booking-final-ticket__count
            relative
            overflow-hidden
            border
            border-[#b66757]
            text-right
          "
        >
          <SeatWatermarkVector />


          <div
            className="
              booking-final-ticket__count-label
              relative
              z-[2]
              font-black
              text-[#d88973]
            "
          >
            تعداد بلیت رزروشده
          </div>


          <div
            className="
              booking-final-ticket__count-value
              relative
              z-[2]
              flex
              items-end
              justify-start
              gap-3
            "
          >
            <strong
              className="
                booking-final-ticket__count-number
                font-black
                leading-none
                text-[#efaa8c]
              "
            >
              {fa(
                count
              )}
            </strong>

            <span
              className="
                booking-final-ticket__count-unit
                font-black
                text-[#dc9279]
              "
            >
              بلیت
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}


function TicketOutlineVector() {
  return (
    <svg
      className="
        booking-final-ticket__outline
        absolute
        inset-0
        h-full
        w-full
      "
      viewBox="0 0 330 640"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* TICKET_SURFACE_GRADIENT_V5 */}
        <linearGradient
          id="ticketSurfaceV5"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#1b120f"
          />
          <stop
            offset="48%"
            stopColor="#0c0908"
          />
          <stop
            offset="100%"
            stopColor="#261713"
          />
        </linearGradient>

        <radialGradient
          id="ticketGlowV5"
          cx="0"
          cy="0"
          r="1"
          gradientTransform="translate(258 124) rotate(133) scale(260 330)"
        >
          <stop
            offset="0%"
            stopColor="#8d4d41"
            stopOpacity=".24"
          />
          <stop
            offset="100%"
            stopColor="#8d4d41"
            stopOpacity="0"
          />
        </radialGradient>
      </defs>


      {/* SOFT_REFERENCE_TICKET_OUTLINE_V5 */}
      <path
        d="
          M 34 1
          H 137
          C 138 15 149 25 165 25
          C 181 25 192 15 193 1
          H 296

          C 297 11 304 18 314 19
          C 320 19.5 325 20 329 22

          V 618

          C 325 620 320 620.5 314 621
          C 304 622 297 629 296 639

          H 193
          C 192 629 181 621 165 621
          C 149 621 138 629 137 639
          H 34

          C 33 629 26 622 16 621
          C 10 620.5 5 620 1 618

          V 22

          C 5 20 10 19.5 16 19
          C 26 18 33 11 34 1
          Z
        "
        fill="url(#ticketSurfaceV5)"
        stroke="#8a5648"
        strokeWidth="1.55"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      <path
        d="
          M 34 1
          H 137
          C 138 15 149 25 165 25
          C 181 25 192 15 193 1
          H 296

          C 297 11 304 18 314 19
          C 320 19.5 325 20 329 22

          V 618

          C 325 620 320 620.5 314 621
          C 304 622 297 629 296 639

          H 193
          C 192 629 181 621 165 621
          C 149 621 138 629 137 639
          H 34

          C 33 629 26 622 16 621
          C 10 620.5 5 620 1 618

          V 22

          C 5 20 10 19.5 16 19
          C 26 18 33 11 34 1
          Z
        "
        fill="url(#ticketGlowV5)"
        stroke="none"
      />
    </svg>
  );
}


function FinalTicketMeta({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      className="
        booking-final-ticket__meta
        text-right
      "
    >
      <div
        className="
          booking-final-ticket__meta-label
          flex
          items-center
          justify-start
          gap-3
          font-black
          text-[#c36f5f]
        "
      >
        <Icon
          size={23}
          strokeWidth={1.75}
        />

        <span>
          {label}
        </span>
      </div>

      <div
        className="
          booking-final-ticket__meta-value
          font-black
          text-[#f0e3db]
        "
      >
        {value || "—"}
      </div>
    </div>
  );
}


function FinalReviewSection({
  title,
  icon: Icon,
  separated = false,
  children,
}) {
  return (
    <section
      className={`
        booking-final-review-section
        text-right
        ${
          separated
            ? "booking-final-review-section--separated"
            : ""
        }
      `}
    >
      <div
        className="
          booking-final-review-section__title
          flex
          items-center
          justify-start
          gap-3
          text-right
        "
      >
        <Icon
          size={24}
          strokeWidth={1.75}
          className="
            shrink-0
            text-[#c87966]
          "
        />

        <h3
          className="
            text-[19px]
            font-black
            leading-8
            text-[#e8d9d0]
          "
        >
          {title}
        </h3>
      </div>


      <div
        className="
          booking-final-review-section__rows
          mt-4
        "
      >
        {children}
      </div>
    </section>
  );
}


function FinalReviewRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div
      dir="rtl"
      className="
        booking-final-review-row
        text-right
      "
    >
      <div
        className="
          booking-final-review-row__label
          flex
          shrink-0
          items-center
          justify-start
          gap-3
          text-right
          font-bold
          text-[#988b83]
        "
      >
        <Icon
          size={21}
          strokeWidth={1.7}
          className="
            shrink-0
            text-[#c36f5f]
          "
        />

        <span>
          {label}
        </span>
      </div>


      <div
        className="
          booking-final-review-row__value
          min-w-0
          text-right
          font-black
          text-[#eee2d9]
        "
      >
        {value || "—"}
      </div>
    </div>
  );
}


function ShowMetaVector({
  size = 21,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 9h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle
        cx="9"
        cy="13"
        r="1"
        fill="currentColor"
      />
      <circle
        cx="13"
        cy="13"
        r="1"
        fill="currentColor"
      />
      <circle
        cx="9"
        cy="17"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}


function NightMetaVector({
  size = 21,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8 3.5v3M16 3.5v3M4 9h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M8 13h2M14 13h2M8 17h2M14 17h2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function DateMetaVector({
  size = 21,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7v5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function TimeMetaVector({
  size = 21,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M12 7.5v4.8l3 1.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


function NameMetaVector({
  size = 21,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="
          M5 18
          C7 15 7.5 10 10 8
          C11.5 6.8 12.7 7.7 12.2 9.4
          L10.7 13
          C10 14.7 11.2 16 12.6 15.2
          C14.4 14.2 14.8 10.5 17.2 8.8
          C18.6 7.8 19.6 8.5 19.1 10
          C18.4 12.2 16.1 14.7 16.8 17
        "
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 19.5h15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity=".55"
      />
    </svg>
  );
}


function IdCardMetaVector({
  size = 21,
  className = "",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="8"
        cy="10"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 15c.7-1.7 1.6-2.5 2.5-2.5s1.8.8 2.5 2.5M14 9h4M14 12h4M14 15h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}


function SeatWatermarkVector() {
  return (
    <svg
      className="
        booking-final-ticket__seat-watermark
        absolute
        bottom-2
        left-1
      "
      viewBox="0 0 150 125"
      fill="none"
      aria-hidden="true"
    >
      {/* REFERENCE_THEATRE_SEATS_V5 */}

      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* decorative diagonal hatch */}
        <path
          d="M4 28 55 79M14 16 66 68M26 8 79 61M7 51 48 92"
          strokeWidth="1.4"
          opacity=".44"
        />

        {/* rear seat */}
        <path
          d="M72 29c0-8 6-14 14-14h25c8 0 14 6 14 14v21H72V29Z"
          strokeWidth="4.5"
          opacity=".54"
        />
        <path
          d="M67 50h63v18H67z"
          strokeWidth="4.5"
          opacity=".54"
        />
        <path
          d="M76 68v25M121 68v25"
          strokeWidth="4.5"
          opacity=".54"
        />
        <path
          d="m70 38-11-10M127 38l11-10"
          strokeWidth="4.5"
          opacity=".54"
        />

        {/* front seat */}
        <path
          d="M26 54c0-10 7-17 17-17h29c10 0 17 7 17 17v26H26V54Z"
          strokeWidth="5.5"
        />
        <path
          d="M19 80h77v21H19z"
          strokeWidth="5.5"
        />
        <path
          d="M30 101v20M85 101v20"
          strokeWidth="5.5"
        />
        <path
          d="m24 64-13-12M91 64l13-12"
          strokeWidth="5.5"
        />
      </g>
    </svg>
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
          label="ساعت"
          value={fa(
            selected.time
          )}
        />
      </div>


      <TicketQuantityControl
        count={
          count
        }
        setCount={
          setCount
        }
        remaining={
          remaining
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
  remaining,
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
              ? "حداکثر بر اساس ظرفیت باقی‌مانده"
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
              remaining
            }
            onClick={() =>
              setCount(
                Math.min(
                  Math.max(
                    1,
                    remaining
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


      <div
        className="
          mt-4
          border-t
          border-white/[0.06]
          pt-3
          text-[13px]
          font-bold
          leading-6
          text-[#71b989]
        "
      >
        {fa(
          remaining
        )} صندلی باقی‌مانده
      </div>
    </div>
  );
}


function MobileSelectionBar({
  selected,
  count,
  onEdit,
}) {
  return (
    <div
      className="
        rounded-[18px]
        border
        border-[#4c332e]
        bg-[#0d0a09]
        p-4
      "
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-4
        "
      >
        <div
          className="
            min-w-0
          "
        >
          <div
            className="
              text-[12px]
              font-black
              text-[#a45d51]
            "
          >
            انتخاب شما
          </div>

          <div
            className="
              mt-1
              text-[18px]
              font-black
              leading-7
              text-[#eee2d9]
            "
          >
            {selected.label}
          </div>

          <div
            className="
              mt-2
              text-[13px]
              font-bold
              leading-6
              text-[#91867f]
            "
          >
            {fa(
              selected.date
            )}
            {" • "}
            {fa(
              selected.time
            )}
            {" • "}
            {fa(
              count
            )} بلیت
          </div>
        </div>


        <button
          type="button"
          onClick={
            onEdit
          }
          className="
            shrink-0
            rounded-full
            border
            border-[#593a33]
            px-3
            py-2
            text-[12px]
            font-black
            text-[#c57a6c]
            transition
            hover:border-[#8b554a]
            hover:text-[#e19b8d]
          "
        >
          ویرایش
        </button>
      </div>
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