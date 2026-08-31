
module.exports = (sequelize, DataTypes)=>{
 return sequelize.define("Show",{
  title:{
   type:DataTypes.STRING,
   allowNull:false
  },
  description:DataTypes.TEXT,
  director:DataTypes.STRING,
  poster:DataTypes.STRING,
  status:{
   type:DataTypes.STRING,
   defaultValue:"active"
  }
 });
};
