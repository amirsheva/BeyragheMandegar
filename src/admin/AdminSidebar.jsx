import {
  CalendarDays,
  ExternalLink,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Ticket,
} from "lucide-react";

import {
  adminNavigation,
} from "./navigation";

import AdminThemeToggle from "./AdminThemeToggle";

const meta = {
  "/admin": {
    subtitle:
      "نمای کلی سامانه",
    icon:
      LayoutDashboard,
  },

  "/admin/shows": {
    subtitle:
      "مدیریت آثار نمایشی",
    icon:
      FileText,
  },

  "/admin/performances": {
    subtitle:
      "زمان‌بندی و ظرفیت",
    icon:
      CalendarDays,
  },

  "/admin/venues": {
    subtitle:
      "سالن، آدرس و مسیریابی",
    icon:
      MapPin,
  },

  "/admin/reservations": {
    subtitle:
      "مدیریت مخاطبان و بلیت‌ها",
    icon:
      Ticket,
  },

  "/admin/news": {
    subtitle:
      "اطلاعیه‌ها و محتوا",
    icon:
      FileText,
  },

  "/admin/sms": {
    subtitle:
      "ارسال و پایش پیام‌ها",
    icon:
      MessageSquare,
  },
};

function normalizePath(
  path
) {
  if (!path) {
    return "/admin";
  }

  if (
    path.length > 1 &&
    path.endsWith("/")
  ) {
    return path.slice(
      0,
      -1
    );
  }

  return path;
}

function activePath(
  itemPath
) {
  const current =
    normalizePath(
      window.location.pathname
    );

  const target =
    normalizePath(
      itemPath
    );

  if (
    target ===
    "/admin"
  ) {
    return (
      current ===
      "/admin"
    );
  }

  return (
    current === target ||
    current.startsWith(
      `${target}/`
    )
  );
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

export default function AdminSidebar({
  user,
  onLogout,
}) {
  const base =
    publicBase();

  const quickLinks = [
    {
      title:
        "صفحه اصلی",
      href:
        `${base}/`,
      icon:
        Home,
    },
    {
      title:
        "اجراها",
      href:
        `${base}/#performances`,
      icon:
        CalendarDays,
    },
    {
      title:
        "اخبار سایت",
      href:
        `${base}/news`,
      icon:
        FileText,
    },
    {
      title:
        "رزرو بلیت",
      href:
        `${base}/booking`,
      icon:
        Ticket,
    },
  ];

  return (
    <aside
      className="admin-sidebar"
      dir="rtl"
    >
      <div className="admin-sidebar__top">

        <div className="admin-brand">

          <div className="admin-brand__icon">
            <ShieldCheck
              size={24}
              strokeWidth={1.8}
            />
          </div>

          <div className="admin-brand__text">
            <strong>
              بیرق ماندگار
            </strong>

            <span>
              مرکز مدیریت
            </span>
          </div>

          <AdminThemeToggle />

        </div>

        <nav
          className="admin-nav"
          aria-label="منوی مدیریت"
        >
          {adminNavigation.map(
            (item) => {
              const details =
                meta[item.path] ||
                {};

              const Icon =
                details.icon ||
                FileText;

              const active =
                activePath(
                  item.path
                );

              return (
                <a
                  key={
                    item.path
                  }
                  href={
                    item.path
                  }
                  className={[
                    "admin-nav__item",
                    active
                      ? "is-active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >

                  <div className="admin-nav__icon">
                    <Icon
                      size={21}
                      strokeWidth={1.75}
                    />
                  </div>

                  <div className="admin-nav__copy">
                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      {
                        details.subtitle ||
                        ""
                      }
                    </span>
                  </div>

                </a>
              );
            }
          )}
        </nav>

      </div>

      <div className="admin-sidebar__bottom">

        <section className="admin-account-card">
          <span>
            حساب فعال
          </span>

          <strong>
            {
              user?.username ||
              user?.name ||
              "admin"
            }
          </strong>
        </section>

        <section className="admin-quick-card">

          <div className="admin-quick-card__title">
            دسترسی سریع به سایت
          </div>

          <div className="admin-quick-links">

            {quickLinks.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <a
                    key={
                      item.title
                    }
                    href={
                      item.href
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="admin-quick-link"
                  >
                    <span className="admin-quick-link__main">
                      <Icon
                        size={19}
                        strokeWidth={1.8}
                      />

                      {
                        item.title
                      }
                    </span>

                    <ExternalLink
                      size={15}
                      strokeWidth={1.7}
                    />
                  </a>
                );
              }
            )}

          </div>
        </section>

        <button
          type="button"
          className="admin-logout"
          onClick={
            onLogout
          }
        >
          <LogOut
            size={21}
            strokeWidth={1.8}
          />

          خروج از مدیریت
        </button>

      </div>
    </aside>
  );
}
