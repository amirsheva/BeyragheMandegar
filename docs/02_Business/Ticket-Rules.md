# Ticket Rules

## Ticket Generation

هر Reservation تایید شده می‌تواند یک یا چند Ticket ایجاد کند.

Relationship:

Reservation
1:N
Ticket

---

# Ticket Properties

هر Ticket شامل:

- Unique Ticket ID
- Customer Information
- Performance Information
- QR Code
- Validation Status

است.

---

# QR Rules

هر QR باید:

- Unique باشد.
- قابل جعل نباشد.
- قابل Validate باشد.

---

# Ticket Actions

کاربر می‌تواند:

- مشاهده Ticket
- Print Ticket
- Share Ticket
- Download Ticket

را انجام دهد.

---

# Check-in Rules

بعد از ورود:

Valid Ticket
↓
Scan QR
↓
Check-in
↓
Ticket Used

یک Ticket استفاده شده دوباره قابل استفاده نیست.

---

# Offline Validation

Check-in باید در شرایط بدون اینترنت نیز قابل انجام باشد.

راهکار:

- Secure QR Token
- Local Validation Cache
- Later Synchronization