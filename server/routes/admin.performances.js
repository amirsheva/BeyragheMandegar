
const express = require("express");
const router = express.Router();
const { Performance } = require("../models");

router.get("/", async(req,res)=>{
  const items = await Performance.findAll({
    order:[["createdAt","DESC"]]
  });
  res.json(items);
});

router.post("/", async(req,res)=>{
  const item = await Performance.create(req.body);
  res.json(item);
});

router.put("/:id", async(req,res)=>{
  const item = await Performance.findByPk(req.params.id);
  if(!item) return res.status(404).json({message:"not found"});

  await item.update(req.body);
  res.json(item);
});

router.delete("/:id", async(req,res)=>{
  const item = await Performance.findByPk(req.params.id);
  if(!item) return res.status(404).json({message:"not found"});

  await item.destroy();
  res.json({ok:true});
});

module.exports = router;
