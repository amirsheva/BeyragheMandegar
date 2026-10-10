import { config } from "./config";

// All app code calls relative "/api/..." paths. When an API base URL is
// configured, rewrite those calls to the API server and send cookies along,
// since admin/customer sessions are cookie-based.
export function installApiBase() {
  const base = config.apiBaseUrl;

  if (!base || typeof window === "undefined" || window.__apiBaseInstalled) {
    return;
  }

  window.__apiBaseInstalled = true;

  const nativeFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (typeof input === "string" && (input === "/api" || input.startsWith("/api/") || input.startsWith("/api?"))) {
      return nativeFetch(base + input, {
        credentials: "include",
        ...init,
      });
    }

    return nativeFetch(input, init);
  };
}
