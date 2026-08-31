export async function api(url, options={}) {
  const res = await fetch(url, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "خطای سرور");
  }

  return data;
}

export const getShows = () => api("/api/shows");

export const createReservation = (payload) =>
  api("/api/reservations", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(payload)
  });
