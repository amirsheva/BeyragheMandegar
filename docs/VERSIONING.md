# Versioning & Release Policy

پروژه «بیرق ماندگار» از Semantic Versioning (`MAJOR.MINOR.PATCH`) استفاده می‌کند.

## قالب نسخه

```text
vMAJOR.MINOR.PATCH
```

مثال:

```text
v2.0.0
v2.0.1
v2.1.0
v3.0.0
```

## معنی بخش‌ها

### MAJOR

برای تغییر Breaking که نیازمند تغییر در API، قرارداد داده، migration ناسازگار یا رفتار اصلی محصول باشد.

مثال:

```text
v2.4.3 → v3.0.0
```

### MINOR

برای قابلیت جدیدی که با نسخه قبلی سازگار است.

مثال:

```text
v2.0.0 → v2.1.0
```

### PATCH

برای Bug Fix، اصلاح امنیتی سازگار، بهبود UI یا تغییر کوچکی که قابلیت Breaking ایجاد نمی‌کند.

مثال:

```text
v2.0.0 → v2.0.1
```

## Pre-release

نسخه‌های آزمایشی با suffix منتشر می‌شوند:

```text
v2.1.0-alpha.1
v2.1.0-beta.1
v2.1.0-rc.1
```

`rc` یعنی Release Candidate و فقط در صورتی به نسخه پایدار تبدیل می‌شود که Release Gate کامل پاس شود.

## Branching

- `main`: آخرین نسخه پایدار و قابل انتشار
- `develop`: توسعه و integration فعال
- `release/x.y.z`: آماده‌سازی نسخه، Release Notes و Release Gate

Featureها ابتدا به `develop` می‌روند. هنگام آماده‌سازی نسخه، یک branch از `develop` با نام `release/x.y.z` ساخته می‌شود. فقط اصلاحات Release Prep و Bug Fix ضروری روی این branch انجام می‌شود. پس از سبز شدن CI، Release branch به `main` Merge می‌شود.

## Release Gate

نسخه پایدار باید حداقل این بررسی‌ها را پاس کند:

```bash
npm ci
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

برای Deployment production نیز:

```bash
npm run preflight:prod
```

## Release Checklist

1. نسخه `package.json` و `package-lock.json` یکسان باشد.
2. `CHANGELOG.md` به‌روز شود.
3. README قابلیت‌های نسخه را منعکس کند.
4. artifactهای backup/generated وارد release نشوند.
5. `.env`، دیتابیس SQLite، secretها و credentialها داخل Git نباشند.
6. CI روی Release Candidate سبز باشد.
7. Release Candidate به `main` Merge شود.
8. Tag با فرمت `vX.Y.Z` روی Commit نهایی `main` ساخته شود.
9. GitHub Release از همان Tag منتشر شود.
10. توسعه بعدی دوباره روی `develop` ادامه پیدا کند.

## Release Notes

Release Notes باید حداقل این بخش‌ها را داشته باشد:

- Highlights
- Added
- Changed
- Security
- Validation
- Known limitations (در صورت وجود)

## نسخه جاری

نسخه پایدار هدف این Release:

```text
v2.0.0
```

نسخه `v1.0.0` به‌عنوان Legacy Release نگهداری می‌شود.
