
const express=require("express");
const router=express.Router();
const db=require("../models");

router.get("/stats",async(req,res)=>{
 const shows=await db.Show.count();
 const performances=await db.Performance.count();
 const reservations=await db.Reservation.count();

 res.json({
  shows,
  performances,
  reservations
 });
});

module.exports=router;
