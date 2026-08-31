import {
  useEffect,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import SiteHeader from "../../ui/SiteHeader";
import SiteFooter from "../../ui/SiteFooter";

export default function AppShell({
  children,
}) {
  const location =
    useLocation();

  useEffect(() => {
    if (location.hash) {
      requestAnimationFrame(
        () => {
          const element =
            document.getElementById(
              location.hash.slice(1)
            );

          if (element) {
            element.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }
      );

      return;
    }

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [
    location.pathname,
    location.hash,
  ]);

  return (
    <div
      className="site-shell"
      dir="rtl"
    >
      <SiteHeader />

      <div className="site-main">
        {children ?? <Outlet />}
      </div>

      <SiteFooter />
    </div>
  );
}
