async function readJson(
  response
) {
  const data =
    await response
      .json()
      .catch(
        () => ({})
      );

  if (!response.ok) {
    throw new Error(
      data.message ||
      "خطا در دریافت اطلاعات داشبورد"
    );
  }

  return data;
}


export async function getDashboardStats() {
  return readJson(
    await fetch(
      "/api/admin/dashboard/stats",
      {
        credentials:
          "include",
      }
    )
  );
}
