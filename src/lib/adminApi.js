import { api } from "./api";

export function getAdminReservations() {
  return api("/api/reservations");
}

export function getAdminStats() {
  return api("/api/admin/stats");
}
