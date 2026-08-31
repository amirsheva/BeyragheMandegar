import {
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";

import DashboardStats from "./DashboardStats";

import useDashboardStats from "./hooks/useDashboardStats";

import {
  AdminButton,
  AdminEmptyState,
  AdminPageHeader,
} from "./ui/AdminPrimitives";

import {
  toFaDigits,
} from "./ui/formatFa";

import "./dashboard.css";


export default function Dashboard() {
  const {
    stats,
    loading,
    error,
    refresh,
  } =
    useDashboardStats();


  return (
    <div
      dir="rtl"
      className="dashboard-manager"
    >
      <AdminPageHeader
        eyebrow="نمای کلی سامانه"
        eyebrowIcon={
          LayoutDashboard
        }
        title="داشبورد مدیریت"
        description="نمای کلی وضعیت آثار نمایشی، اجراها، رزروها و ظرفیت سامانه بیرق ماندگار"
        actions={
          <AdminButton
            type="button"
            tone="ghost"
            icon={RefreshCw}
            disabled={
              loading
            }
            onClick={
              refresh
            }
          >
            {loading
              ? "در حال بروزرسانی..."
              : "بروزرسانی"}
          </AdminButton>
        }
      />


      {error && (
        <div className="dashboard-error">
          {toFaDigits(
            error
          )}
        </div>
      )}


      {loading &&
      !stats ? (
        <DashboardLoading />

      ) : !stats &&
        error ? (
        <AdminEmptyState
          icon={
            LayoutDashboard
          }
          title="اطلاعات داشبورد دریافت نشد"
          description="ارتباط با سرویس آمار داشبورد برقرار نشد. دوباره تلاش کنید."
          action={
            <AdminButton
              type="button"
              tone="primary"
              icon={RefreshCw}
              onClick={
                refresh
              }
            >
              تلاش مجدد
            </AdminButton>
          }
        />

      ) : (
        <>
          <DashboardStats
            stats={
              stats || {}
            }
          />

          <section className="dashboard-footnote">
            <div className="dashboard-footnote__icon">
              <LayoutDashboard
                size={20}
                strokeWidth={1.8}
              />
            </div>

            <div>
              <strong>
                آمار سامانه
              </strong>

              <p>
                اطلاعات این صفحه مستقیماً از داده‌های ثبت‌شده نمایش‌ها، اجراها، رزروها و ظرفیت اجراها محاسبه می‌شود.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}


function DashboardLoading() {
  return (
    <div className="dashboard-loading-grid">
      {Array.from({
        length: 6,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={
              index
            }
            className="dashboard-loading-card"
          >
            <div className="dashboard-loading-icon" />

            <div className="dashboard-loading-line is-small" />

            <div className="dashboard-loading-line is-value" />

            <div className="dashboard-loading-line" />
          </div>
        )
      )}
    </div>
  );
}
