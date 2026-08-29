import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  CalendarDays,
  Clock3,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Save,
  Ticket,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  createPerformance,
  deletePerformance,
  getPerformances,
  updatePerformance,
} from "./api/performanceApi";

import {
  getShows,
} from "./api/showApi";

import {
  getVenues,
} from "./api/venueApi";

import {
  AdminButton,
  AdminEmptyState,
  AdminField,
  AdminPageHeader,
  AdminStatusBadge,
} from "./ui/AdminPrimitives";

import {
  faNumber,
  toEnDigits,
  toFaDigits,
} from "./ui/formatFa";

import "./performance-manager.css";


const EMPTY_FORM = {
  production_id: "",
  venue_id: "",
  date: "",
  time: "20:00",
  attendance_time: "",
  end_time: "",
  capacity: 300,
  status: "active",
  booking_enabled: true,
  label: "",
  ticket_note: "",
};


function statusLabel(
  status
) {
  const map = {
    active: "فعال",
    closed: "بسته",
    archived: "آرشیو",
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
    status === "active"
  ) {
    return "success";
  }

  if (
    status === "archived"
  ) {
    return "neutral";
  }

  return "accent";
}


function cleanValue(
  value
) {
  return (
    value === null ||
    value === undefined
      ? ""
      : String(value)
  );
}


