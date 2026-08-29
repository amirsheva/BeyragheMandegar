import {
  useEffect,
  useState,
} from "react";

import {
  Moon,
  Sun,
} from "lucide-react";


const STORAGE_KEY =
  "beyragh-theme";


function getInitialTheme() {
  const current =
    document.documentElement
      .getAttribute(
        "data-theme"
      );


  if (
    current === "light" ||
    current === "dark"
  ) {
    return current;
  }


  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (
      stored === "light" ||
      stored === "dark"
    ) {
      return stored;
    }
  } catch {
  }


  return window.matchMedia?.(
    "(prefers-color-scheme: light)"
  ).matches
    ? "light"
    : "dark";
}


function applyTheme(theme) {
  document.documentElement
    .setAttribute(
      "data-theme",
      theme
    );


  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      theme
    );
  } catch {
  }
}


export default function ThemeToggle() {
  const [
    theme,
    setTheme,
  ] = useState(
    getInitialTheme
  );


  useEffect(() => {
    applyTheme(
      theme
    );
  }, [
    theme,
  ]);


  const light =
    theme === "light";


  return (
    <button
      type="button"
      className="ui-icon-button"
      onClick={() =>
        setTheme(
          light
            ? "dark"
            : "light"
        )
      }
      aria-label={
        light
          ? "فعال کردن حالت تیره"
          : "فعال کردن حالت روشن"
      }
      aria-pressed={
        light
      }
    >
      {light ? (
        <Moon
          size={20}
          strokeWidth={1.9}
        />
      ) : (
        <Sun
          size={20}
          strokeWidth={1.9}
        />
      )}
    </button>
  );
}