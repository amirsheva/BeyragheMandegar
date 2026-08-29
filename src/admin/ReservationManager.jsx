import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  RotateCcw,
  Search,
  Ticket,
  Tickets,
  UserCheck,
  Users,
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

  return status ||
    "نامشخص";
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


export default function ReservationManager() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    busyId,
    setBusyId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("all");


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


  useEffect(() => {
    load();
  }, []);


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


  const filteredItems =
    useMemo(() => {
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
              .filter(Boolean)
              .map(
                normalizeSearch
              )
              .join(" ");

          return searchable.includes(
            query
          );
        }
      );
    }, [
      items,
      search,
      filter,
    ]);


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
        description="مشاهده، جستجو و مدیریت رزروهای ثبت‌شده برای اجراهای بیرق ماندگار"
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
            placeholder="جستجو در نام، موبایل، کد پیگیری یا اجرا..."
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
              : "عبارت جستجو یا فیلتر انتخاب‌شده را تغییر دهید."
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
                          <code>
                            {toFaDigits(
                              item.tracking_code ||
                              "—"
                            )}
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
      ]
        .filter(Boolean)
        .join(" ")}
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
