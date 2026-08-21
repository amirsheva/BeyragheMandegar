// server/index.js

import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import { setupAdmin } from "./admin.js";
import { Show, Reservation } from "./models.js";


async function startServer() {

  const app = express();


  // ============================
  // Security & Middleware
  // ============================

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );


  app.use(morgan("tiny"));


  app.use(
    cors({
      origin: [
        "http://localhost:5173"
      ],
      credentials: false,
    })
  );


  app.use(
    express.json({
      limit: "1mb"
    })
  );


  app.use(
    "/api/",
    rateLimit({
      windowMs: 60_000,
      max: 20,
    })
  );


  // ============================
  // Database Init
  // ============================

  await setupAdmin(app);



  // ============================
  // API
  // ============================


  app.get(
    "/api/shows",
    async (req,res)=>{

      try {

        const data =
          await Show.findAll();

        res.json(data);


      } catch(e){

        console.error(
          "Error fetching shows:",
          e
        );


        res.status(500)
        .json({
          message:"خطا در گرفتن سانس‌ها"
        });

      }

    }
  );



  app.post(
    "/api/reservations",
    async(req,res)=>{

      try {


        const {
          name,
          phone,
          nationalId,
          count,
          showtime

        } = req.body || {};



        if(
          !name ||
          !phone ||
          !nationalId ||
          !showtime?.showtimeId
        ){

          return res
          .status(400)
          .json({
            message:"اطلاعات ناقص است."
          });

        }



        const showRec =
          await Show.findByPk(
            showtime.showtimeId
          );



        if(!showRec){

          return res
          .status(404)
          .json({
            message:"سانس یافت نشد."
          });

        }



        await Reservation.create({

          name,

          phone,

          national_id:nationalId,

          count,

          show_id:showtime.showtimeId,

        });



        showRec.capacity =
          showRec.capacity - count;


        await showRec.save();



        res.json({
          ok:true
        });



      }catch(err){


        console.error(
          "Reservation error:",
          err
        );


        res
        .status(500)
        .json({
          message:"خطای داخلی سرور."
        });


      }

    }
  );




  // ============================
  // React Admin Panel
  // ============================


  // Serve React Admin assets
  app.use(
    express.static(
      path.join(
        process.cwd(),
        "dist-admin"
      )
    )
  );



  // Admin entry
  app.get(
    "/admin",
    (req,res)=>{

      res.sendFile(
        path.join(
          process.cwd(),
          "dist-admin",
          "index.html"
        )
      );

    }
  );



  // Admin internal routes
  app.get(
    "/admin/*",
    (req,res)=>{

      res.sendFile(
        path.join(
          process.cwd(),
          "dist-admin",
          "index.html"
        )
      );

    }
  );




  // ============================
  // 404
  // ============================


  app.use(
    (req,res)=>{

      res.status(404)
      .json({
        message:"مسیر یافت نشد"
      });

    }
  );



  // ============================
  // Start
  // ============================


  const PORT =
    process.env.PORT || 4000;



  app.listen(
    PORT,
    ()=>{

      console.log(
        `✅ Server running on http://localhost:${PORT}`
      );


      console.log(
        `🔧 Admin panel at http://localhost:${PORT}/admin`
      );

    }
  );

}



startServer()
.catch(
  (e)=>{

    console.error(
      "خطا در راه‌اندازی سرور:",
      e
    );

  }
);