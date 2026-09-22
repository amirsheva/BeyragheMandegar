import "dotenv/config";

import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

import {
  sequelize,
} from "./models.js";


const REASONS = new Set([
  "security-incident",
  "identity-verification",
  "legal-request",
  "support-escalation",
  "other",
]);

const DEFAULT_TTL_SECONDS = 300;
const DEFAULT_MAX_REVEALS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

const grants = new Map();
const failures = new Map();
let auditInitPromise = null;


export class BreakGlassError extends Error {
  constructor(
    message,
    {
      statusCode = 400,
      code = "BREAK_GLASS_ERROR",
    } = {}
  ) {
    super(message);
    this.name = "BreakGlassError";
    this.statusCode = statusCode;
    this.code = code;
  }
}


function enabled() {
  return (
    String(
      process.env.BREAK_GLASS_ENABLED ||
      "false"
    )
      .trim()
      .toLowerCase() === "true"
  );
}


function ownerUsername() {
  return String(
    process.env.BREAK_GLASS_OWNER_USERNAME ||
    ""
  ).trim();
}


function ttlSeconds() {
  const value = Number(
    process.env.BREAK_GLASS_TTL_SECONDS ||
    DEFAULT_TTL_SECONDS
  );

  if (!Number.isFinite(value)) {
    return DEFAULT_TTL_SECONDS;
  }

  return Math.min(
    900,
    Math.max(
      60,
      Math.floor(value)
    )
  );
}


function maxReveals() {
  const value = Number(
    process.env.BREAK_GLASS_MAX_REVEALS ||
    DEFAULT_MAX_REVEALS
  );

  if (!Number.isFinite(value)) {
    return DEFAULT_MAX_REVEALS;
  }

  return Math.min(
    10,
    Math.max(
      1,
      Math.floor(value)
    )
  );
}


function safeEqual(a, b) {
  const left = Buffer.from(
    String(a || "")
  );

  const right = Buffer.from(
    String(b || "")
  );

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(
    left,
    right
  );
}


