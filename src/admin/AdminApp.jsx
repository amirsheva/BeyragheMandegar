import {
  useEffect,
  useState,
} from "react";

import AdminLayout from "./AdminLayout";
import Dashboard from "./Dashboard";
import ShowManager from "./ShowManager";
import PerformanceManager from "./PerformanceManager";
import ReservationManager from "./ReservationManager";
import NewsManager from "./NewsManager";
import VenueManager from "./VenueManager";
import SmsManager from "./SmsManager";
import Login from "./Login";
import "./admin-auth.css";


export default function AdminApp() {
  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);

  const [
    user,
    setUser,
  ] = useState(null);


  async function checkAuth() {
    try {
      const res =
        await fetch(
          "/api/auth/me"
        );

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data =
        await res.json();

      setUser(
        data.user ||
          null
      );

    } catch {
      setUser(null);

    } finally {
      setAuthLoading(
        false
      );
    }
  }


  useEffect(() => {
    checkAuth();
  }, []);


  async function logout() {
    try {
      await fetch(
        "/api/auth/logout",
        {
          method:
            "POST",
        }
      );

    } finally {
      setUser(null);
    }
  }


  if (authLoading) {
    return (
      <div
        dir="rtl"
        className="admin-shell admin-auth-loading"
      >
        <div className="admin-auth-loading__content">
          <div className="admin-auth-loading__spinner" />

          <span>
            ?? ??? ????? ??????...
          </span>
        </div>
      </div>
    );
  }


  if (!user) {
    return (
      <Login
        onLogin={
          setUser
        }
      />
    );
  }


  const path =
    window.location.pathname.replace(
      /\/+$/,
      ""
    ) || "/";


  let page;


  switch (path) {
    case "/admin":
      page =
        <Dashboard />;
      break;

    case "/admin/shows":
      page =
        <ShowManager />;
      break;

    case "/admin/performances":
      page =
        <PerformanceManager />;
      break;

    case "/admin/venues":
      page =
        <VenueManager />;
      break;

    case "/admin/reservations":
      page =
        <ReservationManager />;
      break;

    case "/admin/news":
      page =
        <NewsManager />;
      break;

    case "/admin/sms":
      page =
        <SmsManager />;
      break;

    default:
      page = (
        <div dir="rtl">
          <h2
            className="
              text-3xl
              font-black
              text-[#efe5dd]
            "
          >
            صفحه یافت نشد
          </h2>

          <p
            className="
              mt-3
              text-[#8f847d]
            "
          >
            مسیر موردنظر در پنل مدیریت وجود ندارد.
          </p>
        </div>
      );
  }


  return (
    <AdminLayout
      user={user}
      onLogout={
        logout
      }
      currentPath={
        path
      }
    >
      {page}
    </AdminLayout>
  );
}
