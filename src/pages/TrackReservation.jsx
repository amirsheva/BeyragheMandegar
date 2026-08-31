import {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowLeft,
  Home,
  LoaderCircle,
  Search,
  ShieldCheck,
  Ticket,
  XCircle,
} from "lucide-react";


function normalizeTrackingCode(
  value
) {
  const persianDigits =
    "۰۱۲۳۴۵۶۷۸۹";

  const arabicDigits =
    "٠١٢٣٤٥٦٧٨٩";


  return String(
    value || ""
  )
    .trim()
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          persianDigits.indexOf(
            digit
          )
        )
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          arabicDigits.indexOf(
            digit
          )
        )
    )
    .toUpperCase()
    .replace(
      /\s+/g,
      ""
    );
}


function isValidTrackingCode(
  value
) {
  return (
    value.length >= 6 &&
    value.length <= 100 &&
    /^[A-Z0-9-]+$/.test(
      value
    )
  );
}


export default function TrackReservation() {
  const navigate =
    useNavigate();


  const [
    trackingCode,
    setTrackingCode,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    if (loading) {
      return;
    }


    const cleanCode =
      normalizeTrackingCode(
        trackingCode
      );


    setTrackingCode(
      cleanCode
    );

    setError("");


    if (
      !cleanCode
    ) {
      setError(
        "کد پیگیری را وارد کنید."
      );

      return;
    }


    if (
      !isValidTrackingCode(
        cleanCode
      )
    ) {
      setError(
        "فرمت کد پیگیری معتبر نیست."
      );

      return;
    }


    try {
      setLoading(true);


      const response =
        await fetch(
          `/api/tickets/${encodeURIComponent(
            cleanCode
          )}`,
          {
            cache:
              "no-store",
          }
        );


      const data =
        await response.json().catch(
          () => ({})
        );


      if (
        response.status ===
        404
      ) {
        throw new Error(
          "رزروی با این کد پیگیری پیدا نشد."
        );
      }


      if (
        response.status ===
        429
      ) {
        throw new Error(
          "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید."
        );
      }


      if (
        !response.ok ||
        !data?.ticket
      ) {
        throw new Error(
          data?.message ||
          "امکان دریافت اطلاعات رزرو وجود ندارد."
        );
      }


      navigate(
        `/ticket/${encodeURIComponent(
          cleanCode
        )}`
      );

    } catch (err) {
      setError(
        err?.message ||
        "خطا در پیگیری رزرو."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <main
      dir="rtl"
      className="
        mx-auto
        min-h-[70vh]
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
            py-7
            sm:px-7
            sm:py-8
          "
        >
          <div
            className="
              flex
              items-start
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
                border-[#66362f]
                bg-[#331713]
              "
            >
              <Search
                size={22}
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
                  text-2xl
                  font-black
                  text-[#eadfd9]
                  sm:text-3xl
                "
              >
                پیگیری رزرو
              </h1>

              <p
                className="
                  mt-3
                  max-w-xl
                  text-sm
                  leading-7
                  text-white/45
                "
              >
                کد پیگیری دریافت‌شده هنگام
                رزرو را وارد کنید تا وضعیت
                بلیت و اطلاعات اجرای خود را
                مشاهده کنید.
              </p>
            </div>
          </div>
        </div>


        <div
          className="
            px-5
            py-7
            sm:px-7
            sm:py-9
          "
        >
          <form
            onSubmit={
              handleSubmit
            }
          >
            <label
              htmlFor="tracking-code"
              className="
                block
                text-xs
                font-black
                text-[#d6c6bc]
              "
            >
              کد پیگیری
            </label>


            <div
              className="
                mt-3
                rounded-[22px]
                border
                border-[#4d3530]
                bg-[#070606]
                p-2
                transition
                focus-within:border-[#98574c]
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
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#140d0c]
                    text-[#a7655a]
                  "
                >
                  <Ticket
                    size={19}
                  />
                </div>


                <input
                  id="tracking-code"
                  type="text"
                  dir="ltr"
                  lang="en"
                  data-keep-latin-digits="true"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck="false"
                  value={
                    trackingCode
                  }
                  onChange={
                    (event) => {
                      setTrackingCode(
                        event.target.value
                      );

                      if (error) {
                        setError("");
                      }
                    }
                  }
                  placeholder="BM-..."
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    px-1
                    py-3
                    text-left
                    font-mono
                    text-sm
                    font-black
                    tracking-wide
                    text-[#eadfd9]
                    outline-none
                    placeholder:text-white/20
                    sm:text-base
                  "
                />
              </div>
            </div>


            <div
              className="
                mt-3
                flex
                items-start
                gap-2
                text-[11px]
                leading-6
                text-white/35
              "
            >
              <ShieldCheck
                size={14}
                className="
                  mt-1
                  shrink-0
                  text-[#8c554a]
                "
              />

              <span>
                برای پیگیری رزرو فقط کد
                پیگیری لازم است؛ نیازی به
                وارد کردن شماره موبایل یا
                کد ملی نیست.
              </span>
            </div>


            {error && (
              <div
                role="alert"
                className="
                  mt-5
                  flex
                  items-start
                  gap-3
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
                <XCircle
                  size={17}
                  className="
                    mt-1
                    shrink-0
                  "
                />

                <span>
                  {error}
                </span>
              </div>
            )}


            <button
              type="submit"
              disabled={
                loading
              }
              className="
                mt-7
                inline-flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-full
                border
                border-[#98574c]
                bg-gradient-to-l
                from-[#57211e]
                to-[#7a2d28]
                px-6
                py-3.5
                text-sm
                font-black
                text-[#f5e6dd]
                shadow-lg
                transition
                hover:border-[#bb7062]
                hover:from-[#652420]
                hover:to-[#8b352f]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="
                      animate-spin
                    "
                  />

                  در حال بررسی...
                </>
              ) : (
                <>
                  مشاهده رزرو
                  <ArrowLeft
                    size={17}
                  />
                </>
              )}
            </button>
          </form>


          <div
            className="
              mt-8
              border-t
              border-white/[0.06]
              pt-6
              text-center
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
              <Home
                size={14}
              />

              بازگشت به صفحه اصلی
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}