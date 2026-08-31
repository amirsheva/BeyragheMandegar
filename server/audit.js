import {
  sequelize,
} from "./models.js";


let initPromise = null;


export function ensureAuditTable() {
  if (!initPromise) {
    initPromise =
      sequelize.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          actor TEXT,
          method TEXT NOT NULL,
          path TEXT NOT NULL,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id TEXT,
          status_code INTEGER NOT NULL,
          ip TEXT,
          user_agent TEXT
        )
      `);
  }

  return initPromise;
}


function identifyAction(
  method,
  path
) {
  if (
    method === "PATCH" &&
    /\/reservations\/\d+\/status(?:\/|$)/.test(path)
  ) {
    return {
      action:
        "reservation.status.update",
      entityType:
        "reservation",
    };
  }

  if (
    method === "DELETE" &&
    /\/performances\/\d+(?:\/|$)/.test(path)
  ) {
    return {
      action:
        "performance.delete",
      entityType:
        "performance",
    };
  }

  if (
    method === "DELETE" &&
    /\/shows\/\d+(?:\/|$)/.test(path)
  ) {
    return {
      action:
        "production.delete",
      entityType:
        "production",
    };
  }

  if (
    method === "POST" &&
    /\/performances(?:\/|$)/.test(path)
  ) {
    return {
      action:
        "performance.create",
      entityType:
        "performance",
    };
  }

  if (
    ["PATCH", "PUT"].includes(method) &&
    /\/performances\/\d+(?:\/|$)/.test(path)
  ) {
    return {
      action:
        "performance.update",
      entityType:
        "performance",
    };
  }

  if (
    ["PATCH", "PUT"].includes(method) &&
    /\/shows\/\d+(?:\/|$)/.test(path)
  ) {
    return {
      action:
        "production.update",
      entityType:
        "production",
    };
  }

  return {
    action:
      `${method.toLowerCase()}:${path}`,
    entityType:
      null,
  };
}


function extractEntityId(
  path
) {
  const match =
    String(path).match(
      /\/(\d+)(?:\/|$)/
    );

  return match
    ? match[1]
    : null;
}


function resolveActor(req) {
  return (
    req.admin?.username ||
    req.user?.username ||
    req.session?.admin?.username ||
    req.session?.user?.username ||
    "authenticated-admin"
  );
}


export async function writeAuditLog({
  actor,
  method,
  path,
  action,
  entityType,
  entityId,
  statusCode,
  ip,
  userAgent,
}) {
  await ensureAuditTable();

  await sequelize.query(
    `
      INSERT INTO audit_logs (
        actor,
        method,
        path,
        action,
        entity_type,
        entity_id,
        status_code,
        ip,
        user_agent
      )
      VALUES (
        :actor,
        :method,
        :path,
        :action,
        :entityType,
        :entityId,
        :statusCode,
        :ip,
        :userAgent
      )
    `,
    {
      replacements: {
        actor:
          actor || null,
        method,
        path,
        action,
        entityType:
          entityType || null,
        entityId:
          entityId || null,
        statusCode,
        ip:
          ip || null,
        userAgent:
          userAgent || null,
      },
    }
  );
}


export function adminAuditMiddleware(
  req,
  res,
  next
) {
  const method =
    String(
      req.method || ""
    ).toUpperCase();

  if (
    ![
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ].includes(method)
  ) {
    return next();
  }

  const path =
    req.originalUrl ||
    req.url ||
    req.path ||
    "";

  const {
    action,
    entityType,
  } = identifyAction(
    method,
    path
  );

  const entityId =
    extractEntityId(path);

  const actor =
    resolveActor(req);

  const ip =
    req.ip ||
    req.socket?.remoteAddress ||
    null;

  const userAgent =
    req.get?.(
      "user-agent"
    ) ||
    null;


  res.on(
    "finish",
    () => {
      writeAuditLog({
        actor,
        method,
        path,
        action,
        entityType,
        entityId,
        statusCode:
          res.statusCode,
        ip,
        userAgent,
      }).catch(
        (error) => {
          console.error(
            "Admin audit log error:",
            error
          );
        }
      );
    }
  );


  return next();
}
