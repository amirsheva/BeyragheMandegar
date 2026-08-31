
module.exports = (sequelize, DataTypes)=>{
 return sequelize.define("Performance",{
  venue:DataTypes.STRING,
  date:DataTypes.STRING,
  time:DataTypes.STRING,
  capacity:DataTypes.INTEGER,
  sold:{
   type:DataTypes.INTEGER,
   defaultValue:0
  }
 });
};
