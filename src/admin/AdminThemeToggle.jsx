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

function initialTheme() {
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

  return "dark";
}

function applyTheme(
  theme
) {
  document.documentElement.setAttribute(
    "data-theme",
    theme
  );

  document.documentElement.setAttribute(
    "data-admin-theme",
    theme
  );

  window.localStorage.setItem(
    STORAGE_KEY,
    theme
  );
}

export default function AdminThemeToggle() {
  const [
    theme,
    setTheme,
  ] = useState(
    initialTheme
  );

  useEffect(() => {
    applyTheme(
      theme
    );
  }, [theme]);

  const light =
    theme === "light";

  return (
    <button
      type="button"
      className="admin-theme-toggle"
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
    >
      {light ? (
        <Moon
          size={19}
          strokeWidth={1.8}
        />
      ) : (
        <Sun
          size={19}
          strokeWidth={1.8}
        />
      )}
    </button>
  );
}
