import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowUpLeft,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ScanLine,
  ShieldAlert,
  TicketCheck,
  UsersRound,
  XCircle,
} from "lucide-react";

import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPageHeader,
  AdminStatusBadge,
} from "./ui/AdminPrimitives";

import {
  faNumber,
  toFaDigits,
} from "./ui/formatFa";

import "./checkin-dashboard.css";


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


function publicBase() {
  if (
    window.location.hostname ===
      "localhost" &&
    window.location.port ===
      "4000"
  ) {
    return "http://localhost:5173";
  }

  return window.location.origin;
}


function formatDateTime(
  value
) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(
      value
    ).toLocaleString(
      "fa-IR",
      {
        dateStyle:
          "short",

        timeStyle:
          "medium",
      }
    );

  } catch {
    return toFaDigits(
      value
    );
  }
}


function resultMeta(
  value
) {
  const map = {
    admitted: {
      label:
        "پذیرش موفق",
      tone:
        "success",
    },

    already_used: {
      label:
        "قبلاً استفاده‌شده",
      tone:
        "warning",
    },

    cancelled: {
      label:
        "رزرو لغوشده",
      tone:
        "danger",
    },

    wrong_performance: {
      label:
        "اجرای اشتباه",
      tone:
        "danger",
    },

    invalid: {
      label:
        "QR نامعتبر",
      tone:
        "danger",
    },

    not_found: {
      label:
        "یافت نشد",
      tone:
        "neutral",
    },
  };

  return (
    map[value] || {
      label:
        value ||
        "نامشخص",

      tone:
        "neutral",
    }
  );
}


