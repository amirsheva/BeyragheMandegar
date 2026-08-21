import { createReservation } from "./api";

export async function submitReservation(payload) {
  return createReservation(payload);
}
