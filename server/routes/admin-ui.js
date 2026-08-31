
const express = require("express");
const path = require("path");

const router = express.Router();

router.use(
  "/admin",
  express.static(
    path.join(process.cwd(), "dist-admin")
  )
);

router.get("/admin/*", (req,res)=>{
  res.sendFile(
    path.join(process.cwd(), "dist-admin", "index.html")
  );
});

module.exports = router;
