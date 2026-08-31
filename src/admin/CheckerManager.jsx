import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  CalendarDays,
  Check,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  TicketCheck,
  UserCheck,
  UserRoundCog,
  UserX,
  X,
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

import "./checker-manager.css";


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


function formatDateTime(
  value
) {
  if (!value) {
    return "ثبت نشده";
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
          "short",
      }
    );

  } catch {
    return toFaDigits(
      value
    );
  }
}


function emptyForm() {
  return {
    id:
      null,

    username:
      "",

    displayName:
      "",

    password:
      "",

    active:
      true,

    allPerformances:
      false,

    performanceIds:
      [],
  };
}


export default function CheckerManager() {
  const [
    users,
    setUsers,
  ] =
    useState([]);

  const [
    performances,
    setPerformances,
  ] =
    useState([]);

  const [
    form,
    setForm,
  ] =
    useState(
      emptyForm()
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    resetPassword,
    setResetPassword,
  ] =
    useState("");

  const [
    resetBusy,
    setResetBusy,
  ] =
    useState(false);


  async function load() {
    setLoading(
      true
    );

    setError(
      ""
    );


    try {
      const data =
        await readJson(
          await fetch(
            "/api/admin/checkers",
            {
              credentials:
                "include",
            }
          )
        );


      setUsers(
        Array.isArray(
          data.users
        )
          ? data.users
          : []
      );

      setPerformances(
        Array.isArray(
          data.performances
        )
          ? data.performances
          : []
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setLoading(
        false
      );
    }
  }


  useEffect(
    () => {
      load();
    },
    []
  );


  const activeCount =
    useMemo(
      () =>
        users.filter(
          (item) =>
            item.active
        ).length,
      [
        users,
      ]
    );


  const allAccessCount =
    useMemo(
      () =>
        users.filter(
          (item) =>
            item.allPerformances
        ).length,
      [
        users,
      ]
    );


  const editing =
    Boolean(
      form.id
    );


  function update(
    key,
    value
  ) {
    setForm(
      (
        current
      ) => ({
        ...current,
        [key]:
          value,
      })
    );
  }


  function startCreate() {
    setForm(
      emptyForm()
    );

    setResetPassword(
      ""
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );
  }


  function startEdit(
    user
  ) {
    setForm({
      id:
        user.id,

      username:
        user.username,

      displayName:
        user.displayName,

      password:
        "",

      active:
        Boolean(
          user.active
        ),

      allPerformances:
        Boolean(
          user.allPerformances
        ),

      performanceIds:
        Array.isArray(
          user.performanceIds
        )
          ? user.performanceIds
          : [],
    });

    setResetPassword(
      ""
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    window.scrollTo({
      top:
        0,
      behavior:
        "smooth",
    });
  }


  function togglePerformance(
    id
  ) {
    const numericId =
      Number(
        id
      );


    setForm(
      (
        current
      ) => {
        const set =
          new Set(
            current.performanceIds
          );


        if (
          set.has(
            numericId
          )
        ) {
          set.delete(
            numericId
          );

        } else {
          set.add(
            numericId
          );
        }


        return {
          ...current,

          performanceIds:
            [
              ...set,
            ],
        };
      }
    );
  }


  async function save(
    event
  ) {
    event.preventDefault();

    setSaving(
      true
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );


    try {
      const body = {
        displayName:
          form.displayName,

        active:
          form.active,

        allPerformances:
          form.allPerformances,

        performanceIds:
          form.allPerformances
            ? []
            : form.performanceIds,
      };


      let response;


      if (
        editing
      ) {
        response =
          await fetch(
            `/api/admin/checkers/${form.id}`,
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
                JSON.stringify(
                  body
                ),
            }
          );

      } else {
        response =
          await fetch(
            "/api/admin/checkers",
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
                  ...body,

                  username:
                    form.username,

                  password:
                    form.password,
                }),
            }
          );
      }


      await readJson(
        response
      );


      setSuccess(
        editing
          ? "تغییرات مسئول سالن ذخیره شد."
          : "حساب مسئول سالن ساخته شد."
      );


      setForm(
        emptyForm()
      );

      setResetPassword(
        ""
      );

      await load();

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setSaving(
        false
      );
    }
  }


  async function changePassword() {
    if (
      !editing ||
      resetPassword.length <
        10
    ) {
      return;
    }


    setResetBusy(
      true
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );


    try {
      await readJson(
        await fetch(
          `/api/admin/checkers/${form.id}/reset-password`,
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
                password:
                  resetPassword,
              }),
          }
        )
      );


      setResetPassword(
        ""
      );

      setSuccess(
        "رمز عبور مسئول سالن تغییر کرد."
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setResetBusy(
        false
      );
    }
  }


  return (
    <div
      dir="rtl"
      className="checker-manager"
    >
      <AdminPageHeader
        eyebrow="دسترسی روز اجرا"
        eyebrowIcon={
          UserRoundCog
        }
        title="مسئولان کنترل بلیت"
        description="ساخت حساب مستقل، تعیین اجرای مجاز و مدیریت دسترسی مسئولان پذیرش سالن"
      />


      {error && (
        <div className="checker-manager__message is-error">
          {error}
        </div>
      )}


      {success && (
        <div className="checker-manager__message is-success">
          <Check
            size={17}
          />

          {success}
        </div>
      )}


      <section className="checker-manager__metrics">
        <AdminMetricCard
          title="کل مسئولان"
          value={
            faNumber(
              users.length
            )
          }
          icon={
            UserRoundCog
          }
        />

        <AdminMetricCard
          title="حساب فعال"
          value={
            faNumber(
              activeCount
            )
          }
          icon={
            UserCheck
          }
          tone="success"
        />

        <AdminMetricCard
          title="دسترسی همه اجراها"
          value={
            faNumber(
              allAccessCount
            )
          }
          icon={
            TicketCheck
          }
        />
      </section>


      <div className="checker-manager__layout">
        <form
          onSubmit={
            save
          }
          className="checker-manager__form-card"
        >
          <div className="checker-manager__form-head">
            <div>
              <span>
                {editing
                  ? "ویرایش حساب"
                  : "حساب جدید"}
              </span>

              <h2>
                {editing
                  ? form.displayName ||
                    form.username
                  : "افزودن مسئول سالن"}
              </h2>
            </div>


            {editing && (
              <button
                type="button"
                onClick={
                  startCreate
                }
                className="checker-manager__ghost"
              >
                <X
                  size={16}
                />
                انصراف
              </button>
            )}
          </div>


          <div className="checker-manager__fields">
            <label>
              <span>
                نام کاربری
              </span>

              <input
                dir="ltr"
                value={
                  form.username
                }
                disabled={
                  editing
                }
                onChange={
                  (event) =>
                    update(
                      "username",
                      event
                        .target
                        .value
                        .toLowerCase()
                    )
                }
                placeholder="checker4"
                autoComplete="off"
              />
            </label>


            <label>
              <span>
                نام نمایشی
              </span>

              <input
                value={
                  form.displayName
                }
                onChange={
                  (event) =>
                    update(
                      "displayName",
                      event
                        .target
                        .value
                    )
                }
                placeholder="مثلاً مسئول ورودی شرقی"
              />
            </label>


            {!editing && (
              <label>
                <span>
                  رمز عبور اولیه
                </span>

                <input
                  dir="ltr"
                  type="password"
                  value={
                    form.password
                  }
                  onChange={
                    (event) =>
                      update(
                        "password",
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="حداقل ۱۰ کاراکتر"
                  autoComplete="new-password"
                />
              </label>
            )}
          </div>


          <label className="checker-manager__toggle">
            <input
              type="checkbox"
              checked={
                form.active
              }
              onChange={
                (event) =>
                  update(
                    "active",
                    event
                      .target
                      .checked
                  )
              }
            />

            <span className="checker-manager__toggle-box">
              <BadgeCheck
                size={17}
              />
            </span>

            <span>
              <strong>
                حساب فعال باشد
              </strong>

              <small>
                حساب غیرفعال فوراً امکان ورود و استفاده از Session قبلی را از دست می‌دهد.
              </small>
            </span>
          </label>


          <label className="checker-manager__toggle">
            <input
              type="checkbox"
              checked={
                form.allPerformances
              }
              onChange={
                (event) =>
                  update(
                    "allPerformances",
                    event
                      .target
                      .checked
                  )
              }
            />

            <span className="checker-manager__toggle-box">
              <ShieldCheck
                size={17}
              />
            </span>

            <span>
              <strong>
                دسترسی به همه اجراها
              </strong>

              <small>
                برای مسئول عمومی پذیرش. در غیر این صورت اجراهای مجاز را پایین انتخاب کن.
              </small>
            </span>
          </label>


          {!form.allPerformances && (
            <section className="checker-manager__performance-box">
              <div className="checker-manager__performance-title">
                <CalendarDays
                  size={18}
                />

                <div>
                  <strong>
                    اجراهای مجاز
                  </strong>

                  <span>
                    مسئول فقط این اجراها را در صفحه QR خواهد دید.
                  </span>
                </div>
              </div>


              {performances.length ===
                0 ? (
                <div className="checker-manager__empty-performances">
                  اجرایی ثبت نشده است.
                </div>

              ) : (
                <div className="checker-manager__performance-list">
                  {performances.map(
                    (item) => {
                      const selected =
                        form.performanceIds.includes(
                          Number(
                            item.id
                          )
                        );


                      return (
                        <label
                          key={
                            item.id
                          }
                          className={[
                            "checker-manager__performance-item",
                            selected
                              ? "is-selected"
                              : "",
                          ].join(
                            " "
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selected
                            }
                            onChange={() =>
                              togglePerformance(
                                item.id
                              )
                            }
                          />

                          <span>
                            <strong>
                              {item.label ||
                                item.productionTitle ||
                                `اجرا ${faNumber(
                                  item.id
                                )}`}
                            </strong>

                            <small>
                              {[
                                item.productionTitle,
                                toFaDigits(
                                  item.date ||
                                  ""
                                ),
                                toFaDigits(
                                  item.time ||
                                  ""
                                ),
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " — "
                                )}
                            </small>
                          </span>
                        </label>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}


          <button
            type="submit"
            disabled={
              saving
            }
            className="checker-manager__save"
          >
            <Save
              size={18}
            />

            {saving
              ? "در حال ذخیره..."
              : editing
                ? "ذخیره تغییرات"
                : "ساخت حساب"}
          </button>


          {editing && (
            <section className="checker-manager__password-reset">
              <div>
                <KeyRound
                  size={18}
                />

                <strong>
                  تغییر رمز عبور
                </strong>
              </div>

              <div className="checker-manager__password-row">
                <input
                  dir="ltr"
                  type="password"
                  value={
                    resetPassword
                  }
                  onChange={
                    (event) =>
                      setResetPassword(
                        event
                          .target
                          .value
                      )
                  }
                  placeholder="رمز جدید، حداقل ۱۰ کاراکتر"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  disabled={
                    resetBusy ||
                    resetPassword.length <
                      10
                  }
                  onClick={
                    changePassword
                  }
                >
                  <KeyRound
                    size={16}
                  />

                  {resetBusy
                    ? "..."
                    : "تغییر رمز"}
                </button>
              </div>
            </section>
          )}
        </form>


        <section className="checker-manager__users-card">
          <div className="checker-manager__list-head">
            <div>
              <span>
                حساب‌های موجود
              </span>

              <strong>
                {faNumber(
                  users.length
                )} مسئول
              </strong>
            </div>

            <button
              type="button"
              onClick={
                load
              }
              disabled={
                loading
              }
              className="checker-manager__refresh"
            >
              <RefreshCw
                size={16}
              />
              بروزرسانی
            </button>
          </div>


          {loading ? (
            <div className="checker-manager__loading">
              در حال دریافت حساب‌ها...
            </div>

          ) : users.length ===
            0 ? (
            <AdminEmptyState
              icon={
                UserRoundCog
              }
              title="مسئول سالنی ثبت نشده است"
              description="اولین حساب مسئول کنترل بلیت را از فرم همین صفحه بساز."
            />

          ) : (
            <div className="checker-manager__user-list">
              {users.map(
                (user) => (
                  <article
                    key={
                      user.id
                    }
                    className={[
                      "checker-manager__user",
                      !user.active
                        ? "is-disabled"
                        : "",
                    ].join(
                      " "
                    )}
                  >
                    <div className="checker-manager__user-main">
                      <div className="checker-manager__avatar">
                        {user.active ? (
                          <UserCheck
                            size={20}
                          />
                        ) : (
                          <UserX
                            size={20}
                          />
                        )}
                      </div>


                      <div>
                        <strong>
                          {user.displayName}
                        </strong>

                        <code
                          dir="ltr"
                          data-keep-latin-digits="true"
                        >
                          {user.username}
                        </code>
                      </div>
                    </div>


                    <div className="checker-manager__badges">
                      <AdminStatusBadge
                        tone={
                          user.active
                            ? "success"
                            : "danger"
                        }
                      >
                        {user.active
                          ? "فعال"
                          : "غیرفعال"}
                      </AdminStatusBadge>

                      <AdminStatusBadge>
                        {user.allPerformances
                          ? "همه اجراها"
                          : `${faNumber(
                              user
                                .performanceIds
                                ?.length ||
                              0
                            )} اجرا`}
                      </AdminStatusBadge>
                    </div>


                    <div className="checker-manager__activity">
                      <span>
                        آخرین ورود
                        <strong>
                          {formatDateTime(
                            user.lastLoginAt
                          )}
                        </strong>
                      </span>

                      <span>
                        آخرین بررسی بلیت
                        <strong>
                          {formatDateTime(
                            user.lastScanAt
                          )}
                        </strong>
                      </span>
                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        startEdit(
                          user
                        )
                      }
                      className="checker-manager__edit"
                    >
                      <Pencil
                        size={16}
                      />
                      مدیریت حساب
                    </button>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}