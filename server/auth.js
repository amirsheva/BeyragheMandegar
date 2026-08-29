import "dotenv/config";

import {
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "crypto";

const COOKIE_NAME = "bm_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function safeEqual(a, b) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function parseCookies(req) {
  const header = req.headers.cookie || "";

  return header
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((cookies, item) => {
      const separator = item.indexOf("=");

      if (separator === -1) {
        return cookies;
      }

      const key = item.slice(0, separator);
      const value = item.slice(separator + 1);

      cookies[key] = decodeURIComponent(value);

      return cookies;
    }, {});
}

function signPayload(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;

  return createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
}

export function assertAuthConfigured() {
  const {
    ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH,
    ADMIN_SESSION_SECRET,
  } = process.env;

  if (!ADMIN_USERNAME) {
    throw new Error("ADMIN_USERNAME is missing");
  }

  if (!ADMIN_PASSWORD_HASH) {
    throw new Error("ADMIN_PASSWORD_HASH is missing");
  }

  if (
    !ADMIN_SESSION_SECRET ||
    ADMIN_SESSION_SECRET.length < 32
  ) {
    throw new Error(
      "ADMIN_SESSION_SECRET must be at least 32 characters"
    );
  }
}

export function verifyAdminPassword(password) {
  const stored = process.env.ADMIN_PASSWORD_HASH || "";

  const [salt, expectedHash] = stored.split(":");

  if (!salt || !expectedHash || !password) {
    return false;
  }

  const actualHash = scryptSync(
    password,
    salt,
    64
  ).toString("hex");

  return safeEqual(actualHash, expectedHash);
}

export function createSessionToken(username) {
  const now = Math.floor(Date.now() / 1000);

  const payload = base64url(
    JSON.stringify({
      sub: username,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    })
  );

  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token) {
  try {
    if (!token) {
      return null;
    }

    const [payload, signature] = token.split(".");

    if (!payload || !signature) {
      return null;
    }

    const expectedSignature =
      signPayload(payload);

    if (!safeEqual(signature, expectedSignature)) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(
        payload,
        "base64url"
      ).toString("utf8")
    );

    const now = Math.floor(Date.now() / 1000);

    if (!data.exp || data.exp <= now) {
      return null;
    }

    if (
      data.sub !== process.env.ADMIN_USERNAME
    ) {
      return null;
    }

    return data;

  } catch {
    return null;
  }
}

export function setAdminCookie(res, token) {
  res.cookie(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,
      sameSite: "strict",
      secure:
        process.env.NODE_ENV === "production",
      maxAge:
        SESSION_TTL_SECONDS * 1000,
      path: "/",
    }
  );
}

export function clearAdminCookie(res) {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly: true,
      sameSite: "strict",
      secure:
        process.env.NODE_ENV === "production",
      path: "/",
    }
  );
}

export function requireAdmin(
  req,
  res,
  next
) {
  const cookies = parseCookies(req);

  const session =
    verifySessionToken(
      cookies[COOKIE_NAME]
    );

  if (!session) {
    return res.status(401).json({
      message:
        "برای دسترسی به پنل مدیریت وارد شوید.",
    });
  }

  req.admin = {
    username: session.sub,
  };

  next();
}

export function requireAdminOrigin(
  req,
  res,
  next
) {
  if (
    ["GET", "HEAD", "OPTIONS"].includes(
      req.method
    )
  ) {
    return next();
  }

  const origin =
    req.get("origin");

  const expected =
    process.env.ADMIN_ORIGIN ||
    "http://localhost:4000";

  if (
    origin &&
    origin !== expected
  ) {
    return res.status(403).json({
      message:
        "درخواست از مبدأ غیرمجاز ارسال شده است.",
    });
  }

  next();
}