function verifyBreakGlassPassword(
  password
) {
  const stored = String(
    process.env.BREAK_GLASS_PASSWORD_HASH ||
    ""
  ).trim();

  const [salt, expectedHash] =
    stored.split(":");

  if (
    !password ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const actualHash =
    scryptSync(
      String(password),
      salt,
      64
    ).toString("hex");

  return safeEqual(
    actualHash,
    expectedHash
  );
}


function grantDigest(token) {
  return createHash("sha256")
    .update(String(token || ""))
    .digest("hex");
}


function failureKey(
  username,
  ip
) {
  return `${username || "unknown"}|${ip || "unknown"}`;
}


function pruneFailures(key) {
  const now = Date.now();

  const next = (
    failures.get(key) || []
  ).filter(
    (timestamp) =>
      now - timestamp < ATTEMPT_WINDOW_MS
  );

  if (next.length) {
    failures.set(
      key,
      next
    );
  } else {
    failures.delete(key);
  }

  return next;
}


function assertRateAllowed(key) {
  const recent =
    pruneFailures(key);

  if (
    recent.length >=
    MAX_FAILED_ATTEMPTS
  ) {
    throw new BreakGlassError(
      "تعداد تلاش‌های ناموفق بیش از حد مجاز است. چند دقیقه بعد دوباره تلاش کنید.",
      {
        statusCode: 429,
        code: "BREAK_GLASS_RATE_LIMITED",
      }
    );
  }
}


function recordFailure(key) {
  const recent =
    pruneFailures(key);

  recent.push(
    Date.now()
  );

  failures.set(
    key,
    recent
  );
}


function assertConfigured() {
  if (!enabled()) {
    throw new BreakGlassError(
      "دسترسی اضطراری فعال نیست.",
      {
        statusCode: 403,
        code: "BREAK_GLASS_DISABLED",
      }
    );
  }

  if (!ownerUsername()) {
    throw new BreakGlassError(
      "مالک دسترسی اضطراری تنظیم نشده است.",
      {
        statusCode: 503,
        code: "BREAK_GLASS_OWNER_MISSING",
      }
    );
  }

  if (
    !String(
      process.env.BREAK_GLASS_PASSWORD_HASH ||
      ""
    ).includes(":")
  ) {
    throw new BreakGlassError(
      "رمز مستقل دسترسی اضطراری تنظیم نشده است.",
      {
        statusCode: 503,
        code: "BREAK_GLASS_PASSWORD_MISSING",
      }
    );
  }
}


export function getBreakGlassStatus(
  username
) {
  const isOwner =
    Boolean(username) &&
    username === ownerUsername();

  return {
    enabled:
      enabled() && isOwner,
    ttlSeconds:
      ttlSeconds(),
    maxReveals:
      maxReveals(),
    reasons:
      [
        ...REASONS,
      ],
  };
}


export function ensureBreakGlassAuditTable() {
  if (!auditInitPromise) {
    auditInitPromise =
      sequelize.query(`
        CREATE TABLE IF NOT EXISTS pii_access_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          actor TEXT NOT NULL,
          action TEXT NOT NULL,
          reservation_id TEXT,
          reason_code TEXT,
          status_code INTEGER NOT NULL,
          ip TEXT,
          user_agent TEXT
        )
      `);
  }

  return auditInitPromise;
}


export async function writeBreakGlassAudit({
  actor,
  action,
  reservationId = null,
  reasonCode = null,
  statusCode,
  ip = null,
  userAgent = null,
}) {
  await ensureBreakGlassAuditTable();

  await sequelize.query(
    `
      INSERT INTO pii_access_logs (
        actor,
        action,
        reservation_id,
        reason_code,
        status_code,
        ip,
        user_agent
      )
      VALUES (
        :actor,
        :action,
        :reservationId,
        :reasonCode,
        :statusCode,
        :ip,
        :userAgent
      )
    `,
    {
      replacements: {
        actor:
          String(actor || "unknown"),
        action:
          String(action || "unknown"),
        reservationId:
          reservationId == null
            ? null
            : String(reservationId),
        reasonCode:
          reasonCode || null,
        statusCode:
          Number(statusCode || 0),
        ip:
          ip || null,
        userAgent:
          userAgent || null,
      },
    }
  );
}


export async function unlockBreakGlass({
  username,
  password,
  reasonCode,
  ip,
  userAgent,
}) {
  assertConfigured();

  const actor =
    String(username || "");

  const reason =
    String(reasonCode || "").trim();

  if (
    actor !== ownerUsername()
  ) {
    await writeBreakGlassAudit({
      actor:
        actor || "unknown",
      action:
        "unlock.denied",
      reasonCode:
        REASONS.has(reason)
          ? reason
          : null,
      statusCode:
        403,
      ip,
      userAgent,
    });

    throw new BreakGlassError(
      "این حساب اجازه استفاده از دسترسی اضطراری را ندارد.",
      {
        statusCode: 403,
        code: "BREAK_GLASS_FORBIDDEN",
      }
    );
  }

  if (!REASONS.has(reason)) {
    throw new BreakGlassError(
      "دلیل دسترسی اضطراری نامعتبر است.",
      {
        statusCode: 400,
        code: "BREAK_GLASS_REASON_INVALID",
      }
    );
  }

  const key =
    failureKey(
      actor,
      ip
    );

  assertRateAllowed(key);

  if (
    !verifyBreakGlassPassword(
      password
    )
  ) {
    recordFailure(key);

    await writeBreakGlassAudit({
      actor,
      action:
        "unlock.denied",
      reasonCode:
        reason,
      statusCode:
        401,
      ip,
      userAgent,
    });

    throw new BreakGlassError(
      "رمز دسترسی اضطراری صحیح نیست.",
      {
        statusCode: 401,
        code: "BREAK_GLASS_PASSWORD_INVALID",
      }
    );
  }

  failures.delete(key);

  const token =
    randomBytes(32)
      .toString("base64url");

  const expiresAt =
    Date.now() +
    ttlSeconds() * 1000;

  grants.set(
    grantDigest(token),
    {
      username:
        actor,
      reasonCode:
        reason,
      expiresAt,
      remainingReveals:
        maxReveals(),
    }
  );

  await writeBreakGlassAudit({
    actor,
    action:
      "unlock.granted",
    reasonCode:
      reason,
    statusCode:
      200,
    ip,
    userAgent,
  });

  return {
    grant:
      token,
    expiresAt:
      new Date(
        expiresAt
      ).toISOString(),
    maxReveals:
      maxReveals(),
  };
}


export function validateBreakGlassGrant({
  token,
  username,
}) {
  const rawToken =
    String(token || "").trim();

  if (!rawToken) {
    throw new BreakGlassError(
      "دسترسی اضطراری فعال نیست.",
      {
        statusCode: 401,
        code: "BREAK_GLASS_GRANT_MISSING",
      }
    );
  }

  const digest =
    grantDigest(rawToken);

  const grant =
    grants.get(digest);

  if (!grant) {
    throw new BreakGlassError(
      "دسترسی اضطراری معتبر نیست یا منقضی شده است.",
      {
        statusCode: 401,
        code: "BREAK_GLASS_GRANT_INVALID",
      }
    );
  }

  if (
    grant.expiresAt <=
    Date.now()
  ) {
    grants.delete(digest);

    throw new BreakGlassError(
      "زمان دسترسی اضطراری به پایان رسیده است.",
      {
        statusCode: 401,
        code: "BREAK_GLASS_GRANT_EXPIRED",
      }
    );
  }

  if (
    grant.username !==
    username
  ) {
    throw new BreakGlassError(
      "این دسترسی اضطراری متعلق به کاربر فعلی نیست.",
      {
        statusCode: 403,
        code: "BREAK_GLASS_GRANT_OWNER_MISMATCH",
      }
    );
  }

  if (
    grant.remainingReveals <=
    0
  ) {
    grants.delete(digest);

    throw new BreakGlassError(
      "سقف مشاهده در این نشست اضطراری به پایان رسیده است.",
      {
        statusCode: 403,
        code: "BREAK_GLASS_REVEAL_LIMIT",
      }
    );
  }

  return {
    ...grant,
    digest,
  };
}


export async function recordBreakGlassReveal({
  token,
  username,
  reservationId,
  statusCode,
  ip,
  userAgent,
}) {
  const grant =
    validateBreakGlassGrant({
      token,
      username,
    });

  if (
    Number(statusCode) >= 200 &&
    Number(statusCode) < 300
  ) {
    const stored =
      grants.get(
        grant.digest
      );

    if (stored) {
      stored.remainingReveals -=
        1;

      if (
        stored.remainingReveals <=
        0
      ) {
        grants.delete(
          grant.digest
        );
      }
    }
  }

  await writeBreakGlassAudit({
    actor:
      username,
    action:
      "pii.reveal",
    reservationId,
    reasonCode:
      grant.reasonCode,
    statusCode,
    ip,
    userAgent,
  });

  return {
    reasonCode:
      grant.reasonCode,
    remainingReveals:
      Math.max(
        0,
        grant.remainingReveals -
        (
          Number(statusCode) >= 200 &&
          Number(statusCode) < 300
            ? 1
            : 0
        )
      ),
  };
}


export async function revokeBreakGlassGrant({
  token,
  username,
  ip,
  userAgent,
}) {
  const rawToken =
    String(token || "").trim();

  if (!rawToken) {
    return {
      revoked: false,
    };
  }

  const digest =
    grantDigest(rawToken);

  const grant =
    grants.get(digest);

  if (
    grant &&
    grant.username === username
  ) {
    grants.delete(digest);

    await writeBreakGlassAudit({
      actor:
        username,
      action:
        "lock",
      reasonCode:
        grant.reasonCode,
      statusCode:
        200,
      ip,
      userAgent,
    });

    return {
      revoked: true,
    };
  }

  return {
    revoked: false,
  };
}
