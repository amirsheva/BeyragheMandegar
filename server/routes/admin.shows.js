
const express = require("express");
const router = express.Router();
const { Show } = require("../models");

router.get("/", async (req,res)=>{
  const shows = await Show.findAll({
    order:[["createdAt","DESC"]]
  });
  res.json(shows);
});

router.post("/", async(req,res)=>{
  const show = await Show.create(req.body);
  res.json(show);
});

router.put("/:id", async(req,res)=>{
  const show = await Show.findByPk(req.params.id);
  if(!show) return res.status(404).json({message:"not found"});

  await show.update(req.body);
  res.json(show);
});

router.delete("/:id", async(req,res)=>{
  const show = await Show.findByPk(req.params.id);
  if(!show) return res.status(404).json({message:"not found"});

  await show.destroy();
  res.json({ok:true});
});

module.exports = router;
