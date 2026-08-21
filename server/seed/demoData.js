
module.exports = async(db)=>{
 await db.Show.create({
  title:"بیرق فاطمه",
  director:"گروه نمایشی بیرق ماندگار",
  description:"روایتی آیینی و ماندگار",
  poster:"hero-beyragh-fatemeh-azra.webp"
 });

 await db.Performance.bulkCreate([
  {
   venue:"سالن شهید مطهری",
   date:"1405/06/14",
   time:"19:30",
   capacity:300
  },
  {
   venue:"فرهنگسرای خاوران",
   date:"1405/06/15",
   time:"20:00",
   capacity:250
  }
 ]);
};
