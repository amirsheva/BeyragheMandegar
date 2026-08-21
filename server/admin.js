// server/admin.js

import { sequelize } from "./models.js";

export async function setupAdmin(app) {

  await sequelize.sync();

  console.log("⚠️ AdminJS disabled. React Admin is active.");

  return {
    options: {
      rootPath: "/admin"
    }
  };
}