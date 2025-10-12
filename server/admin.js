// server/admin.js
import AdminJS from "adminjs";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSSequelize from "@adminjs/sequelize";
import { sequelize, Show, Reservation } from "./models.js";
import { dark, light } from "@adminjs/themes";

// تنظیم آداپتر Sequelize
AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
});

export async function setupAdmin(app) {
  await sequelize.sync();

  const admin = new AdminJS({
    rootPath: "/admin",
    resources: [
      {
        resource: Show,
        options: {
          navigation: "🎭 مدیریت اجراها",
          listProperties: ["id", "title", "date", "capacity"],
          editProperties: ["title", "date", "capacity"],
          properties: {
            id: { isVisible: false },
          },
        },
      },
      {
        resource: Reservation,
        options: {
          navigation: "👥 مدیریت رزروها",
          listProperties: ["id", "name", "phone", "count", "show_id"],
          properties: {
            id: { isVisible: false },
          },
        },
      },
    ],
    dashboard: {
      component: false, // داشبورد سفارشی حذف شد برای سادگی
    },
    branding: {
      companyName: "پنل مدیریت بیرق ماندگار",
      logo: false,
      softwareBrothers: false,
      theme: dark,
    },
    locale: {
      language: "fa",
      translations: {
        labels: {
          navigation: "ناوبری",
          shows: "اجراها",
          reservations: "رزروها",
        },
        buttons: {
          save: "ذخیره",
          addNewItem: "افزودن جدید",
          logout: "خروج",
        },
      },
    },
    defaultTheme: dark.id,
    availableThemes: [dark, light],
  });

  const router = AdminJSExpress.buildRouter(admin);
  app.use(admin.options.rootPath, router);
  return admin;
}