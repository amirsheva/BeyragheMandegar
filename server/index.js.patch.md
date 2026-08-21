
ADMIN-12 changes for server/index.js

1) Remove or disable AdminJS mount:

app.use(admin.options.rootPath, adminRouter);

2) Add static serving for React admin build:

const path = require("path");

app.use("/admin", express.static(
 path.join(process.cwd(),"dist-admin")
));

app.get("/admin/*",(req,res)=>{
 res.sendFile(
  path.join(process.cwd(),"dist-admin/index.html")
 );
});

3) Keep API routes before admin fallback.
