import {
  useEffect,
} from "react";

import AdminSidebar from "./AdminSidebar";

import {
  installPersianDigitDisplay,
} from "../theme/persianDigits";

import "./admin-theme.css";
import "./admin-design-system.css";
import "../theme/unified-ui.css";

export default function AdminLayout({
  children,
  page,
  user,
  onLogout,
}) {
  useEffect(() => {
    installPersianDigitDisplay();
  }, []);

  return (
    <div
      className="admin-shell"
      dir="rtl"
    >
      <AdminSidebar
        user={user}
        onLogout={onLogout}
      />

      <main className="admin-content">
        <div className="admin-content__inner">
          {
            children ??
            page ??
            null
          }
        </div>
      </main>
    </div>
  );
}