export default function CheckinDashboard() {
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
    snapshot,
    setSnapshot,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    autoRefresh,
    setAutoRefresh,
  ] =
    useState(true);


  async function loadPerformanceList() {
    const data =
      await readJson(
        await fetch(
          "/api/admin/checkin/dashboard",
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
      !performanceId
    ) {
      const preferred =
        items.find(
          (item) =>
            item.status ===
            "active"
        ) ||
        items[0];


      setPerformanceId(
        String(
          preferred.id
        )
      );
    }


    return items;
  }


  async function loadSnapshot(
    id,
    {
      silent =
        false,
    } = {}
  ) {
    if (!id) {
      setSnapshot(
        null
      );

      return;
    }


    if (!silent) {
      setRefreshing(
        true
      );
    }


    try {
      const data =
        await readJson(
          await fetch(
            `/api/admin/checkin/performances/${encodeURIComponent(
              id
            )}`,
            {
              credentials:
                "include",
            }
          )
        );


      setSnapshot(
        data
      );

      setError(
        ""
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      if (!silent) {
        setRefreshing(
          false
        );
      }
    }
  }


  useEffect(
    () => {
      let active =
        true;


      async function start() {
        setLoading(
          true
        );

        setError(
          ""
        );

        try {
          await loadPerformanceList();

        } catch (err) {
          if (active) {
            setError(
              err.message
            );
          }

        } finally {
          if (active) {
            setLoading(
              false
            );
          }
        }
      }


      start();


      return () => {
        active =
          false;
      };
    },
    []
  );


  useEffect(
    () => {
      if (!performanceId) {
        return;
      }


      loadSnapshot(
        performanceId
      );
    },
    [
      performanceId,
    ]
  );


  useEffect(
    () => {
      if (
        !autoRefresh ||
        !performanceId
      ) {
        return undefined;
      }


      const timer =
        window.setInterval(
          () => {
            loadSnapshot(
              performanceId,
              {
                silent:
                  true,
              }
            );
          },
          5000
        );


      return () =>
        window.clearInterval(
          timer
        );
    },
    [
      autoRefresh,
      performanceId,
    ]
  );


  const selected =
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


  const stats =
    snapshot?.stats || {
      total:
        0,
      admitted:
        0,
      remaining:
        0,
    };


  const admissionRate =
    stats.total > 0
      ? Math.round(
          (
            stats.admitted /
            stats.total
          ) *
          100
        )
      : 0;


  const checkerSummary =
    Array.isArray(
      snapshot
        ?.checkerSummary
    )
      ? snapshot
          .checkerSummary
      : [];


  const recent =
    Array.isArray(
      snapshot
        ?.recent
    )
      ? snapshot.recent
      : [];


  const resultSummary =
    snapshot
      ?.resultSummary ||
    {};


  return (
    <div
      dir="rtl"
      className="checkin-admin"
    >
      <AdminPageHeader
        eyebrow="عملیات روز اجرا"
        eyebrowIcon={
          ScanLine
        }
        title="داشبورد پذیرش سالن"
        description="پایش زنده ورود بلیت‌ها، عملکرد مسئولان پذیرش و رخدادهای QR"
      />


      {error && (
        <div className="checkin-admin__error">
          <ShieldAlert
            size={18}
          />

          <span>
            {error}
          </span>
        </div>
      )}


      <section className="checkin-admin__toolbar">
        <label className="checkin-admin__performance-select">
          <span>
            اجرای در حال بررسی
          </span>

          <select
            value={
              performanceId
            }
            onChange={
              (event) =>
                setPerformanceId(
                  event
                    .target
                    .value
                )
            }
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


        <div className="checkin-admin__toolbar-actions">
          <label className="checkin-admin__auto">
            <input
              type="checkbox"
              checked={
                autoRefresh
              }
              onChange={
                (event) =>
                  setAutoRefresh(
                    event
                      .target
                      .checked
                  )
              }
            />

            <span>
              بروزرسانی خودکار ۵ ثانیه‌ای
            </span>
          </label>


          <button
            type="button"
            className="checkin-admin__refresh"
            onClick={() =>
              loadSnapshot(
                performanceId
              )
            }
            disabled={
              refreshing ||
              !performanceId
            }
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "is-spinning"
                  : ""
              }
            />

            بروزرسانی
          </button>


          <a
            href={`${publicBase()}/check-in`}
            target="_blank"
            rel="noreferrer"
            className="checkin-admin__open-checker"
          >
            <ScanLine
              size={17}
            />

            پنل مسئول سالن

            <ArrowUpLeft
              size={15}
            />
          </a>
        </div>
      </section>


      {loading ? (
        <div className="checkin-admin__loading">
          در حال دریافت وضعیت پذیرش...
        </div>

      ) : performances.length ===
        0 ? (
        <AdminEmptyState
          icon={
            TicketCheck
          }
          title="اجرایی برای پذیرش وجود ندارد"
          description="بعد از ایجاد اجرا و رزرو بلیت، وضعیت پذیرش در این صفحه نمایش داده می‌شود."
        />

      ) : (
        <>
          <section className="checkin-admin__metrics">
            <AdminMetricCard
              title="کل بلیت معتبر"
              value={
                faNumber(
                  stats.total
                )
              }
              icon={
                TicketCheck
              }
            />

            <AdminMetricCard
              title="پذیرش‌شده"
              value={
                faNumber(
                  stats.admitted
                )
              }
              icon={
                CheckCircle2
              }
              tone="success"
            />

            <AdminMetricCard
              title="باقی‌مانده"
              value={
                faNumber(
                  stats.remaining
                )
              }
              icon={
                Clock3
              }
            />

            <AdminMetricCard
              title="مسئول فعال"
              value={
                faNumber(
                  checkerSummary.length
                )
              }
              icon={
                UsersRound
              }
            />

            <AdminMetricCard
              title="نرخ ورود"
              value={`${faNumber(
                admissionRate
              )}٪`}
              icon={
                Activity
              }
              tone={
                admissionRate >=
                70
                  ? "success"
                  : undefined
              }
            />
          </section>


          <section className="checkin-admin__progress-card">
            <div className="checkin-admin__progress-head">
              <div>
                <span>
                  پیشرفت پذیرش
                </span>

                <strong>
                  {selected
                    ?.label ||
                    selected
                      ?.productionTitle ||
                    "اجرا"}
                </strong>
              </div>

              <strong>
                {faNumber(
                  admissionRate
                )}
                ٪
              </strong>
            </div>


            <div className="checkin-admin__progress-track">
              <span
                style={{
                  width:
                    `${Math.min(
                      100,
                      Math.max(
                        0,
                        admissionRate
                      )
                    )}%`,
                }}
              />
            </div>


            <div className="checkin-admin__result-chips">
              <ResultChip
                label="موفق"
                value={
                  resultSummary
                    .admitted ||
                  0
                }
                tone="success"
              />

              <ResultChip
                label="تکراری"
                value={
                  resultSummary
                    .already_used ||
                  0
                }
                tone="warning"
              />

              <ResultChip
                label="لغوشده"
                value={
                  resultSummary
                    .cancelled ||
                  0
                }
                tone="danger"
              />

              <ResultChip
                label="اجرای اشتباه"
                value={
                  resultSummary
                    .wrong_performance ||
                  0
                }
                tone="danger"
              />

              <ResultChip
                label="نامعتبر/یافت‌نشده"
                value={
                  Number(
                    resultSummary
                      .invalid ||
                    0
                  ) +
                  Number(
                    resultSummary
                      .not_found ||
                    0
                  )
                }
              />
            </div>
          </section>


          <section className="checkin-admin__section">
            <div className="checkin-admin__section-title">
              <UsersRound
                size={20}
              />

              <div>
                <h2>
                  عملکرد مسئولان پذیرش
                </h2>

                <p>
                  تعداد اسکن و پذیرش ثبت‌شده برای هر حساب مسئول سالن
                </p>
              </div>
            </div>


            {checkerSummary.length ===
              0 ? (
              <div className="checkin-admin__empty-inline">
                هنوز هیچ اسکن یا پذیرشی برای این اجرا ثبت نشده است.
              </div>

            ) : (
              <div className="checkin-admin__checker-grid">
                {checkerSummary.map(
                  (item) => (
                    <article
                      key={
                        item.checkerUsername
                      }
                      className="checkin-admin__checker-card"
                    >
                      <div className="checkin-admin__checker-name">
                        <span>
                          {
                            item.checkerUsername
                          }
                        </span>

                        <AdminStatusBadge tone="success">
                          فعال
                        </AdminStatusBadge>
                      </div>


                      <div className="checkin-admin__checker-stats">
                        <span>
                          پذیرش موفق
                          <strong>
                            {faNumber(
                              item.admitted
                            )}
                          </strong>
                        </span>

                        <span>
                          کل بررسی
                          <strong>
                            {faNumber(
                              item.scans
                            )}
                          </strong>
                        </span>
                      </div>


                      <div className="checkin-admin__checker-last">
                        آخرین فعالیت:{" "}
                        <strong>
                          {formatDateTime(
                            item.lastScan
                          )}
                        </strong>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>


          <section className="checkin-admin__section">
            <div className="checkin-admin__section-title">
              <Activity
                size={20}
              />

              <div>
                <h2>
                  آخرین بررسی‌های بلیت
                </h2>

                <p>
                  Audit عملیاتی Scanها بدون نمایش اطلاعات شخصی مخاطب
                </p>
              </div>
            </div>


            {recent.length ===
              0 ? (
              <div className="checkin-admin__empty-inline">
                هنوز رخدادی برای این اجرا ثبت نشده است.
              </div>

            ) : (
              <div className="checkin-admin__table-scroll">
                <table className="checkin-admin__table">
                  <thead>
                    <tr>
                      <th>
                        نتیجه
                      </th>

                      <th>
                        مسئول
                      </th>

                      <th>
                        روش
                      </th>

                      <th>
                        بلیت
                      </th>

                      <th>
                        رزرو
                      </th>

                      <th>
                        زمان
                      </th>
                    </tr>
                  </thead>


                  <tbody>
                    {recent.map(
                      (item) => {
                        const meta =
                          resultMeta(
                            item.result
                          );


                        return (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td>
                              <AdminStatusBadge
                                tone={
                                  meta.tone
                                }
                              >
                                {
                                  meta.label
                                }
                              </AdminStatusBadge>
                            </td>

                            <td>
                              {
                                item.checker_username
                              }
                            </td>

                            <td>
                              {item.source ===
                              "manual"
                                ? "دستی"
                                : "QR"}
                            </td>

                            <td>
                              {item.ticket_id
                                ? faNumber(
                                    item.ticket_id
                                  )
                                : "—"}
                            </td>

                            <td>
                              {item.reservation_id
                                ? faNumber(
                                    item.reservation_id
                                  )
                                : "—"}
                            </td>

                            <td className="checkin-admin__nowrap">
                              {formatDateTime(
                                item.scanned_at
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}


function ResultChip({
  label,
  value,
  tone =
    "neutral",
}) {
  return (
    <div
      className={[
        "checkin-admin__result-chip",
        `is-${tone}`,
      ].join(
        " "
      )}
    >
      <span>
        {label}
      </span>

      <strong>
        {faNumber(
          value
        )}
      </strong>
    </div>
  );
}