// server/models.js
import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./reservations.db",
  logging: false,
});

const Show = sequelize.define("shows", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING },
  date: { type: DataTypes.STRING },
  time: { type: DataTypes.STRING },
  capacity: { type: DataTypes.INTEGER },
});

const Reservation = sequelize.define("reservations", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  national_id: { type: DataTypes.STRING },
  count: { type: DataTypes.INTEGER },
  show_id: { type: DataTypes.INTEGER },
}, {
  timestamps: true,
  underscored: true,
});

Reservation.belongsTo(Show, { foreignKey: "show_id" });

export { sequelize, Show, Reservation };