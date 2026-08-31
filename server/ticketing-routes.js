import {
  Router,
} from "express";

import {
  Reservation,
} from "./models.js";

import {
  getReservationQrTickets,
} from "./checkin-service.js";


const router =
  Router();


router.get(
  "/reservations/:trackingCode/qr",
  async (
    req,
    res
  ) => {
    try {
      const trackingCode =
        String(
          req.params
            .trackingCode ||
          ""
        )
          .trim()
          .toUpperCase();


      if (
        !/^[A-Z0-9-]{6,80}$/.test(
          trackingCode
        )
      ) {
        return res
          .status(400)
          .json({
            message:
              "کد پیگیری نامعتبر است.",
          });
      }


      const reservation =
        await Reservation.findOne({
          where: {
            tracking_code:
              trackingCode,
          },
        });


      if (!reservation) {
        return res
          .status(404)
          .json({
            message:
              "رزرو یافت نشد.",
          });
      }


      res.set(
        "Cache-Control",
        "private, no-store, max-age=0"
      );


      return res.json({
        ok:
          true,

        status:
          reservation.status,

        count:
          reservation.count,

        tickets:
          await getReservationQrTickets(
            reservation
          ),
      });

    } catch (error) {
      console.error(
        "Public ticket QR error:",
        error
      );

      if (
        error.code ===
        "QR_NOT_CONFIGURED"
      ) {
        return res
          .status(503)
          .json({
            message:
              "QR بلیت هنوز پیکربندی نشده است.",
          });
      }

      return res
        .status(500)
        .json({
          message:
            "خطا در ساخت QR بلیت.",
        });
    }
  }
);


export {
  router as ticketingRouter,
};