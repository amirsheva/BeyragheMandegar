
const adminUI = require("../routes/admin-ui");

module.exports = function registerAdminUI(app){
  app.use(adminUI);
};
