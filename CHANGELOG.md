# Changelog

تمام تغییرات مهم پروژه «بیرق ماندگار» در این فایل ثبت می‌شوند.

فرمت این فایل بر پایه Keep a Changelog است و نسخه‌ها از Semantic Versioning پیروی می‌کنند.

## [2.0.0] - 2026-08-31

### Added

- فرایند رزرو چندمرحله‌ای با مرحله مستقل OTP و تأیید نهایی.
- پرتال «رزروهای من» با ورود OTP و Session از نوع HttpOnly.
- HMAC lookup برای پیدا کردن رزروهای مرتبط با شماره موبایل بدون جست‌وجو روی ciphertext.
- QR مستقل و امضاشده برای هر بلیت.
- صفحه کنترل بلیت سالن با QR Reader و دسترسی به دوربین موبایل.
- پشتیبانی از چند مسئول سالن به‌صورت هم‌زمان.
- جلوگیری اتمیک از Scan تکراری یک QR.
- Audit trail برای Scanهای بلیت.
- پذیرش دستی با کد پیگیری به‌عنوان fallback.
- داشبورد زنده پذیرش سالن با آمار هر اجرا، پیشرفت ورود و آخرین رخدادهای Scan.
- مدیریت DB-backed حساب‌های Ticket Checker از پنل Admin.
- امکان ساخت، ویرایش، غیرفعال‌سازی و Reset Password مسئول سالن.
- محدودسازی دسترسی هر مسئول به همه اجراها یا اجراهای مشخص.
- نمایش آخرین ورود و آخرین Scan مسئولان سالن.
- فیلتر اجرا و تاریخ برای مدیریت رزروها.
- خروجی CSV رزروها با UTF-8 BOM و محافظت در برابر Spreadsheet Formula Injection.
- تست‌های اختصاصی Customer Portal، Reservation Operations، QR Check-in، Attendance Dashboard و Checker Management.
- پشتیبانی کامل‌تر از Light Theme در Booking، Ticket، Check-in و Admin.

### Changed

- زیرساخت رزرو و بلیت برای کنترل بهتر ظرفیت و عملیات سالن سخت‌سازی شد.
- حساب‌های قدیمی Ticket Checker از تنظیمات محیطی به دیتابیس Seed می‌شوند و رفتار موجود حفظ می‌شود.
- UI مرحله تأیید نهایی رزرو و Ticket Stub بازطراحی شد.
- README با معماری و Validation واقعی نسخه 2.0.0 همگام شد.
- CI گسترش یافت تا مسیرهای Customer، Reservation Ops، QR، Attendance و Checker Management را نیز تست کند.

### Security

- رمزنگاری `phone` و `national_id` با AES-256-GCM.
- HMAC digest برای lookup شماره موبایل.
- جلوگیری از قرار گرفتن شماره خام در Customer Session.
- Mask کردن PII در Admin API و CSV Export.
- حذف `national_id` از CSV رزروها.
- جلوگیری از درج PII در QR payload.
- Sessionهای مستقل برای Admin، Customer و Ticket Checker.
- کنترل دسترسی Ticket Checker بر اساس اجرای مجاز.
- جلوگیری از استفاده مجدد از QR و محافظت در برابر Scan هم‌زمان.
- Redaction اطلاعات حساس در Access Log.

### Validation

Release Candidate با این مسیرها اعتبارسنجی می‌شود:

```bash
npm run build
npm run build:admin
npm run test:core
npm run test:otp
npm run test:customer
npm run test:reservation-ops
npm run test:checkin
npm run test:attendance
npm run test:checkers
npm run test:backup
```

## [1.0.0] - 2025-10-12

### Added

- اولین Release رسمی پروژه.
- پنل مدیریت اولیه.
- رزرو اولیه بلیت.
- رابط Dark Theme اولیه.

> نسخه 1.0.0 به‌عنوان Legacy Release نگهداری می‌شود و تاریخچه آن بازنویسی نمی‌شود.
