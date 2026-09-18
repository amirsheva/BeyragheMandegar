import {
  useEffect,
  useState,
} from "react";

import {
  Check,
  Copy,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminPageHeader,
  AdminStatusBadge,
} from "./ui/AdminPrimitives";

import {
  toFaDigits,
} from "./ui/formatFa";

import "./customer-otp-tester.css";


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
          "۰۱۲۳۴۵۶۷۸۹"
            .indexOf(
              char
            )
        )
    )
    .replace(
      /[٠-٩]/g,
      (char) =>
        String(
          "٠١٢٣٤٥٦٧٨٩"
            .indexOf(
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
  )
    .replace(
      /\D/g,
      ""
    )
    .slice(
      0,
      11
    );
}


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


export default function CustomerOtpTester() {
  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    status,
    setStatus,
  ] =
    useState(null);

  const [
    result,
    setResult,
  ] =
    useState(null);

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

  const [
    copied,
    setCopied,
  ] =
    useState(false);


  useEffect(
    () => {
      let active =
        true;

      async function loadStatus() {
        try {
          const data =
            await readJson(
              await fetch(
                "/api/admin/customer/test-otp/status",
                {
                  cache:
                    "no-store",

                  credentials:
                    "include",
                }
              )
            );

          if (active) {
            setStatus(
              data
            );
          }

        } catch (err) {
          if (active) {
            setError(
              err.message
            );
          }
        }
      }

      loadStatus();

      return () => {
        active =
          false;
      };
    },
    []
  );


  async function generate(
    event
  ) {
    event.preventDefault();

    const normalized =
      cleanPhone(
        phone
      );

    if (
      !/^09\d{9}$/.test(
        normalized
      )
    ) {
      setError(
        "شماره موبایل معتبر وارد کنید."
      );

      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    setCopied(false);

    try {
      const data =
        await readJson(
          await fetch(
            "/api/admin/customer/test-otp",
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
                  phone:
                    normalized,
                }),
            }
          )
        );

      setPhone(
        normalized
      );

      setResult(
        data
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setBusy(false);
    }
  }


  async function copyCode() {
    if (
      !result?.code
    ) {
      return;
    }

    try {
      await navigator
        .clipboard
        .writeText(
          result.code
        );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(
            false
          ),
        1500
      );

    } catch {
      setError(
        "کپی خودکار انجام نشد. کد را دستی کپی کنید."
      );
    }
  }


  const enabled =
    Boolean(
      status?.enabled
    );

  const providerReady =
    status?.provider ===
    "noop";

  const portalReady =
    Boolean(
      status
        ?.customerPortalEnabled
    );


  return (
    <div
      dir="rtl"
      className="customer-otp-tester"
    >
      <AdminPageHeader
        eyebrow="ابزار موقت تست"
        eyebrowIcon={
          KeyRound
        }
        title="OTP تست رزروهای من"
        description="برای تست ورود به «رزروهای من»، کد موقت همان درخواست را از داخل پنل مدیریت بسازید."
        actions={
          <AdminStatusBadge
            tone={
              enabled &&
              providerReady &&
              portalReady
                ? "success"
                : "danger"
            }
          >
            {enabled &&
            providerReady &&
            portalReady
              ? "آماده تست"
              : "غیرفعال"}
          </AdminStatusBadge>
        }
      />


      {error && (
        <div className="customer-otp-tester__message is-error">
          {error}
        </div>
      )}


      <div className="customer-otp-tester__layout">

        <AdminCard className="customer-otp-tester__card">
          <div className="customer-otp-tester__card-head">
            <div className="customer-otp-tester__icon">
              <KeyRound
                size={22}
              />
            </div>

            <div>
              <span>
                تولید کد برای آخرین درخواست
              </span>

              <h2>
                ساخت OTP تست
              </h2>
            </div>
          </div>


          <div className="customer-otp-tester__notice">
            ابتدا کاربر در صفحه «رزروهای من» شماره موبایل را وارد کرده و روی «دریافت کد تأیید» بزند. سپس همان شماره را اینجا وارد کنید.
          </div>


          <form
            onSubmit={
              generate
            }
            className="customer-otp-tester__form"
          >
            <AdminField
              label="شماره موبایل"
              hint="شماره‌ای که در رزروهای من وارد شده است"
            >
              <input
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                value={
                  phone
                }
                onChange={
                  (event) => {
                    setPhone(
                      cleanPhone(
                        event
                          .target
                          .value
                      )
                    );

                    setResult(
                      null
                    );

                    setError(
                      ""
                    );
                  }
                }
                placeholder="09121234567"
                className="customer-otp-tester__input"
              />
            </AdminField>


            <AdminButton
              type="submit"
              icon={
                KeyRound
              }
              disabled={
                busy ||
                !enabled ||
                !providerReady ||
                !portalReady
              }
            >
              {busy
                ? "در حال ساخت کد..."
                : "ساخت کد تست"}
            </AdminButton>
          </form>


          {result?.code && (
            <div className="customer-otp-tester__result">
              <div>
                <span>
                  کد موقت
                </span>

                <strong
                  dir="ltr"
                  lang="en"
                >
                  {result.code}
                </strong>
              </div>

              <AdminButton
                type="button"
                tone="ghost"
                icon={
                  copied
                    ? Check
                    : Copy
                }
                onClick={
                  copyCode
                }
              >
                {copied
                  ? "کپی شد"
                  : "کپی کد"}
              </AdminButton>

              <p>
                این کد برای شماره{" "}
                <b
                  dir="ltr"
                  lang="en"
                >
                  {result.phoneMasked}
                </b>{" "}
                ساخته شده و حدود{" "}
                {toFaDigits(
                  result
                    .expiresInSeconds
                )}{" "}
                ثانیه اعتبار دارد.
              </p>
            </div>
          )}
        </AdminCard>


        <AdminCard className="customer-otp-tester__card customer-otp-tester__status-card">
          <div className="customer-otp-tester__card-head">
            <div className="customer-otp-tester__icon">
              <ShieldCheck
                size={22}
              />
            </div>

            <div>
              <span>
                وضعیت ایمنی
              </span>

              <h2>
                کنترل ابزار تست
              </h2>
            </div>
          </div>


          <div className="customer-otp-tester__status-row">
            <span>
              ابزار Admin
            </span>

            <AdminStatusBadge
              tone={
                enabled
                  ? "success"
                  : "danger"
              }
            >
              {enabled
                ? "فعال"
                : "غیرفعال"}
            </AdminStatusBadge>
          </div>


          <div className="customer-otp-tester__status-row">
            <span>
              OTP Provider
            </span>

            <AdminStatusBadge
              tone={
                providerReady
                  ? "success"
                  : "danger"
              }
            >
              {status?.provider ||
                "نامشخص"}
            </AdminStatusBadge>
          </div>


          <div className="customer-otp-tester__status-row">
            <span>
              رزروهای من
            </span>

            <AdminStatusBadge
              tone={
                portalReady
                  ? "success"
                  : "danger"
              }
            >
              {portalReady
                ? "فعال"
                : "غیرفعال"}
            </AdminStatusBadge>
          </div>


          <div className="customer-otp-tester__security-note">
            کد خام در دیتابیس ذخیره نمی‌شود و فقط همین لحظه در پنل مدیریت نمایش داده می‌شود. بعد از فعال‌شدن SMS واقعی، این ابزار باید غیرفعال شود.
          </div>
        </AdminCard>

      </div>
    </div>
  );
}
