// server/models.js
import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./reservations.db",
  logging: false,
});

const Production = sequelize.define(
  "Production",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    subtitle: { type: DataTypes.STRING, allowNull: true },
    short_description: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    director: { type: DataTypes.STRING, allowNull: true },
    poster: { type: DataTypes.STRING, allowNull: true },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "published",
    },
    tags: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "productions",
    timestamps: true,
    underscored: true,
  }
);

const Performance = sequelize.define(
  "Performance",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    production_id: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    time: { type: DataTypes.STRING, allowNull: false },
    capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 300 },
    remaining_capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 300,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
    },
    booking_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    label: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: "performances",
    timestamps: true,
    underscored: true,
  }
);

const Reservation = sequelize.define(
  "Reservation",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    performance_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    national_id: { type: DataTypes.STRING, allowNull: false },
    count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    tracking_code: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "confirmed",
    },
  },
  {
    tableName: "reservations",
    timestamps: true,
    underscored: true,
  }
);

Production.hasMany(Performance, {
  foreignKey: "production_id",
  as: "performances",
});
Performance.belongsTo(Production, {
  foreignKey: "production_id",
  as: "production",
});

Performance.hasMany(Reservation, {
  foreignKey: "performance_id",
  as: "reservations",
});
Reservation.belongsTo(Performance, {
  foreignKey: "performance_id",
  as: "performance",
});

export { sequelize, Production, Performance, Reservation };
