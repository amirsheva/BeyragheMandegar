# 🎭 بیرق ماندگار | Beyragh Mandegar

سامانه وب مدیریت اجرا، رزرو و آرشیو «بیرق ماندگار» با رابط فارسی و RTL.

> شاخه `main` برای نسخه پایدار و شاخه `develop` برای توسعه فعال استفاده می‌شود.

## امکانات اصلی

- نمایش اجراهای فعال و آرشیو اجراهای گذشته
- رزرو بلیت با کنترل ظرفیت و جلوگیری تراکنشی از oversell
- صدور کد پیگیری امن و صفحه مشاهده بلیت
- جست‌وجوی رزرو با کد پیگیری
- مدیریت رزرو، لغو و بازگردانی ظرفیت از پنل مدیریت
- اخبار و صفحه جزئیات خبر
- رابط فارسی، RTL و طراحی Dark Editorial
- پشتیبانی از ارقام فارسی و عربی در ورودی‌ها

## امنیت و حریم خصوصی

- رمزنگاری `phone` و `national_id` در SQLite با AES-256-GCM
- Mask کردن اطلاعات شخصی در API پنل مدیریت
- Redaction کدهای پیگیری و پارامترهای حساس در access log
- Rate limiting برای API، رزرو و lookup بلیت
- CORS قابل تنظیم و پشتیبانی از reverse proxy
- Production preflight برای بررسی تنظیمات حساس
- زیرساخت OTP رزرو با قابلیت اتصال به SMS؛ فعال‌سازی production وابسته به تنظیم provider و متغیرهای محیطی است
- Backup/restore test و تست یکپارچگی دیتابیس

> فایل‌های واقعی `.env`، دیتابیس SQLite، backupها و کلیدهای رمزنگاری نباید در Git commit شوند.

## تکنولوژی‌ها

| بخش | تکنولوژی |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Lucide React |
| Backend | Node.js, Express |
| ORM | Sequelize |
| Database | SQLite |
| Admin | Custom React admin UI |
| CI | GitHub Actions |

## راه‌اندازی Development

نیازمندی: Node.js 20+

```bash
npm ci
npm run dev
```

- Frontend development server: Vite
- Backend/API/Admin server: Express

برای تنظیمات محیطی ابتدا از نمونه استفاده کنید:

```bash
cp .env.example .env
```

مقادیر secret و کلیدهای واقعی را فقط خارج از Git نگهداری کنید.

## Build و Test

```bash
npm run build
npm run build:admin
npm run test:core
npm run test:otp
npm run test:backup
```

Production preflight:

```bash
npm run preflight:prod
```

اسکریپت‌های مدیریت رمزنگاری PII:

```bash
npm run migrate:pii
npm run verify:pii
```

Rollback رمزنگاری یک عملیات اضطراری است و عمداً با guard محافظت شده است.

## ساختار کلی

```text
src/                      Public React application
src/admin/                Admin application
server/                   Express API and server logic
server/security/          Security helpers
server/scripts/           Tests, backup and migration tools
.github/workflows/        CI workflows
```

## Branching

- `main`: نسخه پایدار
- `develop`: توسعه و یکپارچه‌سازی تغییرات

تغییرات اصلی ابتدا روی `develop` تست می‌شوند و سپس به `main` منتقل می‌شوند.

---

## English

**Beyragh Mandegar** is a Persian RTL web application for theatre performance management, ticket reservations, archives, news, and reservation tracking.

Current stack: **React + Vite** on the frontend and **Node.js + Express + Sequelize + SQLite** on the backend, with a custom admin interface and GitHub Actions CI.

Security controls include transactional capacity checks, AES-256-GCM encryption for reservation PII, masked admin responses, access-log redaction, rate limiting, configurable CORS, production preflight checks, isolated backup/restore tests, and an optional OTP reservation foundation.

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
npm run test:backup
```

Never commit real `.env` files, SQLite databases, backups, encryption keys, session secrets, or SMS credentials.

---

Maintained by [@amirsheva](https://github.com/amirsheva)
