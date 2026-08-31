import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  Menu,
  X,
} from "lucide-react";

import ThemeToggle from "./ThemeToggle";

import {
  installPersianDigitDisplay,
} from "../theme/persianDigits";


const BRAND_MARK_VARIANT =
  "flag";


function BrandMark({
  variant =
    BRAND_MARK_VARIANT,
}) {
  return (
    <span
      className={`site-brand__mark site-brand__mark--${variant}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
      >
        {variant ===
        "flame" ? (
          <>
            <path
              d="
                M16.2 4.5
                C17.1 8.6 13.6 10.2 14.4 13.6
                C14.8 15.3 16.4 16.4 17.8 17.7
                C19.3 19.1 20.2 20.7 20.2 22.5
                C20.2 25.6 17.9 27.7 14.8 27.7
                C11.3 27.7 8.7 25.2 8.7 21.7
                C8.7 17.5 11.9 12.5 16.2 4.5
              "
            />

            <path
              d="
                M15.9 17.7
                C17.7 19.2 18.7 20.6 18.7 22
                C18.7 24.1 17.1 25.8 15 25.8
                C12.8 25.8 11.1 24.1 11.1 21.9
                C11.1 20.2 12.2 18.6 14.2 16.6
                C14 18.2 14.7 19 15.9 17.7
              "
              opacity=".58"
            />
          </>
        ) : variant ===
          "stage" ? (
          <>
            <path
              d="
                M6 26
                V10
                C6 7.8 7.8 6 10 6
                H22
                C24.2 6 26 7.8 26 10
                V26
              "
            />

            <path
              d="
                M9 9
                C10.7 12.2 13 13.8 16 14.4
              "
            />

            <path
              d="
                M23 9
                C21.3 12.2 19 13.8 16 14.4
              "
            />

            <path
              d="M10 26H22"
              opacity=".7"
            />

            <path
              d="M16 14.4V26"
              opacity=".5"
            />
          </>
        ) : (
          <>
            <path
              d="M9 27V5"
            />

            <path
              d="
                M10 7.2
                C14.8 4.4 18.4 9.7 23.5 6.4
                V17.5
                C18.4 20.9 14.8 15.6 10 18.4
              "
            />

            <path
              d="M9 27H15.2"
              opacity=".55"
            />
          </>
        )}
      </svg>
    </span>
  );
}


const navigation = [
  {
    label:
      "خانه",
    to:
      "/",
  },
  {
    label:
      "اجراها",
    to:
      "/#performances",
  },
  {
    label:
      "درباره ما",
    to:
      "/#about",
  },
  {
    label:
      "اخبار",
    to:
      "/#news",
  },
  {
    label:
      "پیگیری رزرو",
    to:
      "/track",
  },
  {
    label:
      "آرشیو",
    to:
      "/#archive",
  },
];


function isNavigationActive(
  item,
  location
) {
  if (
    item.to === "/"
  ) {
    return (
      location.pathname === "/" &&
      !location.hash
    );
  }


  if (
    item.to.startsWith(
      "/#"
    )
  ) {
    return (
      location.pathname === "/" &&
      location.hash ===
        item.to.slice(1)
    );
  }


  return (
    location.pathname ===
    item.to
  );
}


export default function SiteHeader() {
  const [
    open,
    setOpen,
  ] = useState(false);

  const location =
    useLocation();


  useEffect(() => {
    installPersianDigitDisplay();
  }, []);


  useEffect(() => {
    setOpen(false);
  }, [
    location.pathname,
    location.hash,
  ]);


  return (
    <header
      className="site-header"
      dir="rtl"
    >
      <div
        className="
          ui-container
          site-header__inner
        "
      >
        <Link
          to="/"
          className="site-brand"
          aria-label="بیرق ماندگار؛ صفحه اصلی"
        >
          <BrandMark />

          <span>
            بیرق ماندگار
          </span>
        </Link>


        <nav
          className="site-nav"
          aria-label="ناوبری اصلی"
        >
          {navigation.map(
            (item) => {
              const active =
                isNavigationActive(
                  item,
                  location
                );


              return (
                <Link
                  key={
                    item.to
                  }
                  to={
                    item.to
                  }
                  className={
                    active
                      ? "site-nav__link is-active"
                      : "site-nav__link"
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                >
                  {
                    item.label
                  }
                </Link>
              );
            }
          )}
        </nav>


        <div
          className="site-header__actions"
        >
          <ThemeToggle />


          <Link
            to="/booking"
            className="
              ui-button
              ui-button--primary
              site-header__booking
            "
          >
            رزرو بلیت
          </Link>


          <button
            type="button"
            className="
              ui-icon-button
              mobile-menu-button
            "
            onClick={() =>
              setOpen(
                (current) =>
                  !current
              )
            }
            aria-label={
              open
                ? "بستن منوی سایت"
                : "باز کردن منوی سایت"
            }
            aria-expanded={
              open
            }
          >
            {open ? (
              <X
                size={20}
              />
            ) : (
              <Menu
                size={20}
              />
            )}
          </button>
        </div>
      </div>


      <div
        className={
          open
            ? "mobile-nav is-open"
            : "mobile-nav"
        }
      >
        <div
          className="
            ui-container
            mobile-nav__inner
          "
        >
          {navigation.map(
            (item) => {
              const active =
                isNavigationActive(
                  item,
                  location
                );


              return (
                <Link
                  key={
                    item.to
                  }
                  to={
                    item.to
                  }
                  className={
                    active
                      ? "mobile-nav__link is-active"
                      : "mobile-nav__link"
                  }
                >
                  {
                    item.label
                  }
                </Link>
              );
            }
          )}


          <Link
            to="/booking"
            className="
              ui-button
              ui-button--primary
              mobile-nav__booking
            "
          >
            رزرو بلیت
          </Link>
        </div>
      </div>
    </header>
  );
}