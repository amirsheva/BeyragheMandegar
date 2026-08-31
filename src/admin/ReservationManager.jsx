import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Download,
  RotateCcw,
  Search,
  Ticket,
  Tickets,
  UserCheck,
  Users,
  X,
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
  toEnDigits,
  toFaDigits,
} from "./ui/formatFa";

import "./reservation-manager.css";


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


function normalizeSearch(
  value
) {
  return toEnDigits(
    String(
      value ?? ""
    )
  )
    .trim()
    .toLowerCase();
}


function reservationLabel(
  status
) {
  if (
    status ===
    "confirmed"
  ) {
    return "تأیید شده";
  }

  if (
    status ===
    "cancelled"
  ) {
    return "لغو شده";
  }

  return (
    status ||
    "نامشخص"
  );
}


function reservationTone(
  status
) {
  if (
    status ===
    "confirmed"
  ) {
    return "success";
  }

  if (
    status ===
    "cancelled"
  ) {
    return "danger";
  }

  return "neutral";
}


function sortText(
  a,
  b
) {
  return String(
    a || ""
  ).localeCompare(
    String(
      b || ""
    ),
    "fa"
  );
}


export default function ReservationManager() {
  const [
    items,
    setItems,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busyId,
    setBusyId,
  ] =
    useState(null);

  const [
    exporting,
    setExporting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filter,
    setFilter,
  ] =
    useState("all");

  const [
    performanceFilter,
    setPerformanceFilter,
  ] =
    useState("all");

  const [
    dateFilter,
    setDateFilter,
  ] =
    useState("all");


  async function load() {
    setLoading(true);
    setError("");

    try {
      const data =
        await readJson(
          await fetch(
            "/api/admin/reservations",
            {
              credentials:
                "include",
            }
          )
        );


      setItems(
        Array.isArray(
          data
        )
          ? data
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


  useEffect(
    () => {
      load();
    },
    []
  );


  const confirmedItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status ===
            "confirmed"
        ),
      [
        items,
      ]
    );


  const cancelledItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status ===
            "cancelled"
        ),
      [
        items,
      ]
    );


  const activeTicketCount =
    useMemo(
      () =>
        confirmedItems.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.count ||
              0
            ),
          0
        ),
      [
        confirmedItems,
      ]
    );


  const totalTicketCount =
    useMemo(
      () =>
        items.reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.count ||
              0
            ),
          0
        ),
      [
        items,
      ]
    );


  const performanceOptions =
    useMemo(
      () => {
        const map =
          new Map();

        items.forEach(
          (item) => {
            const performance =
              item.performance;

            if (
              !performance?.id
            ) {
              return;
            }

            if (
              map.has(
                performance.id
              )
            ) {
              return;
            }

            const productionTitle =
              performance
                .production
                ?.title ||
              "";

            const label =
              performance.label ||
              "";

            const date =
              performance.date ||
              "";

            map.set(
              performance.id,
              {
                id:
                  performance.id,

                label:
                  [
                    label,
                    productionTitle,
                    date,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " — "
                    ),
              }
            );
          }
        );


        return [
          ...map.values(),
        ].sort(
          (
            a,
            b
          ) =>
            sortText(
              a.label,
              b.label
            )
        );
      },
      [
        items,
      ]
    );


  const dateOptions =
    useMemo(
      () =>
        [
          ...new Set(
            items
              .map(
                (item) =>
                  item.performance
                    ?.date
              )
              .filter(
                Boolean
              )
          ),
        ].sort(),
      [
        items,
      ]
    );


  const filteredItems =
    useMemo(
      () => {
        const query =
          normalizeSearch(
            search
          );


        return items.filter(
          (item) => {
            if (
              filter !==
                "all" &&
              item.status !==
                filter
            ) {
              return false;
            }


            if (
              performanceFilter !==
                "all" &&
              String(
                item.performance
                  ?.id ||
                ""
              ) !==
                performanceFilter
            ) {
              return false;
            }


            if (
              dateFilter !==
                "all" &&
              String(
                item.performance
                  ?.date ||
                ""
              ) !==
                dateFilter
            ) {
              return false;
            }


            if (!query) {
              return true;
            }


            const searchable =
              [
                item.name,
                item.phone,
                item.tracking_code,
                item.performance
                  ?.label,
                item.performance
                  ?.date,
                item.performance
                  ?.time,
                item.performance
                  ?.production
                  ?.title,
              ]
                .filter(
                  Boolean
                )
                .map(
                  normalizeSearch
                )
                .join(
                  " "
                );


            return searchable.includes(
              query
            );
          }
        );
      },
      [
        items,
        search,
        filter,
        performanceFilter,
        dateFilter,
      ]
    );


  const hasActiveFilters =
    Boolean(
      search.trim()
    ) ||
    filter !==
      "all" ||
    performanceFilter !==
      "all" ||
    dateFilter !==
      "all";


  function clearFilters() {
    setSearch("");
    setFilter("all");
    setPerformanceFilter(
      "all"
    );
    setDateFilter(
      "all"
    );
  }


  async function exportVisible() {
    if (
      filteredItems.length ===
      0
    ) {
      return;
    }


    setExporting(
      true
    );

    setError("");


    try {
      const response =
        await fetch(
          "/api/admin/reservations/export",
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
                ids:
                  filteredItems.map(
                    (item) =>
                      item.id
                  ),
              }),
          }
        );


      if (
        !response.ok
      ) {
        const data =
          await response
            .json()
            .catch(
              () => ({})
            );

        throw new Error(
          data.message ||
          "خطا در ساخت خروجی رزروها"
        );
      }


      const blob =
        await response.blob();

      const date =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        url;

      anchor.download =
        `beyragh-reservations-${date}.csv`;

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(
        url
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setExporting(
        false
      );
    }
  }


  async function changeStatus(
    item,
    status
  ) {
    setBusyId(
      item.id
    );

    setError("");


    try {
      await readJson(
        await fetch(
          `/api/admin/reservations/${item.id}/status`,
          {
            method:
              "PATCH",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        )
      );


      await load();

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setBusyId(
        null
      );
    }
  }


  return (
    <div
      dir="rtl"
      className="reservation-manager"
    >
      <AdminPageHeader
        eyebrow="مخاطبان و بلیت‌ها"
        eyebrowIcon={
          Ticket
        }
        title="مدیریت رزروها"
        description="جست‌وجو، فیلتر، خروجی و مدیریت رزروهای ثبت‌شده برای اجراهای بیرق ماندگار"
      />


      {error && (
        <div className="reservation-error">
          {toFaDigits(
            error
          )}
        </div>
      )}


      <section className="reservation-metrics">
        <AdminMetricCard
          title="کل رزروها"
          value={
            faNumber(
              items.length
            )
          }
          icon={
            Users
          }
        />

        <AdminMetricCard
          title="رزرو فعال"
          value={
            faNumber(
              confirmedItems.length
            )
          }
          icon={
            UserCheck
          }
          tone="success"
        />

        <AdminMetricCard
          title="بلیت فعال"
          value={
            faNumber(
              activeTicketCount
            )
          }
          icon={
            Ticket
          }
          tone="success"
        />

        <AdminMetricCard
          title="رزرو لغوشده"
          value={
            faNumber(
              cancelledItems.length
            )
          }
          icon={
            XCircle
          }
          tone="danger"
        />

        <AdminMetricCard
          title="کل بلیت ثبت‌شده"
          value={
            faNumber(
              totalTicketCount
            )
          }
          icon={
            Tickets
          }
        />
      </section>


      <section className="reservation-toolbar">
        <label className="reservation-search">
          <Search
            size={19}
            strokeWidth={1.8}
          />

          <input
            value={
              toFaDigits(
                search
              )
            }
            onChange={
              (event) =>
                setSearch(
                  event
                    .target
                    .value
                )
            }
            placeholder="جست‌وجو در نام، موبایل Mask شده، کد پیگیری یا اجرا..."
          />
        </label>


        <div className="reservation-filters">
          <FilterButton
            active={
              filter ===
              "all"
            }
            onClick={() =>
              setFilter(
                "all"
              )
            }
            label="همه"
            count={
              items.length
            }
          />

          <FilterButton
            active={
              filter ===
              "confirmed"
            }
            onClick={() =>
              setFilter(
                "confirmed"
              )
            }
            label="فعال"
            count={
              confirmedItems.length
            }
          />

          <FilterButton
            active={
              filter ===
              "cancelled"
            }
            onClick={() =>
              setFilter(
                "cancelled"
              )
            }
            label="لغوشده"
            count={
              cancelledItems.length
            }
          />
        </div>
      </section>


      <section className="reservation-advanced-toolbar">
        <label className="reservation-select-field">
          <span>
            اجرا
          </span>

          <select
            value={
              performanceFilter
            }
            onChange={
              (event) =>
                setPerformanceFilter(
                  event
                    .target
                    .value
                )
            }
          >
            <option value="all">
              همه اجراها
            </option>

            {performanceOptions.map(
              (item) => (
                <option
                  key={
                    item.id
                  }
                  value={
                    item.id
                  }
                >
                  {
                    item.label
                  }
                </option>
              )
            )}
          </select>
        </label>


        <label className="reservation-select-field">
          <span>
            تاریخ
          </span>

          <select
            value={
              dateFilter
            }
            onChange={
              (event) =>
                setDateFilter(
                  event
                    .target
                    .value
                )
            }
          >
            <option value="all">
              همه تاریخ‌ها
            </option>

            {dateOptions.map(
              (date) => (
                <option
                  key={
                    date
                  }
                  value={
                    date
                  }
                >
                  {toFaDigits(
                    date
                  )}
                </option>
              )
            )}
          </select>
        </label>


        <div className="reservation-filter-summary">
          <CalendarDays
            size={18}
          />

          <span>
            نمایش{" "}
            <strong>
              {faNumber(
                filteredItems.length
              )}
            </strong>
            {" "}از{" "}
            <strong>
              {faNumber(
                items.length
              )}
            </strong>
            {" "}رزرو
          </span>
        </div>


        <div className="reservation-toolbar-actions">
          <button
            type="button"
            disabled={
              !hasActiveFilters
            }
            onClick={
              clearFilters
            }
            className="reservation-clear-button"
          >
            <X
              size={17}
            />
            پاک کردن فیلترها
          </button>


          <button
            type="button"
            disabled={
              exporting ||
              filteredItems.length ===
                0
            }
            onClick={
              exportVisible
            }
            className="reservation-export-button"
          >
            <Download
              size={18}
            />

            {exporting
              ? "در حال ساخت خروجی..."
              : "خروجی CSV"}
          </button>
        </div>
      </section>


      {loading ? (
        <div className="reservation-loading">
          در حال دریافت اطلاعات...
        </div>

      ) : filteredItems.length ===
        0 ? (
        <AdminEmptyState
          icon={
            Ticket
          }
          title={
            items.length ===
            0
              ? "هنوز رزروی ثبت نشده است"
              : "رزروی با این شرایط پیدا نشد"
          }
          description={
            items.length ===
            0
              ? "پس از ثبت اولین رزرو، اطلاعات مخاطب و بلیت در این صفحه نمایش داده می‌شود."
              : "عبارت جست‌وجو یا فیلترهای انتخاب‌شده را تغییر دهید."
          }
        />

      ) : (
        <section className="reservation-table-card">
          <div className="reservation-table-scroll">
            <table className="reservation-table">
              <thead>
                <tr>
                  <th>
                    ردیف
                  </th>
                  <th>
                    مخاطب
                  </th>
                  <th>
                    موبایل
                  </th>
                  <th>
                    اجرا
                  </th>
                  <th>
                    تاریخ
                  </th>
                  <th>
                    ساعت
                  </th>
                  <th>
                    بلیت
                  </th>
                  <th>
                    کد پیگیری
                  </th>
                  <th>
                    وضعیت
                  </th>
                  <th>
                    عملیات
                  </th>
                </tr>
              </thead>


              <tbody>
                {filteredItems.map(
                  (
                    item,
                    index
                  ) => {
                    const cancelled =
                      item.status ===
                      "cancelled";


                    return (
                      <tr
                        key={
                          item.id
                        }
                        className={
                          cancelled
                            ? "is-cancelled"
                            : ""
                        }
                      >
                        <td className="reservation-row-number">
                          {faNumber(
                            index + 1
                          )}
                        </td>


                        <td>
                          <div className="reservation-person">
                            <strong>
                              {item.name ||
                                "—"}
                            </strong>

                            <span>
                              رزرو شماره{" "}
                              {faNumber(
                                item.id
                              )}
                            </span>
                          </div>
                        </td>


                        <td
                          dir="ltr"
                          className="reservation-nowrap reservation-phone"
                        >
                          {toFaDigits(
                            item.phone ||
                            "—"
                          )}
                        </td>


                        <td>
                          <div className="reservation-performance">
                            <strong>
                              {item
                                .performance
                                ?.label ||
                                item
                                  .performance
                                  ?.production
                                  ?.title ||
                                "—"}
                            </strong>

                            {item
                              .performance
                              ?.label &&
                              item
                                .performance
                                ?.production
                                ?.title && (
                                <span>
                                  {
                                    item
                                      .performance
                                      .production
                                      .title
                                  }
                                </span>
                              )}
                          </div>
                        </td>


                        <td className="reservation-nowrap">
                          {toFaDigits(
                            item
                              .performance
                              ?.date ||
                            "—"
                          )}
                        </td>


                        <td className="reservation-nowrap">
                          {toFaDigits(
                            item
                              .performance
                              ?.time ||
                            "—"
                          )}
                        </td>


                        <td>
                          <span className="reservation-ticket-count">
                            {faNumber(
                              item.count ||
                              0
                            )}
                          </span>
                        </td>


                        <td
                          dir="ltr"
                          className="reservation-tracking-cell"
                        >
                          <code
                            data-keep-latin-digits="true"
                          >
                            {item.tracking_code ||
                              "—"}
                          </code>
                        </td>


                        <td>
                          <AdminStatusBadge
                            tone={
                              reservationTone(
                                item.status
                              )
                            }
                          >
                            {reservationLabel(
                              item.status
                            )}
                          </AdminStatusBadge>
                        </td>


                        <td>
                          <div className="reservation-actions">
                            {item.status ===
                            "confirmed" ? (
                              <button
                                type="button"
                                disabled={
                                  busyId ===
                                  item.id
                                }
                                onClick={() =>
                                  changeStatus(
                                    item,
                                    "cancelled"
                                  )
                                }
                                className="reservation-action is-danger"
                              >
                                <XCircle
                                  size={17}
                                />

                                {busyId ===
                                item.id
                                  ? "در حال انجام..."
                                  : "لغو رزرو"}
                              </button>

                            ) : (
                              <button
                                type="button"
                                disabled={
                                  busyId ===
                                  item.id
                                }
                                onClick={() =>
                                  changeStatus(
                                    item,
                                    "confirmed"
                                  )
                                }
                                className="reservation-action is-success"
                              >
                                <RotateCcw
                                  size={17}
                                />

                                {busyId ===
                                item.id
                                  ? "در حال انجام..."
                                  : "فعال‌سازی مجدد"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}


function FilterButton({
  active,
  onClick,
  label,
  count,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "reservation-filter",
        active
          ? "is-active"
          : "",
      ].join(" ")}
    >
      <span>
        {label}
      </span>

      <strong>
        {faNumber(
          count
        )}
      </strong>
    </button>
  );
}