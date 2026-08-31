async function readJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "خطا در ارتباط با سرور");
  }
  return data;
}

export async function getPerformances() {
  return readJson(await fetch("/api/admin/performances"));
}

export async function createPerformance(data) {
  return readJson(
    await fetch("/api/admin/performances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function updatePerformance(id, data) {
  return readJson(
    await fetch(`/api/admin/performances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
  );
}

export async function deletePerformance(id) {
  return readJson(
    await fetch(`/api/admin/performances/${id}`, {
      method: "DELETE",
    })
  );
}
