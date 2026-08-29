import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageSquareText,
  RefreshCw,
  Send,
  Settings2,
  XCircle,
} from "lucide-react";

import SmsSandboxTester from "./SmsSandboxTester";
import SmsMessagesTable from "./SmsMessagesTable";

import {
  AdminButton,
  AdminEmptyState,
  AdminField,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
} from "./ui/AdminPrimitives";

import {
  faNumber,
  faPercent,
  toEnDigits,
  toFaDigits,
} from "./ui/formatFa";

import {
  getSmsDashboard,
  getSmsMessages,
  getSmsTemplates,
  refreshSmsDelivery,
  retrySms,
  sendSms,
  updateSmsTemplate,
} from "./api/smsApi";

import "./sms-manager.css";


const TABS = [
  {
    key: "dashboard",
    title: "داشبورد",
    icon: Activity,
  },
  {
    key: "send",
    title: "ارسال پیامک",
    icon: Send,
  },
  {
    key: "messages",
    title: "پیام‌ها",
    icon: MessageSquareText,
  },
  {
    key: "templates",
    title: "قالب‌ها",
    icon: FileText,
  },
];


function statusLabel(
  status
) {
  const map = {
    queued: "در صف",
    sent: "ارسال‌شده",
    delivered: "تحویل‌شده",
    failed: "ناموفق",
  };

  return (
    map[status] ||
    status ||
    "نامشخص"
  );
}


function statusTone(
  status
) {
  if (
    status === "sent" ||
    status === "delivered"
  ) {
    return "success";
  }

  if (
    status === "failed"
  ) {
    return "danger";
  }

  if (
    status === "queued"
  ) {
    return "accent";
  }

  return "neutral";
}


export default function SmsManager() {
  const [tab, setTab] =
    useState("dashboard");

  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    messages,
    setMessages,
  ] = useState([]);

  const [
    templates,
    setTemplates,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshingId,
    setRefreshingId,
  ] = useState(null);

  const [
    notice,
    setNotice,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      const [
        dashboardData,
        messageData,
        templateData,
      ] =
        await Promise.all([
          getSmsDashboard(),
          getSmsMessages(),
          getSmsTemplates(),
        ]);

      setDashboard(
        dashboardData
      );

      setMessages(
        Array.isArray(
          messageData
        )
          ? messageData
          : []
      );

      setTemplates(
        Array.isArray(
          templateData
        )
          ? templateData
          : []
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAll();
  }, []);


  if (loading) {
    return (
      <div
        className="sms-loading"
        dir="rtl"
      >
        <RefreshCw
          size={22}
          className="animate-spin"
        />

        <span>
          در حال بارگذاری مرکز پیامک...
        </span>
      </div>
    );
  }


  return (
    <div
      dir="rtl"
      className="sms-manager"
    >
      <AdminPageHeader
        eyebrow="پیامک و اطلاع‌رسانی"
        eyebrowIcon={
          MessageSquareText
        }
        title="مرکز پیامک"
        description="ارسال، پایش، مدیریت قالب‌ها و بررسی وضعیت پیام‌های سامانه"
        actions={
          <>
            <div className="sms-provider-chip">
              پیش‌فرض: NOOP
              <span>•</span>
              تست: SMS.ir Sandbox
            </div>

            <AdminButton
              tone="ghost"
              icon={RefreshCw}
              onClick={loadAll}
            >
              بروزرسانی
            </AdminButton>
          </>
        }
      />


      {(notice || error) && (
        <div
          className={[
            "sms-notice",
            error
              ? "is-error"
              : "is-success",
          ].join(" ")}
        >
          {toFaDigits(
            error || notice
          )}
        </div>
      )}


      <nav
        className="sms-tabs"
        aria-label="بخش‌های مرکز پیامک"
      >
        {TABS.map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setTab(
                    item.key
                  )
                }
                className={[
                  "sms-tab",
                  active
                    ? "is-active"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icon
                  size={18}
                  strokeWidth={1.8}
                />

                <span>
                  {item.title}
                </span>
              </button>
            );
          }
        )}
      </nav>


      <div className="sms-content">
        {tab ===
          "dashboard" && (
          <DashboardTab
            data={
              dashboard
            }
          />
        )}


        {tab === "send" && (
          <div className="sms-send-stack">
            <SmsSandboxTester
              onCompleted={
                async () => {
                  setNotice(
                    "تست Sandbox با موفقیت انجام شد."
                  );

                  setError("");

                  await loadAll();
                }
              }
              onError={
                (message) => {
                  setError(
                    message
                  );

                  setNotice("");
                }
              }
            />

            <SendTab
              onSuccess={
                async (
                  message
                ) => {
                  setNotice(
                    message
                  );

                  setError("");

                  await loadAll();

                  setTab(
                    "messages"
                  );
                }
              }
              onError={
                (message) => {
                  setError(
                    message
                  );

                  setNotice("");
                }
              }
            />
          </div>
        )}


        {tab ===
          "messages" && (
          <SmsMessagesTable
            items={
              messages
            }
            refreshingId={
              refreshingId
            }
            onRefreshDelivery={
              async (
                id
              ) => {
                try {
                  setRefreshingId(
                    id
                  );

                  setError("");
                  setNotice("");

                  await refreshSmsDelivery(
                    id
                  );

                  setNotice(
                    "وضعیت تحویل پیام بروزرسانی شد."
                  );

                  await loadAll();

                } catch (err) {
                  setError(
                    err.message
                  );

                } finally {
                  setRefreshingId(
                    null
                  );
                }
              }
            }
            onRetry={
              async (
                id
              ) => {
                try {
                  setError("");
                  setNotice("");

                  await retrySms(
                    id
                  );

                  setNotice(
                    "ارسال مجدد پیام ثبت شد."
                  );

                  await loadAll();

                } catch (err) {
                  setError(
                    err.message
                  );
                }
              }
            }
          />
        )}


        {tab ===
          "templates" && (
          <TemplatesTab
            items={
              templates
            }
            onSaved={
              async () => {
                setNotice(
                  "قالب پیامک ذخیره شد."
                );

                setError("");

                await loadAll();
              }
            }
            onError={
              (message) => {
                setError(
                  message
                );

                setNotice("");
              }
            }
          />
        )}
      </div>
    </div>
  );
}


