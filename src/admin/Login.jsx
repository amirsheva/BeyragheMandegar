import {
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LogIn,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";

import {
  AdminButton,
} from "./ui/AdminPrimitives";

import {
  toFaDigits,
} from "./ui/formatFa";

import "./admin-auth.css";


const THEME_KEYS = [
  "beyragh-admin-theme",
  "admin-theme",
  "adminTheme",
];


function resolveTheme() {
  const current =
    document.documentElement
      .getAttribute(
        "data-admin-theme"
      );

  if (
    current === "light" ||
    current === "dark"
  ) {
    return current;
  }


  for (
    const key of
    THEME_KEYS
  ) {
    const value =
      localStorage.getItem(
        key
      );

    if (
      value === "light" ||
      value === "dark"
    ) {
      return value;
    }
  }


  return window.matchMedia?.(
    "(prefers-color-scheme: light)"
  ).matches
    ? "light"
    : "dark";
}


function applyTheme(
  theme
) {
  document.documentElement
    .setAttribute(
      "data-admin-theme",
      theme
    );

  for (
    const key of
    THEME_KEYS
  ) {
    localStorage.setItem(
      key,
      theme
    );
  }
}


export default function Login({
  onLogin,
}) {
  const [
    username,
    setUsername,
  ] = useState("admin");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    theme,
    setTheme,
  ] = useState(
    resolveTheme
  );


  useEffect(() => {
    applyTheme(
      theme
    );
  }, [
    theme,
  ]);


  async function submit(
    event
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/auth/login",
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
                username,
                password,
              }),
          }
        );


      const data =
        await response
          .json()
          .catch(
            () => ({})
          );


      if (!response.ok) {
        throw new Error(
          data.message ||
          "ورود ناموفق بود."
        );
      }


      onLogin(
        data.user
      );

    } catch (err) {
      setError(
        err.message
      );

    } finally {
      setLoading(false);
    }
  }


  const light =
    theme === "light";


  return (
    <main
      dir="rtl"
      className="admin-shell admin-login-page"
    >
      <button
        type="button"
        className="admin-login-theme"
        onClick={() =>
          setTheme(
            light
              ? "dark"
              : "light"
          )
        }
        aria-label={
          light
            ? "فعال‌کردن حالت تیره"
            : "فعال‌کردن حالت روشن"
        }
      >
        {light ? (
          <Moon
            size={19}
          />
        ) : (
          <Sun
            size={19}
          />
        )}
      </button>


      <section className="admin-login-card">

        <div className="admin-login-brand">
          <div className="admin-login-brand__icon">
            <ShieldCheck
              size={24}
              strokeWidth={1.8}
            />
          </div>

          <div>
            <span>
              بیرق ماندگار
            </span>

            <strong>
              مرکز مدیریت
            </strong>
          </div>
        </div>


        <header className="admin-login-heading">
          <span>
            دسترسی مدیریت
          </span>

          <h1>
            ورود به پنل
          </h1>

          <p>
            برای مدیریت نمایش‌ها، اجراها، رزروها و محتوای سایت وارد حساب مدیریت شوید.
          </p>
        </header>


        {error && (
          <div className="admin-login-error">
            {toFaDigits(
              error
            )}
          </div>
        )}


        <form
          onSubmit={
            submit
          }
          className="admin-login-form"
        >
          <label className="admin-login-field">

            <span>
              نام کاربری
            </span>

            <input
              value={
                toFaDigits(
                  username
                )
              }
              onChange={
                (event) =>
                  setUsername(
                    event
                      .target
                      .value
                  )
              }
              autoComplete="username"
              required
            />

          </label>


          <label className="admin-login-field">

            <span>
              رمز عبور
            </span>

            <div className="admin-login-password">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={
                  password
                }
                onChange={
                  (event) =>
                    setPassword(
                      event
                        .target
                        .value
                    )
                }
                autoComplete="current-password"
                required
                autoFocus
                dir="ltr"
              />


              <button
                type="button"
                className="admin-login-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (value) =>
                      !value
                  )
                }
                aria-pressed={
                  showPassword
                }
                aria-label={
                  showPassword
                    ? "مخفی کردن رمز عبور"
                    : "نمایش رمز عبور"
                }
              >
                {showPassword ? (
                  <EyeOff
                    size={18}
                  />
                ) : (
                  <Eye
                    size={18}
                  />
                )}

                <span>
                  {showPassword
                    ? "مخفی"
                    : "نمایش"}
                </span>
              </button>

            </div>
          </label>


          <AdminButton
            type="submit"
            tone="primary"
            icon={LogIn}
            disabled={
              loading
            }
            className="admin-login-submit"
          >
            {loading
              ? "در حال ورود..."
              : "ورود به مدیریت"}
          </AdminButton>

        </form>

      </section>
    </main>
  );
}
