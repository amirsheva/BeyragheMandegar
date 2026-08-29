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
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  Check,
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
          setShows(
            Array.isArray(
              data
            )
              ? data
              : []
          );
        }
      )
      .finally(
        () => {
          setLoading(false);
        }
      );
  }, []);


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


  function nextFromStepTwo() {
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

      return;
    }


    if (
      !/^09\d{9}$/.test(
        phone
      )
    ) {
      setError(
        "شماره موبایل معتبر وارد کنید."
      );

      return;
    }


    if (
      !/^\d{10}$/.test(
        nationalId
      )
    ) {
      setError(
        "کد ملی باید ۱۰ رقم باشد."
      );

      return;
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


    setError("");
    setStep(3);
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
              className="
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


          <Link
            to="/"
            className="
              mt-7
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
      </main>
    );
  }


  return (
    <main
      dir="rtl"
      className="
        min-h-screen
        bg-[#070707]
        px-4 py-10
        text-[#efe5dd]
        sm:px-6
        lg:py-16
      "
    >
      <div
        className="
          mx-auto
          max-w-[1100px]
        "
      >
        <Link
          to={
            selectedId
              ? `/performance/${selectedId}`
              : "/#performances"
          }
          className="
            inline-flex
            items-center
            gap-2
            text-[14px]
            font-bold
            text-[#887c75]
            hover:text-[#d0beb2]
          "
        >
          <ArrowRight
            size={17}
          />

          بازگشت
        </Link>


        <div
          className="
            mt-7
            text-[13px]
            font-black
            text-[#9e594f]
          "
        >
          رزرو بلیت
        </div>


        <h1
          className="
            mt-2
            text-[36px]
            font-black
            text-[#f2e7df]
            md:text-[48px]
          "
        >
          تکمیل رزرو
        </h1>


        <p
          className="
            mt-3
            max-w-2xl
            leading-7
            text-[#91867f]
          "
        >
          شب اجرا را انتخاب کنید، اطلاعات خود را وارد کنید و پیش از ثبت نهایی همه‌چیز را مرور کنید.
        </p>


        <Stepper
          current={
            step
          }
        />


        <div
          className="
            mt-8
            grid
            gap-6
            lg:grid-cols-[1fr_340px]
          "
        >
          <section
            className="
              rounded-[28px]
              border
              border-[#4d3530]
              bg-[#0b0909]
              p-5
              sm:p-7
            "
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
                count={
                  count
                }
                setCount={
                  setCount
                }
                remaining={
                  remaining
                }
                onNext={
                  nextFromStepOne
                }
              />
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
              />
            )}


            {step ===
              3 && (
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


          <BookingSummary
            selected={
              selected
            }
            count={
              count
            }
          />
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
        "تأیید نهایی",
    },
  ];


  return (
    <div
      className="
        mt-9
        grid
        grid-cols-3
        gap-2
      "
    >
      {items.map(
        (
          item
        ) => {
          const active =
            item.id <=
            current;


          return (
            <div
              key={
                item.id
              }
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
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
                        ? "border-[#9d574c] bg-[#60231f] text-[#f1ded4]"
                        : "border-white/[0.08] bg-white/[0.02] text-white/30"
                    }
                  `}
                >
                  {item.id <
                  current ? (
                    <Check
                      size={16}
                    />
                  ) : (
                    fa(
                      item.id
                    )
                  )}
                </div>

                <div
                  className={`
                    hidden
                    text-[13px]
                    font-black
                    sm:block

                    ${
                      active
                        ? "text-[#d6c6bc]"
                        : "text-[#5f5854]"
                    }
                  `}
                >
                  {item.title}
                </div>
              </div>

              <div
                className={`
                  mt-3 h-[2px]
                  rounded-full

                  ${
                    active
                      ? "bg-[#71332c]"
                      : "bg-white/[0.05]"
                  }
                `}
              />
            </div>
          );
        }
      )}
    </div>
  );
}


function StepOne({
  shows,
  loading,
  selectedId,
  onSelect,
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
        description="شب موردنظر و تعداد بلیت را مشخص کنید."
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
                        ? "cursor-not-allowed opacity-40"
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


      {selectedId && (
        <div
          className="
            mt-6
            flex
            items-center
            justify-between
            gap-4
            rounded-[20px]
            border
            border-white/[0.06]
            bg-black/20
            p-4
          "
        >
          <div>
            <div
              className="
                text-[12px]
                text-[#776e68]
              "
            >
              تعداد بلیت
            </div>

            <div
              className="
                mt-1
                text-[14px]
                font-bold
                text-[#a89d96]
              "
            >
              حداکثر بر اساس ظرفیت باقی‌مانده
            </div>
          </div>


          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <button
              type="button"
              onClick={() =>
                setCount(
                  Math.max(
                    1,
                    count -
                      1
                  )
                )
              }
              className="
                flex h-10 w-10
                items-center
                justify-center
                rounded-full
                border
                border-[#553830]
                bg-[#140d0c]
              "
            >
              <Minus
                size={17}
              />
            </button>

            <div
              className="
                min-w-8
                text-center
                text-[21px]
                font-black
              "
            >
              {fa(
                count
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setCount(
                  Math.min(
                    Math.max(
                      1,
                      remaining
                    ),
                    count +
                      1
                  )
                )
              }
              className="
                flex h-10 w-10
                items-center
                justify-center
                rounded-full
                border
                border-[#72453b]
                bg-[#3a1815]
              "
            >
              <Plus
                size={17}
              />
            </button>
          </div>
        </div>
      )}


      <PrimaryButton
        onClick={
          onNext
        }
      >
        ادامه و ثبت اطلاعات
      </PrimaryButton>
    </>
  );
}


function StepTwo({
  form,
  setForm,
  onBack,
  onNext,
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
          placeholder="مثلاً امیر خاک‌دوست"
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
          compact
        >
          مرور رزرو
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
    <>
      <SectionTitle
        icon={
          BadgeCheck
        }
        title="تأیید نهایی"
        description="قبل از ثبت نهایی، اطلاعات رزرو را بررسی کنید."
      />


      <div
        className="
          mt-6
          divide-y
          divide-white/[0.055]
          rounded-[20px]
          border
          border-white/[0.06]
          bg-black/20
          px-5
        "
      >
        <ReviewRow
          label="اجرا"
          value={
            selected
              ?.label ||
            "—"
          }
        />

        <ReviewRow
          label="تاریخ"
          value={fa(
            selected
              ?.date
          )}
        />

        <ReviewRow
          label="ساعت"
          value={fa(
            selected
              ?.time
          )}
        />

        <ReviewRow
          label="تعداد بلیت"
          value={fa(
            count
          )}
        />

        <ReviewRow
          label="نام"
          value={
            form.name
          }
        />

        <ReviewRow
          label="موبایل"
          value={fa(
            form.phone
          )}
        />

        <ReviewRow
          label="کد ملی"
          value="ثبت شده"
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
          ویرایش
        </SecondaryButton>

        <PrimaryButton
          onClick={
            onSubmit
          }
          disabled={
            submitting
          }
          compact
        >
          {submitting
            ? "در حال ثبت..."
            : "ثبت نهایی رزرو"}
        </PrimaryButton>
      </div>
    </>
  );
}


function BookingSummary({
  selected,
  count,
}) {
  if (!selected) {
    return (
      <aside
        className="
          h-fit
          rounded-[26px]
          border
          border-white/[0.05]
          bg-[#0a0908]
          p-6
        "
      >
        <Ticket
          size={24}
          className="text-[#825046]"
        />

        <div
          className="
            mt-4
            text-[17px]
            font-black
          "
        >
          خلاصه رزرو
        </div>

        <p
          className="
            mt-2
            text-[13px]
            leading-6
            text-[#766e69]
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
      className="
        h-fit
        rounded-[26px]
        border
        border-[#51352f]
        bg-[#0d0a09]
        p-6
        lg:sticky
        lg:top-6
      "
    >
      <div
        className="
          text-[12px]
          font-black
          text-[#98554b]
        "
      >
        نمایش «بیرق ماندگار»
      </div>

      <div
        className="
          mt-2
          text-[25px]
          font-black
          text-[#eee2d9]
        "
      >
        {selected.label}
      </div>


      <div
        className="
          mt-5
          space-y-3
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

        <SummaryItem
          icon={
            Ticket
          }
          label="تعداد بلیت"
          value={fa(
            count
          )}
        />
      </div>


      <div
        className="
          mt-5
          border-t
          border-white/[0.06]
          pt-4
          text-[13px]
          font-bold
          text-[#7eb08d]
        "
      >
        {fa(
          remaining
        )} صندلی در این لحظه باقی مانده
      </div>
    </aside>
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
            size={19}
          />
        </div>

        <h2
          className="
            text-[21px]
            font-black
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
          text-[13px]
          font-black
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
          size={19}
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
            text-[15px]
            font-bold
            text-[#eee4dc]
            outline-none
            placeholder:text-[#504b47]
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
          text-[13px]
          text-[#776e68]
        "
      >
        {label}
      </span>

      <span
        className="
          text-left
          text-[14px]
          font-black
          text-[#ded2ca]
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
        size={18}
        className="
          text-[#a65e51]
        "
      />

      <div>
        <div
          className="
            text-[10px]
            text-[#685f5a]
          "
        >
          {label}
        </div>

        <div
          className="
            mt-0.5
            text-[14px]
            font-black
            text-[#cfc2b9]
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