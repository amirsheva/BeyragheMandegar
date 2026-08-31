import {
  Router,
} from "express";

import {
  clearCheckerCookie,
  createCheckerSession,
  requireChecker,
  requireCheckerOrigin,
  setCheckerCookie,
  verifyCheckerCredentials,
} from "./checker-auth.js";

import {
  isCheckerAllowedForPerformance,
} from "./checker-user-service.js";

import {
  getCheckinStats,
  getRecentScans,
  listCheckerPerformances,
  manualAdmitByTrackingCode,
  scanTicketQr,
} from "./checkin-service.js";


const router =
  Router();


function resultMessage(
  result
) {
  const map = {
    admitted:
      "بلیت معتبر است و پذیرش ثبت شد.",

    already_used:
      "این بلیت قبلاً پذیرش شده است.",

    cancelled:
      "این رزرو لغو شده و معتبر نیست.",

    wrong_performance:
      "این بلیت مربوط به اجرای انتخاب‌شده نیست.",

    invalid:
      "QR یا کد واردشده معتبر نیست.",

    not_found:
      "بلیت یا رزرو پیدا نشد.",
  };

  return map[result] ||
    "نتیجه نامشخص است.";
}


async function checkerCanAccess(
  req,
  performanceId
) {
  return isCheckerAllowedForPerformance(
    req.checker
      .username,
    performanceId
  );
}


router.post(
  "/auth/login",
  requireCheckerOrigin,
  async (
    req,
    res
  ) => {
    try {
      const user =
        await verifyCheckerCredentials(
          req.body
            ?.username,

          req.body
            ?.password
        );

      if (!user) {
        return res
          .status(401)
          .json({
            message:
              "نام کاربری یا رمز عبور صحیح نیست.",
          });
      }

      const token =
        createCheckerSession(
          user
        );

      setCheckerCookie(
        res,
        token
      );

      return res.json({
        ok:
          true,

        user,
      });

    } catch (error) {
      console.error(
        "Checker login error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "خطا در ورود مسئول کنترل بلیت.",
        });
    }
  }
);


router.get(
  "/auth/me",
  requireChecker,
  (
    req,
    res
  ) =>
    res.json({
      ok:
        true,

      user:
        req.checker,
    })
);


router.delete(
  "/auth/logout",
  requireCheckerOrigin,
  (
    req,
    res
  ) => {
    clearCheckerCookie(
      res
    );

    return res.json({
      ok:
        true,
    });
  }
);


router.get(
  "/performances",
  requireChecker,
  async (
    req,
    res
  ) => {
    try {
      const all =
        await listCheckerPerformances();


      const performances =
        [];


      for (
        const item of all
      ) {
        if (
          await checkerCanAccess(
            req,
            item.id
          )
        ) {
          performances.push(
            item
          );
        }
      }


      return res.json({
        ok:
          true,

        performances,
      });

    } catch (error) {
      console.error(
        "Checker performances error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "خطا در دریافت اجراهای قابل پذیرش.",
        });
    }
  }
);


router.get(
  "/performances/:id/status",
  requireChecker,
  async (
    req,
    res
  ) => {
    try {
      const id =
        Number(
          req.params.id
        );


      if (
        !await checkerCanAccess(
          req,
          id
        )
      ) {
        return res
          .status(403)
          .json({
            message:
              "به این اجرا دسترسی ندارید.",
          });
      }


      return res.json({
        ok:
          true,

        stats:
          await getCheckinStats(
            id
          ),

        recent:
          await getRecentScans(
            id,
            12
          ),
      });

    } catch (error) {
      console.error(
        "Checker status error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "خطا در دریافت وضعیت پذیرش.",
        });
    }
  }
);


router.post(
  "/scan",
  requireCheckerOrigin,
  requireChecker,
  async (
    req,
    res
  ) => {
    try {
      const performanceId =
        Number(
          req.body
            ?.performanceId
        );

      if (
        !Number.isInteger(
          performanceId
        ) ||
        performanceId < 1
      ) {
        return res
          .status(400)
          .json({
            message:
              "ابتدا اجرای موردنظر را انتخاب کنید.",
          });
      }


      if (
        !await checkerCanAccess(
          req,
          performanceId
        )
      ) {
        return res
          .status(403)
          .json({
            message:
              "به این اجرا دسترسی ندارید.",
          });
      }


      const output =
        await scanTicketQr({
          payload:
            req.body
              ?.payload,

          performanceId,

          checkerUsername:
            req.checker
              .username,
        });

      return res.json({
        ok:
          output.result ===
          "admitted",

        ...output,

        message:
          resultMessage(
            output.result
          ),

        stats:
          await getCheckinStats(
            performanceId
          ),
      });

    } catch (error) {
      console.error(
        "QR scan error:",
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
              "زیرساخت QR هنوز پیکربندی نشده است.",
          });
      }

      return res
        .status(500)
        .json({
          message:
            "خطا در بررسی QR بلیت.",
        });
    }
  }
);


router.post(
  "/manual-admit",
  requireCheckerOrigin,
  requireChecker,
  async (
    req,
    res
  ) => {
    try {
      const performanceId =
        Number(
          req.body
            ?.performanceId
        );

      if (
        !Number.isInteger(
          performanceId
        ) ||
        performanceId < 1
      ) {
        return res
          .status(400)
          .json({
            message:
              "ابتدا اجرای موردنظر را انتخاب کنید.",
          });
      }


      if (
        !await checkerCanAccess(
          req,
          performanceId
        )
      ) {
        return res
          .status(403)
          .json({
            message:
              "به این اجرا دسترسی ندارید.",
          });
      }


      const output =
        await manualAdmitByTrackingCode({
          trackingCode:
            req.body
              ?.trackingCode,

          performanceId,

          checkerUsername:
            req.checker
              .username,
        });

      return res.json({
        ok:
          output.result ===
          "admitted",

        ...output,

        message:
          resultMessage(
            output.result
          ),

        stats:
          await getCheckinStats(
            performanceId
          ),
      });

    } catch (error) {
      console.error(
        "Manual admission error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "خطا در پذیرش دستی بلیت.",
        });
    }
  }
);


export {
  router as checkerRouter,
};