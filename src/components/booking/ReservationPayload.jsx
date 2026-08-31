export function buildReservationPayload(show, form) {
  return {
    name: form?.name || "",
    phone: form?.phone || "",
    nationalId: form?.nationalId || "",
    count: Number(form?.count || 1),
    showtime: {
      showtimeId: show?.id
    }
  };
}
