import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarClock,
  Eye,
  FileText,
  Image as ImageIcon,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  createNews,
  deleteNews,
  getNews,
  updateNews,
} from "./api/newsApi";

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

import "./news-manager.css";


const EMPTY_FORM = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover: "",
  status: "draft",
  published_at: "",
};


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


function pad2(
  value
) {
  return String(
    value
  ).padStart(
    2,
    "0"
  );
}


function dateToInputValue(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return [
    date.getFullYear(),
    "-",
    pad2(
      date.getMonth() +
      1
    ),
    "-",
    pad2(
      date.getDate()
    ),
    "T",
    pad2(
      date.getHours()
    ),
    ":",
    pad2(
      date.getMinutes()
    ),
  ].join("");
}


function inputToIso(
  value
) {
  const clean =
    toEnDigits(
      value
    ).trim();

  if (!clean) {
    return null;
  }

  const date =
    new Date(
      clean.length === 16
        ? `${clean}:00`
        : clean
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw new Error(
      "زمان انتشار معتبر نیست."
    );
  }

  return date.toISOString();
}


function formatPublishedDate(
  value
) {
  if (!value) {
    return "زمان انتشار تعیین نشده";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "زمان انتشار نامعتبر";
  }

  return toFaDigits(
    new Intl.DateTimeFormat(
      "fa-IR",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short",
      }
    ).format(
      date
    )
  );
}


function publicNewsUrl(
  slug
) {
  const path =
    `/news/${slug}`;

  if (
    window.location.hostname ===
      "localhost" &&
    window.location.port ===
      "4000"
  ) {
    return (
      "http://localhost:5173" +
      path
    );
  }

  return (
    window.location.origin +
    path
  );
}


