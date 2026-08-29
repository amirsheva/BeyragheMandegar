import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import "./index.css";
import "./ui/theme.css";
import "./ui/booking-design.css";

import {
  BookingProvider,
} from "./components/booking/BookingContext";


const THEME_KEY =
  "beyragh-theme";


function initializePublicTheme() {
  const root =
    document.documentElement;

  const current =
    root.getAttribute(
      "data-theme"
    );


  if (
    current === "light" ||
    current === "dark"
  ) {
    return;
  }


  let stored = null;

  try {
    stored =
      window.localStorage.getItem(
        THEME_KEY
      );
  } catch {
    stored = null;
  }


  const preferred =
    window.matchMedia?.(
      "(prefers-color-scheme: light)"
    ).matches
      ? "light"
      : "dark";


  const theme =
    stored === "light" ||
    stored === "dark"
      ? stored
      : preferred;


  root.setAttribute(
    "data-theme",
    theme
  );
}


initializePublicTheme();


ReactDOM.createRoot(
  document.getElementById(
    "root"
  )
).render(
  <BrowserRouter>
    <BookingProvider>
      <App />
    </BookingProvider>
  </BrowserRouter>
);