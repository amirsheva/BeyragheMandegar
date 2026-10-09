import fs from "fs";
import { spawn } from "child_process";

import { Sequelize } from "sequelize";


/*
 * Shared Postgres connection settings for
 * backup / restore scripts. Mirrors server/models.js.
 */
export function getDbConfig(
  overrides = {}
) {
  return {
    host:
      process.env.DB_HOST ||
      "localhost",
    port:
      Number(
        process.env.DB_PORT
      ) || 5432,
    database:
      process.env.DB_NAME ||
      "beyragh",
    username:
      process.env.DB_USER ||
      "beyragh",
    password:
      process.env.DB_PASS ||
      "beyragh",
    ...overrides,
  };
}


export function connect(
  config
) {
  return new Sequelize({
    dialect: "postgres",
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password,
    logging: false,
  });
}


export function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}


/*
 * pg_dump / pg_restore are invoked with
 * stdin/stdout streams (never host file paths),
 * so PG_DUMP_BIN / PG_RESTORE_BIN can point at
 * a wrapper such as:
 *   docker exec -i -e PGPASSWORD beyragh-postgres pg_dump "$@"
 */
export function runPgTool(
  tool,
  args,
  {
    config,
    input,
    output,
  } = {}
) {
  const bin =
    tool === "pg_dump"
      ? process.env.PG_DUMP_BIN || "pg_dump"
      : process.env.PG_RESTORE_BIN || "pg_restore";

  return new Promise((resolve, reject) => {
    const child =
      spawn(
        bin,
        args,
        {
          env: {
            ...process.env,
            PGHOST: config.host,
            PGPORT: String(config.port),
            PGUSER: config.username,
            PGPASSWORD: config.password,
          },
          stdio: [
            input ? "pipe" : "ignore",
            output ? "pipe" : "ignore",
            "pipe",
          ],
        }
      );

    let stderr = "";

    child.stderr.on(
      "data",
      (chunk) => {
        stderr += chunk;
      }
    );

    child.on("error", (error) => {
      reject(
        new Error(
          `${bin} اجرا نشد: ${error.message}`
        )
      );
    });

    if (input) {
      fs.createReadStream(input)
        .on("error", reject)
        .pipe(child.stdin);
    }

    let outputDone =
      Promise.resolve();

    if (output) {
      const file =
        fs.createWriteStream(output);

      outputDone =
        new Promise((done, fail) => {
          file.on("finish", done);
          file.on("error", fail);
        });

      child.stdout.pipe(file);
    }

    child.on("close", async (code) => {
      try {
        await outputDone;
      } catch (error) {
        reject(error);
        return;
      }

      if (code !== 0) {
        reject(
          new Error(
            `${tool} exited with code ${code}: ${stderr.trim()}`
          )
        );
        return;
      }

      resolve(stderr);
    });
  });
}
