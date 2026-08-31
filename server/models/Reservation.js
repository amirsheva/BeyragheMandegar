
module.exports = (sequelize, DataTypes)=>{
 return sequelize.define("Reservation",{
  name:DataTypes.STRING,
  phone:DataTypes.STRING,
  national_id:DataTypes.STRING,
  count:DataTypes.INTEGER,
  status:{
   type:DataTypes.STRING,
   defaultValue:"pending"
  }
 });
};
