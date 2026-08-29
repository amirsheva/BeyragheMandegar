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
      "خطا در ارتباط با سرور"
    );
  }

  return data;
}


export async function getNews() {
  return readJson(
    await fetch(
      "/api/admin/news",
      {
        credentials:
          "include",
      }
    )
  );
}


export async function createNews(
  data
) {
  return readJson(
    await fetch(
      "/api/admin/news",
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            data
          ),
      }
    )
  );
}


export async function updateNews(
  id,
  data
) {
  return readJson(
    await fetch(
      `/api/admin/news/${id}`,
      {
        method:
          "PUT",

        credentials:
          "include",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            data
          ),
      }
    )
  );
}


export async function deleteNews(
  id
) {
  return readJson(
    await fetch(
      `/api/admin/news/${id}`,
      {
        method:
          "DELETE",

        credentials:
          "include",
      }
    )
  );
}
