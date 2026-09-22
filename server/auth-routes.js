import "dotenv/config";

import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  clearAdminCookie,
  createSessionToken,
  requireAdmin,
  requireAdminOrigin,
  setAdminCookie,
  verifyAdminPassword,
} from "./auth.js";

import {
  Reservation,
} from "./models.js";

import {
  BreakGlassError,
  getBreakGlassStatus,
  recordBreakGlassReveal,
  revokeBreakGlassGrant,
  unlockBreakGlass,
  validateBreakGlassGrant,
} from "./break-glass.js";


const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  message: {
    message:
      "تعداد تلاش‌های ورود بیش از حد مجاز است. چند دقیقه بعد دوباره تلاش کنید.",
  },
});


function requestContext(req) {
  return {
    ip:
      req.ip ||
      req.socket?.remoteAddress ||
      null,

    userAgent:
      req.get?.("user-agent") ||
      null,
  };
}


function sendBreakGlassError(
  res,
  error
) {
  if (
    error instanceof
    BreakGlassError
  ) {
    return res
      .status(
        error.statusCode ||
        400
      )
      .json({
        message:
          error.message,
        code:
          error.code,
      });
  }

  console.error(
    "Break-glass error:",
    error
  );

  return res.status(500).json({
    message:
      "خطا در پردازش دسترسی اضطراری.",
  });
}


router.post(
  "/login",
  loginLimiter,
  async (req, res) => {
    const {
      username,
      password,
    } = req.body || {};

    const usernameValid =
      typeof username === "string" &&
      username ===
        process.env.ADMIN_USERNAME;

    const passwordValid =
      typeof password === "string" &&
      verifyAdminPassword(password);

    if (
      !usernameValid ||
      !passwordValid
    ) {
      return res.status(401).json({
        message:
          "نام کاربری یا رمز عبور صحیح نیست.",
      });
    }

    const token =
      createSessionToken(username);

    setAdminCookie(
      res,
      token
    );

    res.json({
      ok: true,
      user: {
        username,
      },
    });
  }
);


router.get(
  "/me",
  requireAdmin,
  (req, res) => {
    res.json({
      authenticated: true,
      user: req.admin,
    });
  }
);


router.get(
  "/break-glass/status",
  requireAdmin,
  (req, res) => {
    res.set(
      "Cache-Control",
      "no-store, private"
    );

    return res.json(
      getBreakGlassStatus(
        req.admin?.username
      )
    );
  }
);


router.post(
  "/break-glass/unlock",
  requireAdmin,
  requireAdminOrigin,
  async (req, res) => {
    try {
      const result =
        await unlockBreakGlass({
          username:
            req.admin?.username,
          password:
            req.body?.password,
          reasonCode:
            req.body?.reasonCode,
          ...requestContext(req),
        });

      res.set(
        "Cache-Control",
        "no-store, private"
      );

      return res.json(
        result
      );

    } catch (error) {
      return sendBreakGlassError(
        res,
        error
      );
    }
  }
);


router.post(
  "/break-glass/reveal/:id",
  requireAdmin,
  requireAdminOrigin,
  async (req, res) => {
    const token =
      req.get(
        "x-break-glass-grant"
      );

    const reservationId =
      Number(
        req.params.id
      );

    try {
      validateBreakGlassGrant({
        token,
        username:
          req.admin?.username,
      });

      if (
        !Number.isInteger(
          reservationId
        ) ||
        reservationId < 1
      ) {
        await recordBreakGlassReveal({
          token,
          username:
            req.admin?.username,
          reservationId:
            req.params.id,
          statusCode:
            400,
          ...requestContext(req),
        });

        return res.status(400).json({
          message:
            "شناسه رزرو نامعتبر است.",
        });
      }

      if (
        req.body?.confirm !==
        "REVEAL"
      ) {
        await recordBreakGlassReveal({
          token,
          username:
            req.admin?.username,
          reservationId,
          statusCode:
            400,
          ...requestContext(req),
        });

        return res.status(400).json({
          message:
            "تأیید مشاهده اطلاعات حساس انجام نشده است.",
        });
      }

      const reservation =
        await Reservation.findByPk(
          reservationId
        );

      if (!reservation) {
        await recordBreakGlassReveal({
          token,
          username:
            req.admin?.username,
          reservationId,
          statusCode:
            404,
          ...requestContext(req),
        });

        return res.status(404).json({
          message:
            "رزرو یافت نشد.",
        });
      }

      const revealState =
        await recordBreakGlassReveal({
          token,
          username:
            req.admin?.username,
          reservationId,
          statusCode:
            200,
          ...requestContext(req),
        });

      res.set(
        "Cache-Control",
        "no-store, private"
      );

      res.set(
        "Pragma",
        "no-cache"
      );

      return res.json({
        reservationId:
          reservation.id,
        phone:
          reservation.phone,
        nationalId:
          reservation.national_id,
        remainingReveals:
          revealState.remainingReveals,
      });

    } catch (error) {
      return sendBreakGlassError(
        res,
        error
      );
    }
  }
);


router.post(
  "/break-glass/lock",
  requireAdmin,
  requireAdminOrigin,
  async (req, res) => {
    try {
      const result =
        await revokeBreakGlassGrant({
          token:
            req.get(
              "x-break-glass-grant"
            ),
          username:
            req.admin?.username,
          ...requestContext(req),
        });

      return res.json({
        ok: true,
        ...result,
      });

    } catch (error) {
      return sendBreakGlassError(
        res,
        error
      );
    }
  }
);


router.post(
  "/logout",
  (req, res) => {
    clearAdminCookie(res);

    res.json({
      ok: true,
    });
  }
);


export default router;
