const BASE_URL =
  process.env.TEST_BASE_URL ||
  "http://127.0.0.1:4017";


async function json(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}


async function run() {
  console.log("");
  console.log(
    "🧪 Admin authentication"
  );


  const anonymous =
    await fetch(
      `${BASE_URL}/api/admin/dashboard/stats`
    );


  if (
    anonymous.status !== 401
  ) {
    throw new Error(
      `Unauthenticated Admin API must return 401, got ${anonymous.status}`
    );
  }

  console.log(
    "✅ Anonymous Admin request rejected."
  );


  const badLogin =
    await fetch(
      `${BASE_URL}/api/auth/login`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            username:
              process.env.ADMIN_USERNAME,

            password:
              "Wrong-Password-123",
          }),
      }
    );


  if (
    badLogin.status !== 401
  ) {
    throw new Error(
      `Wrong password must return 401, got ${badLogin.status}`
    );
  }

  console.log(
    "✅ Invalid Admin password rejected."
  );


  const login =
    await fetch(
      `${BASE_URL}/api/auth/login`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            username:
              process.env.ADMIN_USERNAME,

            password:
              process.env.TEST_ADMIN_PASSWORD,
          }),
      }
    );


  const loginData =
    await json(login);


  if (
    login.status !== 200 ||
    !loginData.ok
  ) {
    throw new Error(
      `Admin login failed: ${login.status} ${JSON.stringify(loginData)}`
    );
  }


  const setCookie =
    login.headers.get(
      "set-cookie"
    );


  if (!setCookie) {
    throw new Error(
      "Admin session cookie was not returned."
    );
  }


  const cookie =
    setCookie.split(";")[0];


  const me =
    await fetch(
      `${BASE_URL}/api/auth/me`,
      {
        headers: {
          Cookie:
            cookie,
        },
      }
    );


  if (
    me.status !== 200
  ) {
    throw new Error(
      `/api/auth/me returned ${me.status}`
    );
  }


  const dashboard =
    await fetch(
      `${BASE_URL}/api/admin/dashboard/stats`,
      {
        headers: {
          Cookie:
            cookie,
        },
      }
    );


  if (
    dashboard.status !== 200
  ) {
    const body =
      await json(dashboard);

    throw new Error(
      `Authenticated Admin API failed: ${dashboard.status} ${JSON.stringify(body)}`
    );
  }


  console.log(
    "✅ Admin login creates valid session."
  );

  console.log(
    "✅ Protected Admin API accepts valid session."
  );
}


run().catch((error) => {
  console.error(
    "❌ Admin auth test failed:",
    error
  );

  process.exitCode = 1;
});