export default function PerformanceManager() {
  const [
    items,
    setItems,
  ] = useState([]);

  const [
    productions,
    setProductions,
  ] = useState([]);

  const [
    venues,
    setVenues,
  ] = useState([]);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    editingId,
    setEditingId,
  ] = useState(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState("all");


  async function load() {
    setLoading(true);
    setError("");

    try {
      const [
        performancesData,
        productionsData,
        venuesData,
      ] =
        await Promise.all([
          getPerformances(),
          getShows(),
          getVenues(),
        ]);

      setItems(
        Array.isArray(
          performancesData
        )
          ? performancesData
          : []
      );

      setProductions(
        Array.isArray(
          productionsData
        )
          ? productionsData
          : []
      );

      setVenues(
        Array.isArray(
          venuesData
        )
          ? venuesData
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


  const filtered =
    useMemo(() => {
      if (
        filter === "all"
      ) {
        return items;
      }

      if (
        filter === "bookable"
      ) {
        return items.filter(
          (item) =>
            item.booking_enabled &&
            item.status ===
              "active"
        );
      }

      return items.filter(
        (item) =>
          item.status ===
          filter
      );
    }, [
      items,
      filter,
    ]);


  const counts =
    useMemo(() => ({
      all:
        items.length,

      active:
        items.filter(
          (item) =>
            item.status ===
            "active"
        ).length,

      archived:
        items.filter(
          (item) =>
            item.status ===
            "archived"
        ).length,

      bookable:
        items.filter(
          (item) =>
            item.status ===
              "active" &&
            item.booking_enabled
        ).length,
    }), [
      items,
    ]);


  function change(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }


  function startCreate() {
    setEditingId(null);

    setForm({
      ...EMPTY_FORM,

      production_id:
        productions[0]?.id
          ? String(
              productions[0].id
            )
          : "",

      venue_id:
        "",
    });

    setError("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function startEdit(
    item
  ) {
    setEditingId(
      item.id
    );

    setForm({
      production_id:
        cleanValue(
          item.production_id
        ),

      venue_id:
        cleanValue(
          item.venue_id
        ),

      date:
        item.date || "",

      time:
        item.time ||
        "20:00",

      attendance_time:
        item.attendance_time ||
        "",

      end_time:
        item.end_time ||
        "",

      capacity:
        Number(
          item.capacity ||
          0
        ),

      status:
        item.status ||
        "active",

      booking_enabled:
        Boolean(
          item.booking_enabled
        ),

      label:
        item.label ||
        "",

      ticket_note:
        item.ticket_note ||
        "",
    });

    setError("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function closeForm() {
    setEditingId(null);
    setForm(
      EMPTY_FORM
    );
    setError("");
    setFormOpen(false);
  }


  async function submit(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const capacity =
        Number(
          toEnDigits(
            form.capacity
          )
        );

      const payload = {
        production_id:
          Number(
            form.production_id
          ),

        venue_id:
          form.venue_id
            ? Number(
                form.venue_id
              )
            : null,

        date:
          toEnDigits(
            form.date
          ),

        time:
          toEnDigits(
            form.time
          ),

        attendance_time:
          form.attendance_time
            ? toEnDigits(
                form.attendance_time
              )
            : null,

        end_time:
          form.end_time
            ? toEnDigits(
                form.end_time
              )
            : null,

        capacity,

        status:
          form.status,

        booking_enabled:
          form.status ===
            "archived"
            ? false
            : Boolean(
                form.booking_enabled
              ),

        label:
          form.label,

        ticket_note:
          form.ticket_note,
      };


      if (
        editingId
      ) {
        await updatePerformance(
          editingId,
          payload
        );

      } else {
        await createPerformance(
          payload
        );
      }


      closeForm();
      await load();

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setSaving(false);
    }
  }


  async function toggleBooking(
    item
  ) {
    if (
      item.status ===
      "archived"
    ) {
      return;
    }

    try {
      setError("");

      await updatePerformance(
        item.id,
        {
          booking_enabled:
            !item.booking_enabled,
        }
      );

      await load();

    } catch (err) {
      setError(
        err.message
      );
    }
  }


  async function remove(
    item
  ) {
    const ok =
      window.confirm(
        `اجرای «${
          item.label ||
          item.date
        }» حذف شود؟\n\nاگر رزروی به این اجرا متصل باشد، حذف انجام نخواهد شد.`
      );

    if (!ok) {
      return;
    }

    try {
      setError("");

      await deletePerformance(
        item.id
      );

      await load();

    } catch (err) {
      setError(
        err.message
      );
    }
  }


  return (
    <div
      dir="rtl"
      className="performance-manager"
    >
      <AdminPageHeader
        eyebrow="زمان‌بندی اجراها"
        eyebrowIcon={
          CalendarDays
        }
        title="مدیریت اجراها"
        description="مدیریت تاریخ، زمان حضور و اجرا، محل، ظرفیت، رزرو و وضعیت هر شب اجرا"
        actions={
          <AdminButton
            type="button"
            tone="primary"
            icon={Plus}
            disabled={
              productions.length ===
              0
            }
            onClick={
              startCreate
            }
          >
            اجرای جدید
          </AdminButton>
        }
      />


      {error && (
        <div className="performance-error">
          {toFaDigits(
            error
          )}
        </div>
      )}


      {formOpen && (
        <form
          onSubmit={
            submit
          }
          className="performance-form"
        >
          <div className="performance-form__header">
            <div>
              <span>
                {editingId
                  ? "ویرایش اطلاعات اجرا"
                  : "ثبت اجرای جدید"}
              </span>

              <h3>
                {editingId
                  ? "ویرایش اجرا"
                  : "اجرای تازه"}
              </h3>
            </div>

            <button
              type="button"
              onClick={
                closeForm
              }
              className="performance-form__close"
              aria-label="بستن فرم"
            >
              <X
                size={20}
              />
            </button>
          </div>


          <div className="performance-form-grid">
            <AdminField
              label="نمایش"
            >
              <select
                required
                value={
                  form.production_id
                }
                onChange={
                  (event) =>
                    change(
                      "production_id",
                      event
                        .target
                        .value
                    )
                }
              >
                <option value="">
                  انتخاب نمایش
                </option>

                {productions.map(
                  (production) => (
                    <option
                      key={
                        production.id
                      }
                      value={
                        production.id
                      }
                    >
                      {production.title}
                    </option>
                  )
                )}
              </select>
            </AdminField>


            <AdminField
              label="محل اجرا"
            >
              <select
                value={
                  form.venue_id
                }
                onChange={
                  (event) =>
                    change(
                      "venue_id",
                      event
                        .target
                        .value
                    )
                }
              >
                <option value="">
                  بدون محل مشخص
                </option>

                {venues.map(
                  (venue) => (
                    <option
                      key={
                        venue.id
                      }
                      value={
                        venue.id
                      }
                    >
                      {venue.name}
                      {venue.hall_name
                        ? ` — ${venue.hall_name}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </AdminField>


            <AdminField
              label="عنوان شب"
            >
              <input
                value={
                  form.label
                }
                onChange={
                  (event) =>
                    change(
                      "label",
                      event
                        .target
                        .value
                    )
                }
                placeholder="شب اول"
              />
            </AdminField>


            <AdminField
              label="تاریخ اجرا"
              hint="مثال: ۱۴۰۵/۰۸/۰۱"
            >
              <input
                required
                inputMode="numeric"
                dir="ltr"
                value={
                  toFaDigits(
                    form.date
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "date",
                      toEnDigits(
                        event
                          .target
                          .value
                      )
                    )
                }
                placeholder="۱۴۰۵/۰۸/۰۱"
              />
            </AdminField>


            <AdminField
              label="ساعت حضور"
            >
              <input
                type="time"
                value={
                  form.attendance_time
                }
                onChange={
                  (event) =>
                    change(
                      "attendance_time",
                      event
                        .target
                        .value
                    )
                }
              />
            </AdminField>


            <AdminField
              label="ساعت شروع"
            >
              <input
                required
                type="time"
                value={
                  form.time
                }
                onChange={
                  (event) =>
                    change(
                      "time",
                      event
                        .target
                        .value
                    )
                }
              />
            </AdminField>


            <AdminField
              label="ساعت پایان"
            >
              <input
                type="time"
                value={
                  form.end_time
                }
                onChange={
                  (event) =>
                    change(
                      "end_time",
                      event
                        .target
                        .value
                    )
                }
              />
            </AdminField>


            <AdminField
              label="ظرفیت کل"
            >
              <input
                required
                min="0"
                inputMode="numeric"
                value={
                  toFaDigits(
                    form.capacity
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "capacity",
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
              label="وضعیت اجرا"
            >
              <select
                value={
                  form.status
                }
                onChange={
                  (event) =>
                    change(
                      "status",
                      event
                        .target
                        .value
                    )
                }
              >
                <option value="active">
                  فعال
                </option>

                <option value="closed">
                  بسته
                </option>

                <option value="archived">
                  آرشیو
                </option>
              </select>
            </AdminField>
          </div>


          <AdminField
            label="شرایط حضور و بلیت"
            className="performance-ticket-note"
          >
            <textarea
              rows={4}
              value={
                form.ticket_note
              }
              onChange={
                (event) =>
                  change(
                    "ticket_note",
                    event
                      .target
                      .value
                  )
              }
              placeholder="برای مثال: ۵ صلوات برای سلامتی و تعجیل در فرج حضرت صاحب‌الزمان (عج)"
            />
          </AdminField>


          <label className="performance-booking-toggle">
            <input
              type="checkbox"
              checked={
                form.status ===
                  "archived"
                  ? false
                  : form.booking_enabled
              }
              disabled={
                form.status ===
                "archived"
              }
              onChange={
                (event) =>
                  change(
                    "booking_enabled",
                    event
                      .target
                      .checked
                  )
              }
            />

            <span className="performance-booking-toggle__visual" />

            <span>
              <strong>
                رزرو برای این اجرا باز باشد
              </strong>

              <small>
                اجرای آرشیوی به‌صورت خودکار امکان رزرو ندارد.
              </small>
            </span>
          </label>


          <div className="performance-form-actions">
            <AdminButton
              type="submit"
              tone="primary"
              icon={Save}
              disabled={
                saving
              }
            >
              {saving
                ? "در حال ذخیره..."
                : "ذخیره اجرا"}
            </AdminButton>

            <AdminButton
              type="button"
              tone="ghost"
              onClick={
                closeForm
              }
            >
              انصراف
            </AdminButton>
          </div>
        </form>
      )}


      <div className="performance-filters">
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
          value={
            counts.all
          }
        />

        <FilterButton
          active={
            filter ===
            "active"
          }
          onClick={() =>
            setFilter(
              "active"
            )
          }
          label="فعال"
          value={
            counts.active
          }
        />

        <FilterButton
          active={
            filter ===
            "bookable"
          }
          onClick={() =>
            setFilter(
              "bookable"
            )
          }
          label="رزرو باز"
          value={
            counts.bookable
          }
        />

        <FilterButton
          active={
            filter ===
            "archived"
          }
          onClick={() =>
            setFilter(
              "archived"
            )
          }
          label="آرشیو"
          value={
            counts.archived
          }
        />
      </div>


      {loading ? (
        <div className="performance-loading">
          در حال دریافت اجراها...
        </div>

      ) : filtered.length ===
        0 ? (
        <AdminEmptyState
          icon={
            CalendarDays
          }
          title="اجرایی در این بخش وجود ندارد"
          description="برای ثبت یک شب اجرای جدید، از دکمه «اجرای جدید» استفاده کنید."
        />

      ) : (
        <div className="performance-list">
          {filtered.map(
            (item) => {
              const archived =
                item.status ===
                "archived";

              const venue =
                item.venue ||
                venues.find(
                  (candidate) =>
                    Number(
                      candidate.id
                    ) ===
                    Number(
                      item.venue_id
                    )
                );

              const production =
                item.production ||
                productions.find(
                  (candidate) =>
                    Number(
                      candidate.id
                    ) ===
                    Number(
                      item.production_id
                    )
                );

              return (
                <article
                  key={
                    item.id
                  }
                  className={[
                    "performance-card",
                    archived
                      ? "is-archived"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="performance-card__main">
                    <div className="performance-card__heading">
                      <div className="performance-card__icon">
                        {archived
                          ? (
                            <Archive
                              size={20}
                            />
                          )
                          : (
                            <CalendarDays
                              size={20}
                            />
                          )}
                      </div>

                      <div className="performance-card__title">
                        <div className="performance-card__badges">
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

                          <AdminStatusBadge
                            tone={
                              item.booking_enabled &&
                              !archived
                                ? "success"
                                : "neutral"
                            }
                          >
                            {item.booking_enabled &&
                            !archived
                              ? "رزرو باز"
                              : "رزرو بسته"}
                          </AdminStatusBadge>
                        </div>

                        <h3>
                          {item.label ||
                            "شب اجرا"}
                        </h3>

                        <p>
                          {production?.title ||
                            "بیرق ماندگار"}
                        </p>
                      </div>
                    </div>


                    <div className="performance-info-grid">
                      <Info
                        icon={
                          CalendarDays
                        }
                        label="تاریخ"
                        value={
                          toFaDigits(
                            item.date ||
                            "—"
                          )
                        }
                      />

                      <Info
                        icon={
                          Clock3
                        }
                        label="حضور"
                        value={
                          toFaDigits(
                            item.attendance_time ||
                            "—"
                          )
                        }
                      />

                      <Info
                        icon={
                          Clock3
                        }
                        label="شروع"
                        value={
                          toFaDigits(
                            item.time ||
                            "—"
                          )
                        }
                      />

                      <Info
                        icon={
                          Clock3
                        }
                        label="پایان"
                        value={
                          toFaDigits(
                            item.end_time ||
                            "—"
                          )
                        }
                      />

                      <Info
                        icon={
                          Users
                        }
                        label="ظرفیت"
                        value={
                          faNumber(
                            item.capacity ||
                            0
                          )
                        }
                      />

                      <Info
                        icon={
                          Ticket
                        }
                        label="باقی‌مانده"
                        value={
                          faNumber(
                            item.remaining_capacity ??
                            0
                          )
                        }
                        accent
                      />
                    </div>


                    {venue && (
                      <div className="performance-venue">
                        <MapPin
                          size={18}
                        />

                        <div>
                          <strong>
                            {venue.name}
                          </strong>

                          {venue.hall_name && (
                            <span>
                              {venue.hall_name}
                            </span>
                          )}
                        </div>
                      </div>
                    )}


                    {item.ticket_note && (
                      <div className="performance-note">
                        <Ticket
                          size={17}
                        />

                        <span>
                          {toFaDigits(
                            item.ticket_note
                          )}
                        </span>
                      </div>
                    )}
                  </div>


                  <div className="performance-card__actions">
                    <a
                      href={`/performance/${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="performance-action is-view"
                    >
                      <Eye
                        size={18}
                      />

                      مشاهده در سایت
                    </a>


                    <button
                      type="button"
                      onClick={() =>
                        toggleBooking(
                          item
                        )
                      }
                      disabled={
                        archived
                      }
                      className="performance-action"
                    >
                      <Ticket
                        size={18}
                      />

                      {item.booking_enabled
                        ? "بستن رزرو"
                        : "باز کردن رزرو"}
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        startEdit(
                          item
                        )
                      }
                      className="performance-action is-edit"
                    >
                      <Pencil
                        size={18}
                      />

                      ویرایش
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        remove(
                          item
                        )
                      }
                      className="performance-action is-danger"
                    >
                      <Trash2
                        size={18}
                      />

                      حذف
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}


function FilterButton({
  active,
  onClick,
  label,
  value,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "performance-filter",
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
          value
        )}
      </strong>
    </button>
  );
}


function Info({
  icon:
    Icon,
  label,
  value,
  accent = false,
}) {
  return (
    <div className="performance-info">
      <Icon
        size={17}
        strokeWidth={1.7}
      />

      <div>
        <span>
          {label}
        </span>

        <strong
          className={
            accent
              ? "is-accent"
              : ""
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}
