# Reservation Rules

## Reservation Lifecycle

هر رزرو (Reservation) دارای چرخه عمر مشخص است:

Pending
    |
Confirmed
    |
Checked-in

حالت‌های دیگر:

Expired
Cancelled

---

# Reservation Creation

برای ایجاد رزرو:

شرایط:

- Performance باید فعال باشد.
- فروش باید Open باشد.
- ظرفیت کافی وجود داشته باشد.
- کاربر باید OTP Verify شده باشد.

---

# Customer Authentication

کاربر با شماره موبایل احراز هویت می‌شود.

Flow:

Enter Mobile
↓
Send OTP
↓
Verify OTP
↓
Create/Login Profile

---

# Purchase Limit

ادمین می‌تواند محدودیت خرید تعریف کند:

مثال:

Maximum Tickets Per Reservation: 4

---

# Reservation Expiration

رزروهای تایید نشده دارای زمان انقضا هستند.

مثال:

Reservation Created
↓
10 Minutes
↓
Expired

بعد از Expire:

- ظرفیت آزاد می‌شود.
- Ticket ایجاد نمی‌شود.

---

# Multiple Active Reservations

سیستم باید امکان وجود چند رزرو همزمان برای Performanceهای مختلف را داشته باشد.

مثال:

Macbeth - 20 Azar - Open
Hamlet - 25 Azar - Open