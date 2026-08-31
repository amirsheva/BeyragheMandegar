
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

const Show = require("./Show")(sequelize,DataTypes);
const Performance = require("./Performance")(sequelize,DataTypes);
const Reservation = require("./Reservation")(sequelize,DataTypes);

Show.hasMany(Performance,{
 foreignKey:"show_id"
});

Performance.belongsTo(Show,{
 foreignKey:"show_id"
});

Performance.hasMany(Reservation,{
 foreignKey:"performance_id"
});

Reservation.belongsTo(Performance,{
 foreignKey:"performance_id"
});

module.exports={
 sequelize,
 Show,
 Performance,
 Reservation
};