export default function NewsManager() {
  const [
    items,
    setItems,
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
        await getNews();

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


  const publishedCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status ===
            "published"
        ).length,
      [
        items,
      ]
    );


  const draftCount =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status ===
            "draft"
        ).length,
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

          const content =
            [
              item.title,
              item.slug,
              item.excerpt,
              item.content,
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
      items,
      search,
      filter,
    ]);


  function setField(
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
    item
  ) {
    setEditingId(
      item.id
    );

    setForm({
      title:
        item.title ||
        "",

      slug:
        item.slug ||
        "",

      excerpt:
        item.excerpt ||
        "",

      content:
        item.content ||
        "",

      cover:
        item.cover ||
        "",

      status:
        item.status ||
        "draft",

      published_at:
        dateToInputValue(
          item.published_at
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

        excerpt:
          form.excerpt.trim(),

        content:
          form.content.trim(),

        cover:
          toEnDigits(
            form.cover
          ).trim(),

        status:
          form.status,
      };


      if (
        form.published_at
          .trim()
      ) {
        payload.published_at =
          inputToIso(
            form.published_at
          );
      }


      if (
        editingId
      ) {
        await updateNews(
          editingId,
          payload
        );

      } else {
        await createNews(
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
    item
  ) {
    const ok =
      window.confirm(
        `خبر «${item.title}» حذف شود؟`
      );

    if (!ok) {
      return;
    }

    setError("");

    try {
      await deleteNews(
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
      className="news-manager"
    >
      <AdminPageHeader
        eyebrow="اخبار و محتوا"
        eyebrowIcon={
          Newspaper
        }
        title="مدیریت اخبار"
        description="ثبت، ویرایش، زمان‌بندی و انتشار اخبار بیرق ماندگار"
        actions={
          <AdminButton
            type="button"
            tone="primary"
            icon={Plus}
            onClick={
              startCreate
            }
          >
            خبر جدید
          </AdminButton>
        }
      />


      {error && (
        <div className="news-error">
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
          className="news-form"
        >
          <div className="news-form__header">

            <div>
              <span>
                {editingId
                  ? "ویرایش محتوای خبر"
                  : "ثبت محتوای جدید"}
              </span>

              <h3>
                {editingId
                  ? "ویرایش خبر"
                  : "خبر جدید"}
              </h3>
            </div>


            <button
              type="button"
              onClick={
                closeForm
              }
              className="news-form__close"
              aria-label="بستن فرم"
            >
              <X
                size={20}
              />
            </button>

          </div>


          <div className="news-form-grid">

            <AdminField
              label="عنوان خبر"
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
                    setField(
                      "title",
                      event
                        .target
                        .value
                    )
                }
                placeholder="عنوان خبر"
              />
            </AdminField>


            <AdminField
              label="نامک"
              hint="برای آدرس عمومی خبر"
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
                    setField(
                      "slug",
                      toEnDigits(
                        event
                          .target
                          .value
                      )
                    )
                }
                placeholder="news-slug"
              />
            </AdminField>


            <AdminField
              label="تصویر کاور"
              hint="آدرس کامل یا مسیر تصویر خبر"
            >
              <div className="news-cover-input">
                <ImageIcon
                  size={18}
                />

                <input
                  dir="ltr"
                  value={
                    toFaDigits(
                      form.cover
                    )
                  }
                  onChange={
                    (event) =>
                      setField(
                        "cover",
                        toEnDigits(
                          event
                            .target
                            .value
                        )
                      )
                  }
                  placeholder="/images/news/..."
                />
              </div>
            </AdminField>


            <AdminField
              label="وضعیت"
            >
              <select
                value={
                  form.status
                }
                onChange={
                  (event) =>
                    setField(
                      "status",
                      event
                        .target
                        .value
                    )
                }
              >
                <option value="draft">
                  پیش‌نویس
                </option>

                <option value="published">
                  منتشر شده
                </option>
              </select>
            </AdminField>


            <AdminField
              label="زمان انتشار"
              hint="اختیاری؛ اگر خبر منتشر شود و این بخش خالی باشد، زمان انتشار به‌صورت خودکار ثبت می‌شود."
              className="news-published-field"
            >
              <div className="news-date-input">
                <CalendarClock
                  size={18}
                />

                <input
                  type="text"
                  inputMode="text"
                  dir="ltr"
                  value={
                    toFaDigits(
                      form.published_at
                    )
                  }
                  onChange={
                    (event) =>
                      setField(
                        "published_at",
                        toEnDigits(
                          event
                            .target
                            .value
                        )
                      )
                  }
                  placeholder="۲۰۲۶-۰۸-۲۹T۰۲:۱۵"
                />
              </div>
            </AdminField>

          </div>


          {form.cover && (
            <div className="news-cover-preview">

              <div className="news-cover-preview__label">
                پیش‌نمایش کاور
              </div>

              <div className="news-cover-preview__image">
                <img
                  src={
                    form.cover
                  }
                  alt=""
                  onError={
                    (event) => {
                      event
                        .currentTarget
                        .classList
                        .add(
                          "is-error"
                        );
                    }
                  }
                />

                <div className="news-cover-preview__fallback">
                  <ImageIcon
                    size={28}
                  />

                  تصویر قابل نمایش نیست
                </div>
              </div>

            </div>
          )}


          <AdminField
            label="خلاصه خبر"
            className="news-form-row"
          >
            <textarea
              rows={3}
              value={
                toFaDigits(
                  form.excerpt
                )
              }
              onChange={
                (event) =>
                  setField(
                    "excerpt",
                    event
                      .target
                      .value
                  )
              }
              placeholder="خلاصه‌ای کوتاه برای نمایش در فهرست اخبار..."
            />
          </AdminField>


          <AdminField
            label="متن کامل خبر"
            className="news-form-row"
          >
            <textarea
              required
              rows={10}
              value={
                toFaDigits(
                  form.content
                )
              }
              onChange={
                (event) =>
                  setField(
                    "content",
                    event
                      .target
                      .value
                  )
              }
              placeholder="متن کامل خبر..."
            />
          </AdminField>


          <div className="news-form-actions">

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
                : "ذخیره خبر"}
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


      <section className="news-summary">

        <SummaryItem
          label="کل اخبار"
          value={
            items.length
          }
          icon={
            Newspaper
          }
        />

        <SummaryItem
          label="منتشر شده"
          value={
            publishedCount
          }
          icon={
            Eye
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

      </section>


      <section className="news-toolbar">

        <label className="news-search">

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
            placeholder="جستجو در عنوان، نامک، خلاصه یا متن خبر..."
          />

        </label>


        <div className="news-filters">

          <FilterButton
            active={
              filter ===
              "all"
            }
            label="همه"
            count={
              items.length
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
        <div className="news-loading">
          در حال دریافت اخبار...
        </div>

      ) : filteredItems.length ===
        0 ? (
        <AdminEmptyState
          icon={
            Newspaper
          }
          title={
            items.length
              ? "خبری با این شرایط پیدا نشد"
              : "هنوز خبری ثبت نشده است"
          }
          description={
            items.length
              ? "عبارت جستجو یا فیلتر انتخاب‌شده را تغییر دهید."
              : "خبرهای منتشرشده پس از ثبت در این بخش و در سایت عمومی نمایش داده می‌شوند."
          }
          action={
            !items.length
              ? (
                <AdminButton
                  type="button"
                  tone="primary"
                  icon={Plus}
                  onClick={
                    startCreate
                  }
                >
                  ثبت اولین خبر
                </AdminButton>
              )
              : null
          }
        />

      ) : (
        <div className="news-list">

          {filteredItems.map(
            (item) => (
              <article
                key={
                  item.id
                }
                className="news-card"
              >

                <div className="news-card__visual">

                  {item.cover ? (
                    <>
                      <img
                        src={
                          item.cover
                        }
                        alt=""
                        onError={
                          (event) => {
                            event
                              .currentTarget
                              .style
                              .display =
                              "none";
                          }
                        }
                      />

                      <div className="news-card__visual-fallback">
                        <ImageIcon
                          size={28}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="news-card__visual-empty">
                      <Newspaper
                        size={30}
                        strokeWidth={1.6}
                      />
                    </div>
                  )}

                </div>


                <div className="news-card__content">

                  <div className="news-card__badges">

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


                    <span className="news-card__id">
                      خبر شماره{" "}
                      {faNumber(
                        item.id
                      )}
                    </span>

                  </div>


                  <h3>
                    {toFaDigits(
                      item.title ||
                      "بدون عنوان"
                    )}
                  </h3>


                  <div
                    dir="ltr"
                    className="news-card__slug"
                  >
                    /news/
                    {toFaDigits(
                      item.slug
                    )}
                  </div>


                  {item.excerpt && (
                    <p className="news-card__excerpt">
                      {toFaDigits(
                        item.excerpt
                      )}
                    </p>
                  )}


                  <div className="news-card__date">
                    <CalendarClock
                      size={16}
                    />

                    <span>
                      {formatPublishedDate(
                        item.published_at
                      )}
                    </span>
                  </div>

                </div>


                <aside className="news-card__actions">

                  {item.status ===
                    "published" && (
                    <a
                      href={
                        publicNewsUrl(
                          item.slug
                        )
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="news-action is-view"
                    >
                      <Eye
                        size={18}
                      />

                      مشاهده در سایت
                    </a>
                  )}


                  <button
                    type="button"
                    onClick={() =>
                      startEdit(
                        item
                      )
                    }
                    className="news-action is-edit"
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
                    className="news-action is-danger"
                  >
                    <Trash2
                      size={18}
                    />

                    حذف
                  </button>

                </aside>

              </article>
            )
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
        "news-summary-item",
        `is-${tone}`,
      ].join(" ")}
    >
      <div className="news-summary-item__icon">
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
        "news-filter",
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
