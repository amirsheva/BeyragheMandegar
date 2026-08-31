# 🎭 بیرق ماندگار | Beyragh Mandegar

سامانه وب فارسی و RTL برای مدیریت اجرا، رزرو، صدور بلیت، آرشیو، اخبار و عملیات پذیرش سالن.

**Current release:** `v2.0.0`

> `main` نسخه پایدار است، `develop` برای توسعه فعال استفاده می‌شود و Release Candidateها از شاخه‌های `release/*` آماده می‌شوند.

## امکانات اصلی

- نمایش اجراهای فعال و آرشیو اجراهای گذشته
- رزرو چندمرحله‌ای بلیت با کنترل ظرفیت و جلوگیری تراکنشی از oversell
- ورود OTP در فرایند رزرو و پرتال «رزروهای من»
- صدور کد پیگیری و صفحه مشاهده بلیت
- QR مستقل و امضاشده برای هر بلیت
- کنترل ورود سالن با دوربین موبایل و QR Reader
- جلوگیری اتمیک از Scan تکراری یک بلیت توسط چند مسئول سالن
- پذیرش دستی با کد پیگیری به‌عنوان fallback
- داشبورد زنده پذیرش سالن و Audit آخرین Scanها
- حساب مستقل برای مسئولان کنترل بلیت با دسترسی به همه اجراها یا اجراهای مشخص
- مدیریت رزرو، لغو، بازیابی ظرفیت، فیلتر و خروجی CSV از پنل مدیریت
- اخبار، سالن‌ها و مدیریت محتوای اصلی
- رابط فارسی، RTL، Light/Dark Theme و فونت Vazirmatn
- پشتیبانی از ارقام فارسی و عربی در ورودی‌ها

## امنیت و حریم خصوصی

- رمزنگاری `phone` و `national_id` در SQLite با AES-256-GCM
- HMAC lookup برای جست‌وجوی رزروهای یک شماره بدون جست‌وجو روی ciphertext
- Mask کردن اطلاعات شخصی در API و خروجی‌های پنل مدیریت
- عدم بازگرداندن شماره موبایل و کد ملی از Customer API
- Sessionهای `HttpOnly` برای Admin، Customer و Ticket Checker
- Redaction کدهای پیگیری و پارامترهای حساس در access log
- Rate limiting برای API، رزرو و lookup بلیت
- CORS و reverse proxy قابل تنظیم
- Production preflight برای تنظیمات حساس
- زیرساخت OTP با قابلیت اتصال به SMS.ir؛ در Development می‌تواند روی NOOP اجرا شود
- تست Backup/Restore و تست‌های ایزوله دیتابیس

> فایل واقعی `.env`، دیتابیس SQLite، backupها، کلیدهای رمزنگاری، session secretها و credentialهای SMS نباید در Git commit شوند.

## تکنولوژی‌ها

| بخش | تکنولوژی |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React |
| QR | qrcode, @zxing/browser |
| Backend | Node.js 20+, Express |
| ORM | Sequelize |
| Database | SQLite |
| Admin | Custom React Admin UI |
| CI | GitHub Actions |

## راه‌اندازی Development

```bash
npm ci
cp .env.example .env
npm run dev
```

- Public frontend: Vite
- Backend/API/Admin: Express
- Admin: `/admin`
- Customer portal: `/my-reservations`
- Hall checker: `/check-in`

## Build و Validation

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

Production preflight:

```bash
npm run preflight:prod
```

PII migration/verification:

```bash
npm run migrate:pii
npm run verify:pii
```

Rollback رمزنگاری یک عملیات اضطراری است و با guard محافظت شده است.

## نسخه‌دهی و Release

این پروژه از Semantic Versioning استفاده می‌کند:

- `MAJOR`: تغییر Breaking
- `MINOR`: قابلیت جدید سازگار
- `PATCH`: Bug Fix سازگار

مثال‌ها: `v2.0.1`, `v2.1.0`, `v3.0.0` و برای نسخه‌های آزمایشی `v2.1.0-beta.1` یا `v2.1.0-rc.1`.

جزئیات: [`docs/VERSIONING.md`](docs/VERSIONING.md)

تاریخچه تغییرات: [`CHANGELOG.md`](CHANGELOG.md)

## Branching

- `main`: نسخه پایدار قابل Release
- `develop`: توسعه و Integration
- `release/x.y.z`: آماده‌سازی Release Candidate

Featureها ابتدا روی `develop` یکپارچه و تست می‌شوند؛ سپس Release Candidate به `main` منتقل می‌شود.

## ساختار کلی

```text
src/                      Public React application
src/admin/                Admin application
server/                   Express API and server logic
server/security/          Security helpers
server/scripts/           Tests, backup and migration tools
docs/                     Product, engineering and release documentation
.github/workflows/        CI workflows
```

---

## English

**Beyragh Mandegar** is a Persian RTL web application for performance management, ticket reservations, customer self-service, QR ticketing, hall check-in, archives, news and admin operations.

Release `v2.0.0` introduces the complete customer-to-door ticketing flow: OTP-backed reservations, My Reservations, one signed QR per ticket, multi-checker admission, attendance monitoring, checker account management and hardened PII handling.

### Development

```bash
npm ci
npm run dev
```

### Validation

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

Never commit real `.env` files, SQLite databases, backups, encryption keys, session secrets or SMS credentials.

---

Maintained by [@amirsheva](https://github.com/amirsheva)
