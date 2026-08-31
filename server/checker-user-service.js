import "dotenv/config";

import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

import {
  QueryTypes,
} from "sequelize";

import {
  sequelize,
  Performance,
  Production,
} from "./models.js";


function safeEqual(
  left,
  right
) {
  const a =
    Buffer.from(
      String(
        left ||
        ""
      )
    );

  const b =
    Buffer.from(
      String(
        right ||
        ""
      )
    );

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  return timingSafeEqual(
    a,
    b
  );
}


function normalizeUsername(
  value
) {
  return String(
    value ||
    ""
  )
    .trim()
    .toLowerCase();
}


function validateUsername(
  username
) {
  return /^[a-z0-9._-]{3,40}$/.test(
    username
  );
}


function validatePassword(
  password
) {
  return (
    typeof password ===
      "string" &&
    password.length >=
      10 &&
    password.length <=
      200
  );
}


function hashPassword(
  password
) {
  const salt =
    randomBytes(
      16
    ).toString(
      "hex"
    );

  const hash =
    scryptSync(
      password,
      salt,
      64
    ).toString(
      "hex"
    );

  return `${salt}:${hash}`;
}


function verifyPasswordHash(
  password,
  passwordHash
) {
  const [
    salt,
    expected,
  ] =
    String(
      passwordHash ||
      ""
    ).split(":");

  if (
    !salt ||
    !expected
  ) {
    return false;
  }

  const actual =
    scryptSync(
      String(
        password ||
        ""
      ),
      salt,
      64
    ).toString(
      "hex"
    );

  return safeEqual(
    actual,
    expected
  );
}


export async function ensureCheckerUserSchema() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ticket_checker_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      all_performances INTEGER NOT NULL DEFAULT 0,
      last_login_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);


  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS ticket_checker_performances (
      checker_user_id INTEGER NOT NULL,
      performance_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (
        checker_user_id,
        performance_id
      )
    )
  `);


  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS
      idx_ticket_checker_performances_performance
    ON ticket_checker_performances (
      performance_id
    )
  `);
}


export async function migrateEnvCheckerUsers() {
  await ensureCheckerUserSchema();


  let users = [];


  try {
    const parsed =
      JSON.parse(
        process.env
          .TICKET_CHECKER_USERS_JSON ||
        "[]"
      );

    if (
      Array.isArray(
        parsed
      )
    ) {
      users =
        parsed;
    }

  } catch {
    users =
      [];
  }


  let migrated =
    0;


  for (
    const source of users
  ) {
    const username =
      normalizeUsername(
        source?.username
      );

    const passwordHash =
      String(
        source?.passwordHash ||
        ""
      ).trim();


    if (
      !validateUsername(
        username
      ) ||
      !passwordHash.includes(
        ":"
      )
    ) {
      continue;
    }


    const existingRows =
      await sequelize.query(
        `
          SELECT id
          FROM ticket_checker_users
          WHERE username =
            :username
          LIMIT 1
        `,
        {
          replacements: {
            username,
          },

          type:
            QueryTypes.SELECT,
        }
      );


    if (
      existingRows.length > 0
    ) {
      continue;
    }


    await sequelize.query(
      `
        INSERT OR IGNORE INTO
          ticket_checker_users (
            username,
            display_name,
            password_hash,
            active,
            all_performances,
            updated_at
          )
        VALUES (
          :username,
          :displayName,
          :passwordHash,
          :active,
          1,
          CURRENT_TIMESTAMP
        )
      `,
      {
        replacements: {
          username,

          displayName:
            String(
              source
                ?.displayName ||
              username
            ).trim(),

          passwordHash,

          active:
            source?.active ===
            false
              ? 0
              : 1,
        },
      }
    );


    const insertedRows =
      await sequelize.query(
        `
          SELECT id
          FROM ticket_checker_users
          WHERE username =
            :username
          LIMIT 1
        `,
        {
          replacements: {
            username,
          },

          type:
            QueryTypes.SELECT,
        }
      );


    if (
      insertedRows.length > 0
    ) {
      migrated++;
    }
  }


  return {
    found:
      users.length,

    migrated,
  };
}


