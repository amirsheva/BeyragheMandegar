Beyragh Mandegar — Harmony v4

این نسخه برای اصلاح Harmony کل Home و بخش اجراها آماده شده است.

تغییرهای اصلی:
- حذف فضای سیاه اضافه از پایین پوستر
- اتصال بصری پوستر + نام نمایش + سانس
- قرار گرفتن نام نمایش روی خود پوستر با همپوشانی Gradient
- کاهش فاصله عنوان «اجراهای پیش رو» تا کارت‌ها
- کارت‌های جمع‌وجورتر و مناسب Horizontal Scroll
- یکدست شدن Header/Footer/Home Sections با مشکی + زرشکی + برنز + کرم
- حذف زمینه #111 از AppShell
- حفظ رنگ‌های وضعیت سبز/نارنجی/قرمز فقط برای Status

نصب از ریشه پروژه:

cd /Users/amirkhakdoust/Codes/Beyragh/BeyragheMandegar
unzip -o ~/Downloads/beyragh-harmony-v4.zip -d .

اگر npm run dev روشن است فقط:
Cmd + Shift + R

فایل‌های مهم این Patch:
src/assets/images/performance-posters/beyragh-mandegar.webp
src/components/home/PerformanceCard.jsx
src/components/home/UpcomingPerformances.jsx
src/components/AppShell.jsx

به‌علاوه فایل‌های تم Home/Header/Footer از نسخه Cinematic Theme.
