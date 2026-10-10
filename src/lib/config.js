const DEFAULT_API_BASE_URL = "https://api.beyraghmandegar.ir";

const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const config = {
  // Set VITE_API_BASE_URL="" to use same-origin /api (e.g. the local Vite proxy).
  apiBaseUrl: (envApiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, ""),
  appName: "Beyraghe Mandegar"
};
