import "dotenv/config";

import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  clearAdminCookie,
  createSessionToken,
  requireAdmin,
  setAdminCookie,
  verifyAdminPassword,
} from "./auth.js";

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
