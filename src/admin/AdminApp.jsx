import AdminLayout from "./AdminLayout";
import Dashboard from "./Dashboard";
import ShowManager from "./ShowManager";
import PerformanceManager from "./PerformanceManager";
import ReservationManager from "./ReservationManager";
import NewsManager from "./NewsManager";

export default function AdminApp() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  let page;

  switch (path) {
    case "/admin":
      page = <Dashboard />;
      break;
    case "/admin/shows":
      page = <ShowManager />;
      break;
    case "/admin/performances":
      page = <PerformanceManager />;
      break;
    case "/admin/reservations":
      page = <ReservationManager />;
      break;
    case "/admin/news":
      page = <NewsManager />;
      break;
    default:
      page = (
        <div dir="rtl">
          <h2 className="text-3xl font-bold mb-4">صفحه یافت نشد</h2>
          <p className="text-white/60">مسیر موردنظر در پنل مدیریت وجود ندارد.</p>
        </div>
      );
  }

  return <AdminLayout>{page}</AdminLayout>;
}
