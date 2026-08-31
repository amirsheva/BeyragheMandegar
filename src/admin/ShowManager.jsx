import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  FileText,
  Image,
  Pencil,
  Plus,
  Save,
  Search,
  Tag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import {
  createShow,
  deleteShow,
  getShows,
  updateShow,
} from "./api/showApi";

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

import "./show-manager.css";


const EMPTY_FORM = {
  title: "",
  slug: "",
  subtitle: "",
  short_description: "",
  description: "",
  director: "",
  poster: "",
  status: "published",
  tags: "",
};


function parseTags(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (item) =>
          String(
            item || ""
          ).trim()
      )
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  try {
    const parsed =
      JSON.parse(
        value
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      return parsed
        .map(
          (item) =>
            String(
              item || ""
            ).trim()
        )
        .filter(Boolean);
    }

  } catch {
    return String(
      value
    )
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);
  }

  return [];
}


function tagsToInput(
  value
) {
  return parseTags(
    value
  ).join(", ");
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


function statusLabel(
  status
) {
  if (
    status ===
    "published"
  ) {
    return "منتشر شده";
  }

  if (
    status ===
    "draft"
  ) {
    return "پیش‌نویس";
  }

  return status ||
    "نامشخص";
}


function statusTone(
  status
) {
  if (
    status ===
    "published"
  ) {
    return "success";
  }

  return "neutral";
}


export default function ShowManager() {
  const [
    shows,
    setShows,
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
    formOpen,
    setFormOpen,
  ] = useState(false);

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
        await getShows();

      setShows(
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


  const publishedCount =
    useMemo(
      () =>
        shows.filter(
          (show) =>
            show.status ===
            "published"
        ).length,
      [
        shows,
      ]
    );


  const draftCount =
    useMemo(
      () =>
        shows.filter(
          (show) =>
            show.status ===
            "draft"
        ).length,
      [
        shows,
      ]
    );


  const performanceCount =
    useMemo(
      () =>
        shows.reduce(
          (
            total,
            show
          ) =>
            total +
            Number(
              show
                .performances
                ?.length ||
              0
            ),
          0
        ),
      [
        shows,
      ]
    );


  const filteredShows =
    useMemo(() => {
      const query =
        normalizeSearch(
          search
        );

      return shows.filter(
        (show) => {
          if (
            filter !==
              "all" &&
            show.status !==
              filter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const tags =
            parseTags(
              show.tags
            );

          const content =
            [
              show.title,
              show.subtitle,
              show.director,
              show.short_description,
              show.description,
              show.slug,
              ...tags,
            ]
              .filter(Boolean)
              .map(
                normalizeSearch
              )
              .join(" ");

          return content.includes(
            query
          );
        }
      );
    }, [
      shows,
      search,
      filter,
    ]);


  function change(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]:
          value,
      })
    );
  }


  function startCreate() {
    setEditingId(
      null
    );

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function startEdit(
    show
  ) {
    setEditingId(
      show.id
    );

    setForm({
      title:
        show.title ||
        "",

      slug:
        show.slug ||
        "",

      subtitle:
        show.subtitle ||
        "",

      short_description:
        show.short_description ||
        "",

      description:
        show.description ||
        "",

      director:
        show.director ||
        "",

      poster:
        show.poster ||
        "",

      status:
        show.status ||
        "published",

      tags:
        tagsToInput(
          show.tags
        ),
    });

    setError("");
    setFormOpen(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function closeForm() {
    setFormOpen(
      false
    );

    setEditingId(
      null
    );

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  }


  async function submit(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const payload = {
        title:
          form.title.trim(),

        slug:
          toEnDigits(
            form.slug
          ).trim(),

        subtitle:
          form.subtitle.trim(),

        short_description:
          form
            .short_description
            .trim(),

        description:
          form
            .description
            .trim(),

        director:
          form.director.trim(),

        poster:
          toEnDigits(
            form.poster
          ).trim(),

        status:
          form.status,

        tags:
          form.tags
            .split(",")
            .map(
              (tag) =>
                tag.trim()
            )
            .filter(Boolean),
      };


      if (
        editingId
      ) {
        await updateShow(
          editingId,
          payload
        );

      } else {
        await createShow(
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


  async function remove(
    show
  ) {
    const ok =
      window.confirm(
        `نمایش «${show.title}» حذف شود؟\n\nاگر حذف آن به دلیل اجراها یا رزروهای وابسته مجاز نباشد، سرور عملیات را متوقف خواهد کرد.`
      );

    if (!ok) {
      return;
    }

    setError("");

    try {
      await deleteShow(
        show.id
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
      className="show-manager"
    >
      <AdminPageHeader
        eyebrow="آثار نمایشی"
        eyebrowIcon={
          FileText
        }
        title="مدیریت نمایش‌ها"
        description="مدیریت اطلاعات اصلی آثار نمایشی، وضعیت انتشار، عوامل، محتوای معرفی و اجراهای وابسته"
        actions={
          <AdminButton
            type="button"
            tone="primary"
            icon={Plus}
            onClick={
              startCreate
            }
          >
            نمایش جدید
          </AdminButton>
        }
      />


      {error && (
        <div className="show-error">
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
          className="show-form"
        >
          <div className="show-form__header">

            <div>
              <span>
                {editingId
                  ? "ویرایش اطلاعات اثر"
                  : "ثبت اثر نمایشی"}
              </span>

              <h3>
                {editingId
                  ? "ویرایش نمایش"
                  : "نمایش جدید"}
              </h3>
            </div>


            <button
              type="button"
              onClick={
                closeForm
              }
              className="show-form__close"
              aria-label="بستن فرم"
            >
              <X
                size={20}
              />
            </button>

          </div>


          <div className="show-form-grid">

            <AdminField
              label="عنوان نمایش"
            >
              <input
                required
                value={
                  toFaDigits(
                    form.title
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "title",
                      event
                        .target
                        .value
                    )
                }
                placeholder="بیرق ماندگار"
              />
            </AdminField>


            <AdminField
              label="نامک"
              hint="برای آدرس و شناسه متنی نمایش"
            >
              <input
                required
                dir="ltr"
                value={
                  toFaDigits(
                    form.slug
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "slug",
                      toEnDigits(
                        event
                          .target
                          .value
                      )
                    )
                }
                placeholder="beyragh-mandegar"
              />
            </AdminField>


            <AdminField
              label="زیرعنوان"
            >
              <input
                value={
                  toFaDigits(
                    form.subtitle
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "subtitle",
                      event
                        .target
                        .value
                    )
                }
                placeholder="زیرعنوان یا معرفی کوتاه اثر"
              />
            </AdminField>


            <AdminField
              label="کارگردان"
            >
              <input
                value={
                  toFaDigits(
                    form.director
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "director",
                      event
                        .target
                        .value
                    )
                }
                placeholder="نام کارگردان"
              />
            </AdminField>


            <AdminField
              label="تگ‌ها"
              hint="تگ‌ها را با کاما از هم جدا کنید."
            >
              <input
                value={
                  toFaDigits(
                    form.tags
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "tags",
                      event
                        .target
                        .value
                    )
                }
                placeholder="تئاتر، نمایش، آبان ۱۴۰۵"
              />
            </AdminField>


            <AdminField
              label="وضعیت انتشار"
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
                <option value="published">
                  منتشر شده
                </option>

                <option value="draft">
                  پیش‌نویس
                </option>
              </select>
            </AdminField>

          </div>


          <AdminField
            label="آدرس تصویر پوستر"
            hint="آدرس کامل یا مسیر تصویر پوستر نمایش"
            className="show-form-row"
          >
            <div className="show-poster-field">
              <Image
                size={18}
              />

              <input
                dir="ltr"
                value={
                  toFaDigits(
                    form.poster
                  )
                }
                onChange={
                  (event) =>
                    change(
                      "poster",
                      toEnDigits(
                        event
                          .target
                          .value
                      )
                    )
                }
                placeholder="https://..."
              />
            </div>
          </AdminField>


          <AdminField
            label="خلاصه کوتاه"
            className="show-form-row"
          >
            <textarea
              rows={3}
              value={
                toFaDigits(
                  form.short_description
                )
              }
              onChange={
                (event) =>
                  change(
                    "short_description",
                    event
                      .target
                      .value
                  )
              }
              placeholder="خلاصه‌ای کوتاه برای معرفی نمایش..."
            />
          </AdminField>


          <AdminField
            label="توضیحات کامل"
            className="show-form-row"
          >
            <textarea
              rows={6}
              value={
                toFaDigits(
                  form.description
                )
              }
              onChange={
                (event) =>
                  change(
                    "description",
                    event
                      .target
                      .value
                  )
              }
              placeholder="توضیحات کامل اثر نمایشی..."
            />
          </AdminField>


          <div className="show-form-actions">

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
                : "ذخیره نمایش"}
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


      <section className="show-summary">

        <SummaryItem
          label="کل نمایش‌ها"
          value={
            shows.length
          }
          icon={
            FileText
          }
        />

        <SummaryItem
          label="منتشر شده"
          value={
            publishedCount
          }
          icon={
            FileText
          }
          tone="success"
        />

        <SummaryItem
          label="پیش‌نویس"
          value={
            draftCount
          }
          icon={
            FileText
          }
        />

        <SummaryItem
          label="کل اجراها"
          value={
            performanceCount
          }
          icon={
            CalendarDays
          }
        />

      </section>


      <section className="show-toolbar">

        <label className="show-search">

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
            placeholder="جستجو در عنوان، کارگردان، توضیحات یا تگ‌ها..."
          />

        </label>


        <div className="show-filters">

          <FilterButton
            active={
              filter ===
              "all"
            }
            label="همه"
            count={
              shows.length
            }
            onClick={() =>
              setFilter(
                "all"
              )
            }
          />


          <FilterButton
            active={
              filter ===
              "published"
            }
            label="منتشر شده"
            count={
              publishedCount
            }
            onClick={() =>
              setFilter(
                "published"
              )
            }
          />


          <FilterButton
            active={
              filter ===
              "draft"
            }
            label="پیش‌نویس"
            count={
              draftCount
            }
            onClick={() =>
              setFilter(
                "draft"
              )
            }
          />

        </div>
      </section>


      {loading ? (
        <div className="show-loading">
          در حال دریافت اطلاعات...
        </div>

      ) : filteredShows.length ===
        0 ? (
        <AdminEmptyState
          icon={
            FileText
          }
          title={
            shows.length
              ? "نمایشی با این شرایط پیدا نشد"
              : "هنوز نمایشی ثبت نشده است"
          }
          description={
            shows.length
              ? "عبارت جستجو یا فیلتر انتخاب‌شده را تغییر دهید."
              : "برای تعریف اولین اثر نمایشی از دکمه «نمایش جدید» استفاده کنید."
          }
          action={
            !shows.length
              ? (
                <AdminButton
                  type="button"
                  tone="primary"
                  icon={Plus}
                  onClick={
                    startCreate
                  }
                >
                  نمایش جدید
                </AdminButton>
              )
              : null
          }
        />

      ) : (
        <div className="show-list">

          {filteredShows.map(
            (show) => {
              const tags =
                parseTags(
                  show.tags
                );

              const count =
                Number(
                  show
                    .performances
                    ?.length ||
                  0
                );

              return (
                <article
                  key={
                    show.id
                  }
                  className="show-card"
                >

                  <div className="show-card__main">

                    <div className="show-card__heading">

                      <div className="show-card__icon">
                        <FileText
                          size={21}
                          strokeWidth={1.8}
                        />
                      </div>


                      <div className="show-card__title">

                        <div className="show-card__status">
                          <AdminStatusBadge
                            tone={
                              statusTone(
                                show.status
                              )
                            }
                          >
                            {statusLabel(
                              show.status
                            )}
                          </AdminStatusBadge>
                        </div>


                        <h3>
                          {toFaDigits(
                            show.title ||
                            "بدون عنوان"
                          )}
                        </h3>


                        {show.subtitle && (
                          <p>
                            {toFaDigits(
                              show.subtitle
                            )}
                          </p>
                        )}

                      </div>

                    </div>


                    {show.short_description && (
                      <p className="show-card__description">
                        {toFaDigits(
                          show.short_description
                        )}
                      </p>
                    )}


                    <div className="show-card__meta">

                      {show.director && (
                        <div className="show-meta-item">
                          <UserRound
                            size={17}
                          />

                          <span>
                            کارگردان
                          </span>

                          <strong>
                            {toFaDigits(
                              show.director
                            )}
                          </strong>
                        </div>
                      )}


                      <div className="show-meta-item">
                        <CalendarDays
                          size={17}
                        />

                        <span>
                          تعداد اجرا
                        </span>

                        <strong>
                          {faNumber(
                            count
                          )}
                        </strong>
                      </div>

                    </div>


                    {tags.length > 0 && (
                      <div className="show-tags">

                        {tags.map(
                          (
                            tag,
                            index
                          ) => (
                            <span
                              key={
                                `${tag}-${index}`
                              }
                              className="show-tag"
                            >
                              <Tag
                                size={13}
                              />

                              {toFaDigits(
                                tag
                              )}
                            </span>
                          )
                        )}

                      </div>
                    )}

                  </div>


                  <aside className="show-card__side">

                    <div className="show-performance-count">

                      <span>
                        اجراهای ثبت‌شده
                      </span>

                      <strong>
                        {faNumber(
                          count
                        )}
                      </strong>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        startEdit(
                          show
                        )
                      }
                      className="show-action is-edit"
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
                          show
                        )
                      }
                      className="show-action is-danger"
                    >
                      <Trash2
                        size={18}
                      />

                      حذف
                    </button>

                  </aside>

                </article>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}


function SummaryItem({
  label,
  value,
  icon:
    Icon,
  tone = "default",
}) {
  return (
    <article
      className={[
        "show-summary-item",
        `is-${tone}`,
      ].join(" ")}
    >
      <div className="show-summary-item__icon">
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      </div>

      <div>
        <span>
          {label}
        </span>

        <strong>
          {faNumber(
            value
          )}
        </strong>
      </div>
    </article>
  );
}


function FilterButton({
  active,
  label,
  count,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "show-filter",
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
