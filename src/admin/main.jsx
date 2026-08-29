import React from "react";
import {
  createRoot,
} from "react-dom/client";

import AdminApp from "./AdminApp";


const ADMIN_THEME_KEYS = [
  "beyragh-admin-theme",
  "admin-theme",
  "adminTheme",
];


function initializeAdminTheme() {
  const root =
    document.documentElement;

  const current =
    root.getAttribute(
      "data-admin-theme"
    );


  if (
    current === "light" ||
    current === "dark"
  ) {
    return;
  }


  let stored = null;


  for (
    const key of
    ADMIN_THEME_KEYS
  ) {
    const value =
      localStorage.getItem(
        key
      );

    if (
      value === "light" ||
      value === "dark"
    ) {
      stored = value;
      break;
    }
  }


  const theme =
    stored ||
    (
      window.matchMedia?.(
        "(prefers-color-scheme: light)"
      ).matches
        ? "light"
        : "dark"
    );


  root.setAttribute(
    "data-admin-theme",
    theme
  );
}


initializeAdminTheme();


createRoot(
  document.getElementById(
    "root"
  )
).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>
);
