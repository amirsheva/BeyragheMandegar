async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "خطا در ارتباط با سرور");
  }
  return data;
}

export async function getShows() {
  return readJson(await fetch("/api/admin/shows"));
}

export async function createShow(data) {
  return readJson(
    await fetch("/api/admin/shows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function updateShow(id, data) {
  return readJson(
    await fetch(`/api/admin/shows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function deleteShow(id) {
  return readJson(
    await fetch(`/api/admin/shows/${id}`, {
      method: "DELETE",
    })
  );
}
