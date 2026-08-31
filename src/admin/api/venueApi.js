async function request(
  url,
  options = {}
) {
  const response =
    await fetch(
      `/api/admin${url}`,
      {
        credentials: "include",

        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
        "خطا در ارتباط با سرور"
    );
  }

  return data;
}


export function getVenues() {
  return request("/venues");
}


export function createVenue(
  payload
) {
  return request(
    "/venues",
    {
      method: "POST",
      body:
        JSON.stringify(payload),
    }
  );
}


export function updateVenue(
  id,
  payload
) {
  return request(
    `/venues/${id}`,
    {
      method: "PUT",
      body:
        JSON.stringify(payload),
    }
  );
}


export function deleteVenue(id) {
  return request(
    `/venues/${id}`,
    {
      method: "DELETE",
    }
  );
}
