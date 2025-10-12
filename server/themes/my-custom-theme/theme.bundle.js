// theme.bundle.js
import { merge } from "lodash";
import { defaultTheme } from "@adminjs/design-system";

const myThemeOverrides = {
  colors: {
    primary100: "#7b1fa2",  // مثلا رنگ بنفش
    primary80: "#9c27b0",
    // سایر رنگ‌ها رو می‌تونی اضافه کنی...
  },
  space: {
    contentHorizontalPadding: 16,
  },
  // ... می‌تونی چیزهای بیشتری override کنی
};

const myTheme = {
  id: "my-custom-theme",
  name: "تم فارسی تاریک",
  overrides: merge(defaultTheme, myThemeOverrides),
  stylePath: "./style.css",
  // بدون کامپوننت‌های سفارشی، bundlePath را نمی‌گذاریم
};

export default myTheme;