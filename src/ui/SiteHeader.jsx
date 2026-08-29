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
      "/news",
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


  if (
    item.to === "/news"
  ) {
    return location.pathname
      .startsWith(
        "/news"
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
      <div className="ui-container site-header__inner">

        <Link
          to="/"
          className="site-brand"
          aria-label="بیرق ماندگار؛ صفحه اصلی"
        >
          <span
            className="site-brand__mark"
            aria-hidden="true"
          />

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


        <div className="site-header__actions">

          <ThemeToggle />


          <Link
            to="/booking"
            className="ui-button ui-button--primary site-header__booking"
          >
            رزرو بلیت
          </Link>


          <button
            type="button"
            className="ui-icon-button mobile-menu-button"
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
        <div className="ui-container mobile-nav__inner">

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
            className="ui-button ui-button--primary mobile-nav__booking"
          >
            رزرو بلیت
          </Link>

        </div>
      </div>
    </header>
  );
}