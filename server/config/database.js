
// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(
//  process.env.DB_NAME || "beyragh",
//  process.env.DB_USER || "root",
//  process.env.DB_PASS || "",
//  {
//   host: process.env.DB_HOST || "localhost",
//   dialect: "sqlite",
//   storage:"database.sqlite",
//   logging:false
//  }
// );

// module.exports = sequelize;
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME || "beyragh",
  process.env.DB_USER || "postgres",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

module.exports = sequelize;