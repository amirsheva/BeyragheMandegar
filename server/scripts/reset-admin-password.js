import fs from "fs";
import {
  randomBytes,
  scryptSync,
} from "crypto";

let password = "";

process.stdin.setEncoding("utf8");

for await (const chunk of process.stdin) {
  password += chunk;
}

password = password.replace(/\r?\n$/, "");

if (password.length < 12) {
  console.error(
    "❌ Password must contain at least 12 characters."
  );
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");

const hash = scryptSync(
  password,
  salt,
  64
).toString("hex");

const newSessionSecret =
  randomBytes(32).toString("hex");

const envPath = ".env";

if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found.");
  process.exit(1);
}

let env = fs.readFileSync(
  envPath,
  "utf8"
);

function upsert(name, value) {
  const regex =
    new RegExp(`^${name}=.*$`, "m");

  if (regex.test(env)) {
    env = env.replace(
      regex,
      `${name}=${value}`
    );
  } else {
    env += `\n${name}=${value}`;
  }
}

upsert(
  "ADMIN_PASSWORD_HASH",
  `${salt}:${hash}`
);

upsert(
  "ADMIN_SESSION_SECRET",
  newSessionSecret
);

fs.writeFileSync(
  envPath,
  env.trim() + "\n"
);

console.log("✅ Admin password changed.");
console.log("✅ Existing admin sessions invalidated.");
console.log("✅ Password was not printed or stored in shell history.");
