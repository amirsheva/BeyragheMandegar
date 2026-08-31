async function request(
  path,
  options = {}
) {
  const response =
    await fetch(
      `/api/admin/sms${path}`,
      {
        headers: {
          "Content-Type":
            "application/json",

          ...options.headers,
        },

        ...options,
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {
    throw new Error(
      data.message ||
        "خطا در ارتباط با سامانه پیامک"
    );
  }


  return data;
}


export function getSmsDashboard() {
  return request(
    "/dashboard"
  );
}


export function getSmsMessages() {
  return request(
    "/messages"
  );
}


export function sendSms({
  phone,
  message,
}) {
  return request(
    "/send",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          phone,
          message,
        }),
    }
  );
}


export function retrySms(
  id
) {
  return request(
    `/messages/${id}/retry`,
    {
      method:
        "POST",
    }
  );
}


export function getSmsTemplates() {
  return request(
    "/templates"
  );
}


export function updateSmsTemplate(
  id,
  payload
) {
  return request(
    `/templates/${id}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}


export function sendSmsirSandboxVerify({
  phone,
  code,
}) {
  return request(
    "/sandbox/verify",
    {
      method:
        "POST",

      body:
        JSON.stringify({
          phone,
          code,
        }),
    }
  );
}


export function refreshSmsDelivery(
  id
) {
  return request(
    `/messages/${id}/refresh-delivery`,
    {
      method:
        "POST",
    }
  );
}