async function replaceAssignments(
  checkerUserId,
  performanceIds,
  {
    transaction,
  } = {}
) {
  const safeIds =
    [
      ...new Set(
        (
          Array.isArray(
            performanceIds
          )
            ? performanceIds
            : []
        )
          .map(
            Number
          )
          .filter(
            (id) =>
              Number.isInteger(
                id
              ) &&
              id > 0
          )
      ),
    ];


  if (
    safeIds.length > 0
  ) {
    const count =
      await Performance.count({
        where: {
          id:
            safeIds,
        },

        transaction,
      });


    if (
      count !==
      safeIds.length
    ) {
      const error =
        new Error(
          "One or more performance IDs are invalid."
        );

      error.code =
        "INVALID_PERFORMANCE";

      throw error;
    }
  }


  await sequelize.query(
    `
      DELETE FROM
        ticket_checker_performances
      WHERE checker_user_id =
        :checkerUserId
    `,
    {
      replacements: {
        checkerUserId,
      },

      transaction,
    }
  );


  for (
    const performanceId of
    safeIds
  ) {
    await sequelize.query(
      `
        INSERT INTO
          ticket_checker_performances (
            checker_user_id,
            performance_id
          )
        VALUES (
          :checkerUserId,
          :performanceId
        )
      `,
      {
        replacements: {
          checkerUserId,
          performanceId,
        },

        transaction,
      }
    );
  }


  return safeIds;
}


