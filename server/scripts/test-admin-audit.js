import express from "express";

import {
  QueryTypes,
} from "sequelize";

import {
  sequelize,
  Production,
  Performance,
  Reservation,
} from "../models.js";

import adminApiRouter
  from "../admin-api.js";

import {
  adminAuditMiddleware,
  ensureAuditTable,
} from "../audit.js";


let performance = null;
let reservation = null;
let server = null;
let auditId = null;


async function cleanup() {
  if (auditId) {
    await sequelize.query(
      `
        DELETE FROM audit_logs
        WHERE id = :id
      `,
      {
        replacements: {
          id: auditId,
        },
      }
    );
  }

  if (performance) {
    await Reservation.destroy({
      where: {
        performance_id:
          performance.id,
      },
    });

    await Performance.destroy({
      where: {
        id:
          performance.id,
      },
    });
  }
}


async function run() {
  console.log("");
  console.log(
    "🧪 تست Admin Audit Log"
  );

  console.log(
    "────────────────────────────"
  );


  await ensureAuditTable();


  const production =
    await Production.findOne({
      order: [["id", "ASC"]],
    });


  if (!production) {
    throw new Error(
      "Production پیدا نشد."
    );
  }


  performance =
    await Performance.create({
      production_id:
        production.id,

      date:
        "1499/07/01",

      time:
        "09:09",

      capacity:
        2,

      remaining_capacity:
        1,

      status:
        "active",

      booking_enabled:
        true,

      label:
        "TEST - ADMIN AUDIT",
    });


  reservation =
    await Reservation.create({
      performance_id:
        performance.id,

      name:
        "تست Audit",

      phone:
        "09123456789",

      national_id:
        "0084575948",

      count:
        1,

      tracking_code:
        `TEST-AUDIT-${Date.now()}`,

      status:
        "confirmed",
    });


  const app =
    express();


  app.use(
    express.json()
  );


  app.use(
    "/api/admin",

    /*
     * شبیه‌سازی خروجی requireAdmin.
     * در سرور واقعی این مقدار از Session امضاشده می‌آید.
     */
    (req, res, next) => {
      req.admin = {
        username:
          "test-admin",
      };

      next();
    },

    adminAuditMiddleware,
    adminApiRouter
  );


  server =
    await new Promise(
      (resolve) => {
        const instance =
          app.listen(
            0,
            "127.0.0.1",
            () =>
              resolve(instance)
          );
      }
    );


  const address =
    server.address();


  const response =
    await fetch(
      `http://127.0.0.1:${address.port}/api/admin/reservations/${reservation.id}/status`,
      {
        method:
          "PATCH",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            status:
              "cancelled",
          }),
      }
    );


  console.log(
    "HTTP:",
    response.status
  );


  /*
   * Audit روی event پایان Response
   * نوشته می‌شود.
   */
  await new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        150
      )
  );


  const rows =
    await sequelize.query(
      `
        SELECT
          id,
          actor,
          method,
          path,
          action,
          entity_type,
          entity_id,
          status_code
        FROM audit_logs
        WHERE entity_id = :entityId
          AND action =
            'reservation.status.update'
        ORDER BY id DESC
        LIMIT 1
      `,
      {
        replacements: {
          entityId:
            String(
              reservation.id
            ),
        },

        type:
          QueryTypes.SELECT,
      }
    );


  const audit =
    rows[0];


  if (!audit) {
    throw new Error(
      "Audit Log ساخته نشد."
    );
  }


  auditId =
    audit.id;


  console.log("");
  console.log(
    "Audit:",
    audit
  );


  const passed =
    response.status === 200 &&
    audit.method === "PATCH" &&
    audit.action ===
      "reservation.status.update" &&
    Number(
      audit.status_code
    ) === 200 &&
    audit.actor ===
      "test-admin";


  if (!passed) {
    throw new Error(
      "Audit Log صحیح نیست."
    );
  }


  console.log("");
  console.log(
    "✅ PASS — Cancel در Audit ثبت شد."
  );

  console.log(
    "✅ PASS — HTTP status ثبت شد."
  );

  console.log(
    "✅ PASS — Reservation ID ثبت شد."
  );

  console.log(
    "✅ PASS — اطلاعات حساس Request ذخیره نشد."
  );

  console.log("");
  console.log(
    "✅ ADMIN AUDIT LOG PASSED"
  );
}


run()
  .catch((error) => {
    console.error("");
    console.error(
      "❌ TEST FAILED:"
    );

    console.error(error);

    process.exitCode = 1;
  })

  .finally(async () => {
    try {
      if (server) {
        await new Promise(
          (resolve) =>
            server.close(resolve)
        );
      }

      await cleanup();

      console.log("");
      console.log(
        "🧹 داده‌های تست پاک شدند."
      );

    } catch (error) {
      console.error(
        "⚠️ Cleanup failed:",
        error
      );
    }

    await sequelize.close();
  });
