import {
  useState,
} from "react";

import {
  Beaker,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";

import {
  AdminButton,
  AdminField,
} from "./ui/AdminPrimitives";

import {
  faNumber,
  toEnDigits,
  toFaDigits,
} from "./ui/formatFa";

import {
  sendSmsirSandboxVerify,
} from "./api/smsApi";


function deliveryLabel(
  value
) {
  const map = {
    1: "رسیده",
    2: "نرسیده به گوشی",
    3: "رسیده به مخابرات",
    4: "نرسیده به مخابرات",
    5: "رسیده به اپراتور",
    6: "ناموفق",
    7: "لیست سیاه",
    8: "نامشخص",
  };

  return (
    map[
      Number(value)
    ] ||
    "در انتظار"
  );
}


export default function SmsSandboxTester({
  onCompleted,
  onError,
}) {
  const [
    phone,
    setPhone,
  ] = useState(
    "09120000000"
  );

  const [
    code,
    setCode,
  ] = useState(
    "12345"
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    result,
    setResult,
  ] = useState(null);


  async function submit(
    event
  ) {
    event.preventDefault();

    setResult(null);

    try {
      setLoading(true);

      const data =
        await sendSmsirSandboxVerify({
          phone:
            toEnDigits(
              phone
            ),
          code:
            toEnDigits(
              code
            ),
        });

      setResult(
        data
      );

      if (
        onCompleted
      ) {
        await onCompleted(
          data
        );
      }

    } catch (error) {
      if (onError) {
        onError(
          error.message
        );
      }

    } finally {
      setLoading(false);
    }
  }


  return (
    <section className="sms-panel sms-sandbox">
      <div className="sms-panel-header">
        <div>
          <div className="sms-section-eyebrow">
            <Beaker
              size={18}
              strokeWidth={1.8}
            />

            محیط آزمایشی SMS.ir
          </div>

          <h3>
            تست ارتباط با سرویس
          </h3>

          <p>
            درخواست به محیط Sandbox ارسال می‌شود؛ پیام واقعی ارسال نمی‌شود و اعتبار عملیاتی مصرف نخواهد شد.
          </p>
        </div>

        <span className="sms-safe-chip">
          <ShieldCheck
            size={17}
            strokeWidth={1.8}
          />

          محیط امن تست
        </span>
      </div>


      <form
        onSubmit={submit}
        className="sms-form-stack"
      >
        <div className="sms-two-cols">
          <AdminField
            label="شماره موبایل تست"
          >
            <input
              inputMode="numeric"
              dir="ltr"
              value={
                toFaDigits(
                  phone
                )
              }
              onChange={
                (event) =>
                  setPhone(
                    toEnDigits(
                      event
                        .target
                        .value
                    )
                  )
              }
            />
          </AdminField>


          <AdminField
            label="کد تست"
          >
            <input
              inputMode="numeric"
              dir="ltr"
              maxLength={25}
              value={
                toFaDigits(
                  code
                )
              }
              onChange={
                (event) =>
                  setCode(
                    toEnDigits(
                      event
                        .target
                        .value
                    )
                  )
              }
            />
          </AdminField>
        </div>


        <div className="sms-form-actions">
          <AdminButton
            type="submit"
            tone="primary"
            icon={Send}
            disabled={
              loading
            }
          >
            {loading
              ? "در حال ارتباط..."
              : "اجرای تست Sandbox"}
          </AdminButton>
        </div>
      </form>


      {result && (
        <div className="sms-sandbox-result">
          <div className="sms-sandbox-result__title">
            <CheckCircle2
              size={19}
            />

            پاسخ سرویس دریافت شد
          </div>

          <div className="sms-result-grid">
            <ResultItem
              label="رکورد داخلی"
              value={
                `#${faNumber(
                  result.id
                )}`
              }
            />

            <ResultItem
              label="شناسه پیام"
              value={
                toFaDigits(
                  result.providerMessageId ||
                  "—"
                )
              }
            />

            <ResultItem
              label="وضعیت داخلی"
              value={
                toFaDigits(
                  result.status
                )
              }
            />

            <ResultItem
              label="وضعیت تحویل"
              value={
                deliveryLabel(
                  result.deliveryState
                )
              }
            />

            <ResultItem
              label="هزینه شبیه‌سازی‌شده"
              value={
                `${faNumber(
                  result.actualCost ||
                  0
                )} ریال`
              }
            />

            <ResultItem
              label="تعداد تلاش"
              value={
                faNumber(
                  result.attemptCount ||
                  0
                )
              }
            />
          </div>
        </div>
      )}
    </section>
  );
}


function ResultItem({
  label,
  value,
}) {
  return (
    <div className="sms-result-item">
      <span>
        {label}
      </span>

      <strong>
        {toFaDigits(
          value
        )}
      </strong>
    </div>
  );
}