function DashboardTab({
  data,
}) {
  const totals =
    data?.totals ||
    {};

  const metrics = [
    {
      label:
        "کل پیام‌ها",
      value:
        faNumber(
          totals.total || 0
        ),
      icon:
        MessageSquareText,
    },
    {
      label:
        "در صف",
      value:
        faNumber(
          totals.queued || 0
        ),
      icon:
        Clock3,
    },
    {
      label:
        "موفق",
      value:
        faNumber(
          Number(
            totals.sent || 0
          ) +
          Number(
            totals.delivered || 0
          )
        ),
      icon:
        CheckCircle2,
      tone:
        "success",
    },
    {
      label:
        "ناموفق",
      value:
        faNumber(
          totals.failed || 0
        ),
      icon:
        XCircle,
      tone:
        "danger",
    },
    {
      label:
        "نرخ موفقیت",
      value:
        faPercent(
          totals.successRate ||
          0
        ),
      icon:
        Activity,
    },
    {
      label:
        "هزینه واقعی",
      value:
        `${faNumber(
          totals.actualCost ||
          0
        )} ریال`,
      icon:
        CircleDollarSign,
    },
  ];


  return (
    <>
      <div className="sms-metrics">
        {metrics.map(
          (item) => (
            <AdminMetricCard
              key={
                item.label
              }
              title={
                item.label
              }
              value={
                item.value
              }
              icon={
                item.icon
              }
              tone={
                item.tone ||
                "default"
              }
            />
          )
        )}
      </div>


      <section className="sms-panel sms-recent-panel">
        <div className="sms-panel-header">
          <div>
            <h3>
              آخرین پیام‌ها
            </h3>

            <p>
              آخرین فعالیت‌های ثبت‌شده در سامانه پیامک
            </p>
          </div>
        </div>


        {(
          data?.recent ||
          []
        ).length === 0 ? (
          <AdminEmptyState
            icon={
              MessageSquareText
            }
            title="هنوز پیامی ثبت نشده است"
            description="پس از ثبت اولین ارسال، آخرین پیام‌ها در این بخش نمایش داده می‌شوند."
          />

        ) : (
          <div className="sms-recent-list">
            {(
              data?.recent ||
              []
            ).map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="sms-recent-item"
                >
                  <div className="sms-recent-copy">
                    <strong>
                      {toFaDigits(
                        item.phone
                      )}
                    </strong>

                    <span>
                      {toFaDigits(
                        item.message ||
                        "پیام ثبت‌شده"
                      )}
                    </span>
                  </div>

                  <div className="sms-recent-meta">
                    {item.provider && (
                      <span className="sms-provider-name">
                        {toFaDigits(
                          item.provider
                        )}
                      </span>
                    )}

                    <AdminStatusBadge
                      tone={
                        statusTone(
                          item.status
                        )
                      }
                    >
                      {statusLabel(
                        item.status
                      )}
                    </AdminStatusBadge>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}


function SendTab({
  onSuccess,
  onError,
}) {
  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);


  async function submit(
    event
  ) {
    event.preventDefault();

    try {
      setSending(true);

      const result =
        await sendSms({
          phone:
            toEnDigits(
              phone
            ),
          message:
            toEnDigits(
              message
            ),
        });

      setPhone("");
      setMessage("");

      await onSuccess(
        `پیام ثبت شد؛ وضعیت: ${statusLabel(
          result.status
        )}`
      );

    } catch (err) {
      onError(
        err.message
      );

    } finally {
      setSending(false);
    }
  }


  return (
    <form
      onSubmit={submit}
      className="sms-panel sms-send-form"
    >
      <div className="sms-panel-header">
        <div>
          <h3>
            ارسال پیامک تکی
          </h3>

          <p>
            در وضعیت فعلی Provider پیش‌فرض روی NOOP است و ارسال واقعی انجام نمی‌شود.
          </p>
        </div>

        <Send
          size={22}
          className="sms-panel-icon"
        />
      </div>


      <div className="sms-form-stack">
        <AdminField
          label="شماره موبایل"
          hint="شماره گیرنده را وارد کنید."
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
            placeholder="۰۹۱۲..."
            required
          />
        </AdminField>


        <AdminField
          label="متن پیامک"
        >
          <textarea
            rows={7}
            value={
              toFaDigits(
                message
              )
            }
            onChange={
              (event) =>
                setMessage(
                  event
                    .target
                    .value
                )
            }
            placeholder="متن پیامک..."
            required
          />
        </AdminField>
      </div>


      <div className="sms-form-actions">
        <AdminButton
          type="submit"
          tone="primary"
          icon={Send}
          disabled={
            sending
          }
        >
          {sending
            ? "در حال ثبت..."
            : "ثبت ارسال آزمایشی"}
        </AdminButton>
      </div>
    </form>
  );
}


function TemplatesTab({
  items,
  onSaved,
  onError,
}) {
  if (
    !items.length
  ) {
    return (
      <AdminEmptyState
        icon={FileText}
        title="قالبی ثبت نشده است"
        description="قالب‌های پیامک پس از تعریف در سامانه در این بخش نمایش داده می‌شوند."
      />
    );
  }


  return (
    <div className="sms-template-grid">
      {items.map(
        (item) => (
          <TemplateCard
            key={
              item.id
            }
            item={
              item
            }
            onSaved={
              onSaved
            }
            onError={
              onError
            }
          />
        )
      )}
    </div>
  );
}


function TemplateCard({
  item,
  onSaved,
  onError,
}) {
  const [
    title,
    setTitle,
  ] = useState(
    item.title || ""
  );

  const [
    body,
    setBody,
  ] = useState(
    item.body || ""
  );

  const [
    status,
    setStatus,
  ] = useState(
    item.status ||
    "active"
  );

  const [
    providerMethod,
    setProviderMethod,
  ] = useState(
    item.provider_method ||
    ""
  );

  const [
    providerTemplateId,
    setProviderTemplateId,
  ] = useState(
    item.provider_template_id ||
    ""
  );

  const [
    saving,
    setSaving,
  ] = useState(false);


  let parameterMap = {};

  try {
    parameterMap =
      item.provider_parameters_json
        ? JSON.parse(
            item.provider_parameters_json
          )
        : {};
  } catch {
    parameterMap = {};
  }


  const mappingReady =
    providerMethod ===
      "verify"
      ? Boolean(
          providerTemplateId
        )
      : Boolean(
          providerMethod
        );


  async function save() {
    try {
      setSaving(true);

      await updateSmsTemplate(
        item.id,
        {
          title,
          body,
          status,

          provider_method:
            providerMethod ||
            null,

          provider_template_id:
            providerTemplateId
              ? toEnDigits(
                  providerTemplateId
                )
              : null,
        }
      );

      await onSaved();

    } catch (err) {
      onError(
        err.message
      );

    } finally {
      setSaving(false);
    }
  }


  return (
    <article className="sms-panel sms-template-card">
      <div className="sms-template-head">
        <div>
          <div className="sms-template-key">
            {toFaDigits(
              item.key
            )}
          </div>

          <h3>
            {toFaDigits(
              title ||
              "قالب پیامک"
            )}
          </h3>

          <div className="sms-template-badges">
            <AdminStatusBadge
              tone="neutral"
            >
              {item.is_system
                ? "قالب سیستمی"
                : "قالب سفارشی"}
            </AdminStatusBadge>

            <AdminStatusBadge
              tone={
                mappingReady
                  ? "success"
                  : "accent"
              }
            >
              {mappingReady
                ? "اتصال Provider کامل"
                : "اتصال Provider ناقص"}
            </AdminStatusBadge>
          </div>
        </div>

        <Settings2
          size={21}
          className="sms-panel-icon"
        />
      </div>


      <div className="sms-form-stack">
        <AdminField
          label="عنوان قالب"
        >
          <input
            value={
              toFaDigits(
                title
              )
            }
            onChange={
              (event) =>
                setTitle(
                  event
                    .target
                    .value
                )
            }
          />
        </AdminField>


        <AdminField
          label="متن قالب"
        >
          <textarea
            rows={8}
            value={
              toFaDigits(
                body
              )
            }
            onChange={
              (event) =>
                setBody(
                  event
                    .target
                    .value
                )
            }
          />
        </AdminField>


        <div className="sms-provider-box">
          <div className="sms-provider-box__title">
            اتصال به SMS.ir
          </div>

          <div className="sms-provider-fields">
            <AdminField
              label="روش ارسال"
            >
              <select
                value={
                  providerMethod
                }
                onChange={
                  (event) =>
                    setProviderMethod(
                      event
                        .target
                        .value
                    )
                }
              >
                <option value="">
                  تعیین نشده
                </option>

                <option value="verify">
                  Verify
                </option>

                <option value="bulk">
                  Bulk
                </option>

                <option value="likeToLike">
                  Like To Like
                </option>
              </select>
            </AdminField>


            <AdminField
              label="شناسه قالب SMS.ir"
            >
              <input
                type="text"
                inputMode="numeric"
                dir="ltr"
                disabled={
                  providerMethod !==
                  "verify"
                }
                value={
                  toFaDigits(
                    providerTemplateId
                  )
                }
                onChange={
                  (event) =>
                    setProviderTemplateId(
                      toEnDigits(
                        event
                          .target
                          .value
                      )
                    )
                }
                placeholder={
                  providerMethod ===
                    "verify"
                    ? "شناسه قالب"
                    : "فقط برای Verify"
                }
              />
            </AdminField>
          </div>


          {Object.keys(
            parameterMap
          ).length > 0 && (
            <div className="sms-parameter-area">
              <div className="sms-parameter-title">
                پارامترهای Provider
              </div>

              <div className="sms-parameter-list">
                {Object.entries(
                  parameterMap
                ).map(
                  ([
                    providerKey,
                    internalKey,
                  ]) => (
                    <span
                      key={
                        providerKey
                      }
                      className="sms-parameter"
                    >
                      <strong>
                        {toFaDigits(
                          providerKey
                        )}
                      </strong>

                      <span>
                        ←
                      </span>

                      {toFaDigits(
                        internalKey
                      )}
                    </span>
                  )
                )}
              </div>
            </div>
          )}
        </div>


        <AdminField
          label="وضعیت قالب"
        >
          <select
            value={
              status
            }
            onChange={
              (event) =>
                setStatus(
                  event
                    .target
                    .value
                )
            }
          >
            <option value="active">
              فعال
            </option>

            <option value="inactive">
              غیرفعال
            </option>
          </select>
        </AdminField>
      </div>


      <div className="sms-form-actions">
        <AdminButton
          type="button"
          tone="primary"
          disabled={
            saving
          }
          onClick={save}
        >
          {saving
            ? "در حال ذخیره..."
            : "ذخیره قالب"}
        </AdminButton>
      </div>
    </article>
  );
}