async function readAssignments(
  checkerUserId
) {
  const rows =
    await sequelize.query(
      `
        SELECT
          performance_id
        FROM
          ticket_checker_performances
        WHERE
          checker_user_id =
            :checkerUserId
        ORDER BY
          performance_id ASC
      `,
      {
        replacements: {
          checkerUserId,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  return rows.map(
    (row) =>
      Number(
        row.performance_id
      )
  );
}


function serializeUserRow(
  row,
  performanceIds = []
) {
  return {
    id:
      Number(
        row.id
      ),

    username:
      row.username,

    displayName:
      row.display_name,

    active:
      Boolean(
        row.active
      ),

    allPerformances:
      Boolean(
        row.all_performances
      ),

    performanceIds,

    lastLoginAt:
      row.last_login_at ||
      null,

    lastScanAt:
      row.last_scan_at ||
      null,

    createdAt:
      row.created_at ||
      null,

    updatedAt:
      row.updated_at ||
      null,
  };
}


export async function listCheckerUsersAdmin() {
  await ensureCheckerUserSchema();


  const rows =
    await sequelize.query(
      `
        SELECT
          u.id,
          u.username,
          u.display_name,
          u.active,
          u.all_performances,
          u.last_login_at,
          u.created_at,
          u.updated_at,
          (
            SELECT
              MAX(l.scanned_at)
            FROM
              ticket_scan_logs l
            WHERE
              l.checker_username =
                u.username
          ) AS last_scan_at
        FROM
          ticket_checker_users u
        ORDER BY
          u.active DESC,
          u.display_name ASC,
          u.username ASC
      `,
      {
        type:
          QueryTypes.SELECT,
      }
    );


  const output =
    [];


  for (
    const row of rows
  ) {
    output.push(
      serializeUserRow(
        row,
        await readAssignments(
          row.id
        )
      )
    );
  }


  return output;
}


export async function listCheckerAssignablePerformances() {
  const items =
    await Performance.findAll({
      include: [
        {
          model:
            Production,

          as:
            "production",

          attributes: [
            "id",
            "title",
          ],
        },
      ],

      order: [
        [
          "date",
          "ASC",
        ],
        [
          "time",
          "ASC",
        ],
      ],
    });


  return items.map(
    (item) => ({
      id:
        item.id,

      label:
        item.label,

      date:
        item.date,

      time:
        item.time,

      status:
        item.status,

      productionTitle:
        item.production
          ?.title ||
        null,
    })
  );
}


export async function createCheckerUser({
  username,
  displayName,
  password,
  active =
    true,
  allPerformances =
    false,
  performanceIds =
    [],
}) {
  await ensureCheckerUserSchema();


  const normalizedUsername =
    normalizeUsername(
      username
    );


  if (
    !validateUsername(
      normalizedUsername
    )
  ) {
    const error =
      new Error(
        "Username is invalid."
      );

    error.code =
      "INVALID_USERNAME";

    throw error;
  }


  const normalizedDisplayName =
    String(
      displayName ||
      ""
    ).trim();


  if (
    normalizedDisplayName.length <
      2 ||
    normalizedDisplayName.length >
      80
  ) {
    const error =
      new Error(
        "Display name is invalid."
      );

    error.code =
      "INVALID_DISPLAY_NAME";

    throw error;
  }


  if (
    !validatePassword(
      password
    )
  ) {
    const error =
      new Error(
        "Password is invalid."
      );

    error.code =
      "INVALID_PASSWORD";

    throw error;
  }


  const duplicateRows =
    await sequelize.query(
      `
        SELECT
          id
        FROM
          ticket_checker_users
        WHERE
          username =
            :username
        LIMIT 1
      `,
      {
        replacements: {
          username:
            normalizedUsername,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  if (
    duplicateRows.length > 0
  ) {
    const error =
      new Error(
        "Username already exists."
      );

    error.code =
      "DUPLICATE_USERNAME";

    throw error;
  }


  const transaction =
    await sequelize.transaction();


  try {
    await sequelize.query(
      `
        INSERT INTO
          ticket_checker_users (
            username,
            display_name,
            password_hash,
            active,
            all_performances,
            updated_at
          )
        VALUES (
          :username,
          :displayName,
          :passwordHash,
          :active,
          :allPerformances,
          CURRENT_TIMESTAMP
        )
      `,
      {
        replacements: {
          username:
            normalizedUsername,

          displayName:
            normalizedDisplayName,

          passwordHash:
            hashPassword(
              password
            ),

          active:
            active
              ? 1
              : 0,

          allPerformances:
            allPerformances
              ? 1
              : 0,
        },

        transaction,
      }
    );


    const createdRows =
      await sequelize.query(
        `
          SELECT id
          FROM ticket_checker_users
          WHERE username =
            :username
          LIMIT 1
        `,
        {
          replacements: {
            username:
              normalizedUsername,
          },

          type:
            QueryTypes.SELECT,

          transaction,
        }
      );


    const checkerUserId =
      Number(
        createdRows[0]
          ?.id
      );


    if (
      !Number.isInteger(
        checkerUserId
      ) ||
      checkerUserId < 1
    ) {
      throw new Error(
        "Created checker user ID could not be resolved."
      );
    }


    if (
      !allPerformances
    ) {
      await replaceAssignments(
        checkerUserId,
        performanceIds,
        {
          transaction,
        }
      );
    }


    await transaction.commit();


    return getCheckerUserById(
      checkerUserId
    );

  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
}


export async function updateCheckerUser(
  id,
  {
    displayName,
    active,
    allPerformances,
    performanceIds,
  }
) {
  await ensureCheckerUserSchema();


  const checkerUserId =
    Number(
      id
    );


  if (
    !Number.isInteger(
      checkerUserId
    ) ||
    checkerUserId < 1
  ) {
    const error =
      new Error(
        "Checker user ID is invalid."
      );

    error.code =
      "NOT_FOUND";

    throw error;
  }


  const existing =
    await getCheckerUserById(
      checkerUserId
    );


  if (!existing) {
    const error =
      new Error(
        "Checker user not found."
      );

    error.code =
      "NOT_FOUND";

    throw error;
  }


  const normalizedDisplayName =
    displayName ===
      undefined
      ? existing.displayName
      : String(
          displayName ||
          ""
        ).trim();


  if (
    normalizedDisplayName.length <
      2 ||
    normalizedDisplayName.length >
      80
  ) {
    const error =
      new Error(
        "Display name is invalid."
      );

    error.code =
      "INVALID_DISPLAY_NAME";

    throw error;
  }


  const nextActive =
    active ===
      undefined
      ? existing.active
      : Boolean(
          active
        );


  const nextAll =
    allPerformances ===
      undefined
      ? existing.allPerformances
      : Boolean(
          allPerformances
        );


  const nextIds =
    performanceIds ===
      undefined
      ? existing.performanceIds
      : performanceIds;


  const transaction =
    await sequelize.transaction();


  try {
    await sequelize.query(
      `
        UPDATE
          ticket_checker_users
        SET
          display_name =
            :displayName,
          active =
            :active,
          all_performances =
            :allPerformances,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id =
          :checkerUserId
      `,
      {
        replacements: {
          displayName:
            normalizedDisplayName,

          active:
            nextActive
              ? 1
              : 0,

          allPerformances:
            nextAll
              ? 1
              : 0,

          checkerUserId,
        },

        transaction,
      }
    );


    if (
      nextAll
    ) {
      await replaceAssignments(
        checkerUserId,
        [],
        {
          transaction,
        }
      );

    } else {
      await replaceAssignments(
        checkerUserId,
        nextIds,
        {
          transaction,
        }
      );
    }


    await transaction.commit();


    return getCheckerUserById(
      checkerUserId
    );

  } catch (error) {
    if (
      !transaction.finished
    ) {
      await transaction.rollback();
    }

    throw error;
  }
}


export async function resetCheckerPassword(
  id,
  newPassword
) {
  await ensureCheckerUserSchema();


  if (
    !validatePassword(
      newPassword
    )
  ) {
    const error =
      new Error(
        "Password is invalid."
      );

    error.code =
      "INVALID_PASSWORD";

    throw error;
  }


  const checkerUserId =
    Number(
      id
    );


  const existing =
    await getCheckerUserById(
      checkerUserId
    );


  if (!existing) {
    const error =
      new Error(
        "Checker user not found."
      );

    error.code =
      "NOT_FOUND";

    throw error;
  }


  await sequelize.query(
    `
      UPDATE
        ticket_checker_users
      SET
        password_hash =
          :passwordHash,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE
        id =
          :checkerUserId
    `,
    {
      replacements: {
        passwordHash:
          hashPassword(
            newPassword
          ),

        checkerUserId,
      },
    }
  );


  return {
    ok:
      true,
  };
}


export async function getCheckerUserById(
  id
) {
  await ensureCheckerUserSchema();


  const rows =
    await sequelize.query(
      `
        SELECT
          id,
          username,
          display_name,
          active,
          all_performances,
          last_login_at,
          created_at,
          updated_at,
          NULL AS last_scan_at
        FROM
          ticket_checker_users
        WHERE
          id =
            :id
        LIMIT 1
      `,
      {
        replacements: {
          id:
            Number(
              id
            ),
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const row =
    rows[0];


  if (!row) {
    return null;
  }


  return serializeUserRow(
    row,
    await readAssignments(
      row.id
    )
  );
}


export async function getCheckerUserByUsername(
  username
) {
  await ensureCheckerUserSchema();


  const normalizedUsername =
    normalizeUsername(
      username
    );


  const rows =
    await sequelize.query(
      `
        SELECT
          id,
          username,
          display_name,
          active,
          all_performances,
          last_login_at,
          created_at,
          updated_at,
          password_hash
        FROM
          ticket_checker_users
        WHERE
          username =
            :username
        LIMIT 1
      `,
      {
        replacements: {
          username:
            normalizedUsername,
        },

        type:
          QueryTypes.SELECT,
      }
    );


  return rows[0] ||
    null;
}


export async function verifyCheckerPassword(
  username,
  password
) {
  const row =
    await getCheckerUserByUsername(
      username
    );


  if (
    !row ||
    !Boolean(
      row.active
    ) ||
    !verifyPasswordHash(
      password,
      row.password_hash
    )
  ) {
    return null;
  }


  return {
    id:
      Number(
        row.id
      ),

    username:
      row.username,

    displayName:
      row.display_name,

    active:
      true,

    allPerformances:
      Boolean(
        row.all_performances
      ),
  };
}


export async function markCheckerLogin(
  username
) {
  await sequelize.query(
    `
      UPDATE
        ticket_checker_users
      SET
        last_login_at =
          CURRENT_TIMESTAMP,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE
        username =
          :username
    `,
    {
      replacements: {
        username:
          normalizeUsername(
            username
          ),
      },
    }
  );
}


export async function getActiveCheckerForSession(
  username
) {
  const row =
    await getCheckerUserByUsername(
      username
    );


  if (
    !row ||
    !Boolean(
      row.active
    )
  ) {
    return null;
  }


  return {
    id:
      Number(
        row.id
      ),

    username:
      row.username,

    displayName:
      row.display_name,

    role:
      "ticket_checker",

    allPerformances:
      Boolean(
        row.all_performances
      ),
  };
}


export async function isCheckerAllowedForPerformance(
  username,
  performanceId
) {
  const row =
    await getCheckerUserByUsername(
      username
    );


  if (
    !row ||
    !Boolean(
      row.active
    )
  ) {
    return false;
  }


  if (
    Boolean(
      row.all_performances
    )
  ) {
    return true;
  }


  const rows =
    await sequelize.query(
      `
        SELECT
          1 AS allowed
        FROM
          ticket_checker_performances
        WHERE
          checker_user_id =
            :checkerUserId
          AND
          performance_id =
            :performanceId
        LIMIT 1
      `,
      {
        replacements: {
          checkerUserId:
            row.id,

          performanceId:
            Number(
              performanceId
            ),
        },

        type:
          QueryTypes.SELECT,
      }
    );


  return rows.length >
    0;
}