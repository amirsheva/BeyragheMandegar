import "dotenv/config";

import fs from "fs";
import path from "path";


const errors =
  [];

const warnings =
  [];


function required(
  name
) {
  const value =
    String(
      process.env[name] ||
      ""
    ).trim();

  if (!value) {
    errors.push(
      `${name} is required.`
    );
  }

  return value;
}


function isHttpsUrl(
  value
) {
  try {
    const url =
      new URL(
        value
      );

    return (
      url.protocol ===
      "https:"
    );

  } catch {
    return false;
  }
}


function ensureWritableDirectory(
  directory,
  label
) {
  try {
    fs.mkdirSync(
      directory,
      {
        recursive:
          true,
      }
    );

    fs.accessSync(
      directory,
      fs.constants.W_OK
    );

  } catch {
    errors.push(
      `${label} is not writable: ${directory}`
    );
  }
}


console.log("");
console.log(
  "🔐 Beyragh Production Preflight"
);
console.log(
  "────────────────────────────────"
);


if (
  process.env.NODE_ENV !==
  "production"
) {
  errors.push(
    "NODE_ENV must be production."
  );
}


const adminUsername =
  required(
    "ADMIN_USERNAME"
  );

const passwordHash =
  required(
    "ADMIN_PASSWORD_HASH"
  );

const sessionSecret =
  required(
    "ADMIN_SESSION_SECRET"
  );

const adminOrigin =
  required(
    "ADMIN_ORIGIN"
  );

const dbStorage =
  required(
    "DB_STORAGE"
  );

const backupDir =
  required(
    "BACKUP_DIR"
  );

const corsOriginsRaw =
  required(
    "CORS_ORIGINS"
  );


if (
  adminUsername
    .toLowerCase() ===
  "admin"
) {
  warnings.push(
    "ADMIN_USERNAME is still the default 'admin'."
  );
}


if (
  passwordHash &&
  !/^[^:]+:[0-9a-f]{128}$/i.test(
    passwordHash
  )
) {
  errors.push(
    "ADMIN_PASSWORD_HASH format is invalid."
  );
}


if (
  sessionSecret &&
  sessionSecret.length <
    32
) {
  errors.push(
    "ADMIN_SESSION_SECRET must contain at least 32 characters."
  );
}


if (
  adminOrigin &&
  !isHttpsUrl(
    adminOrigin
  )
) {
  errors.push(
    "ADMIN_ORIGIN must use HTTPS in production."
  );
}


const corsOrigins =
  corsOriginsRaw
    .split(",")
    .map(
      (value) =>
        value.trim()
    )
    .filter(Boolean);


for (
  const origin
  of corsOrigins
) {
  if (
    !isHttpsUrl(
      origin
    )
  ) {
    errors.push(
      `CORS origin must use HTTPS: ${origin}`
    );
  }
}


if (
  process.env.TRUST_PROXY !==
  "1"
) {
  errors.push(
    "TRUST_PROXY must be 1 behind the production reverse proxy."
  );
}


if (
  dbStorage &&
  !path.isAbsolute(
    dbStorage
  )
) {
  errors.push(
    "DB_STORAGE must be an absolute production path."
  );
}


if (
  backupDir &&
  !path.isAbsolute(
    backupDir
  )
) {
  errors.push(
    "BACKUP_DIR must be an absolute production path."
  );
}


if (
  dbStorage &&
  path.isAbsolute(
    dbStorage
  )
) {
  ensureWritableDirectory(
    path.dirname(
      dbStorage
    ),
    "Database directory"
  );
}


if (
  backupDir &&
  path.isAbsolute(
    backupDir
  )
) {
  ensureWritableDirectory(
    backupDir,
    "Backup directory"
  );
}


const piiEncryptionEnabled =
  String(
    process.env
      .PII_ENCRYPTION_ENABLED ||
      "false"
  )
    .trim()
    .toLowerCase() ===
  "true";


const piiEncryptionKey =
  required(
    "PII_ENCRYPTION_KEY"
  );


if (
  !piiEncryptionEnabled
) {
  errors.push(
    "PII_ENCRYPTION_ENABLED must be true in production."
  );
}


if (
  piiEncryptionKey
) {
  try {
    const decoded =
      Buffer.from(
        piiEncryptionKey,
        "base64"
      );

    if (
      decoded.length !==
      32
    ) {
      errors.push(
        "PII_ENCRYPTION_KEY must decode to exactly 32 bytes."
      );
    }

  } catch {
    errors.push(
      "PII_ENCRYPTION_KEY must be valid Base64."
    );
  }
}


const transactionalSms =
  String(
    process.env
      .SMS_TRANSACTIONAL_ENABLED ||
      "false"
  ).toLowerCase() ===
  "true";


if (
  transactionalSms
) {
  const provider =
    String(
      process.env
        .SMS_PROVIDER ||
        ""
    ).trim();


  if (
    !provider ||
    provider ===
      "noop"
  ) {
    errors.push(
      "Transactional SMS is enabled but SMS_PROVIDER is noop/empty."
    );
  }


  if (
    provider ===
      "smsir" &&
    !String(
      process.env
        .SMSIR_API_KEY ||
        ""
    ).trim()
  ) {
    errors.push(
      "SMSIR_API_KEY is required when SMS_PROVIDER=smsir."
    );
  }

} else {
  warnings.push(
    "Transactional SMS is disabled."
  );
}


for (
  const warning
  of warnings
) {
  console.log(
    `⚠️ ${warning}`
  );
}


if (
  errors.length >
  0
) {
  console.error("");

  for (
    const error
    of errors
  ) {
    console.error(
      `❌ ${error}`
    );
  }

  console.error("");
  console.error(
    `❌ PREFLIGHT FAILED — ${errors.length} issue(s)`
  );

  process.exit(
    1
  );
}


console.log("");
console.log(
  "✅ Environment configuration valid"
);
console.log(
  "✅ Database directory writable"
);
console.log(
  "✅ Backup directory writable"
);
console.log(
  "✅ HTTPS origins valid"
);
console.log(
  "✅ Reverse proxy configuration valid"
);
console.log(
  "✅ PRODUCTION PREFLIGHT PASSED"
);