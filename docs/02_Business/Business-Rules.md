# Business Rules

## Overview

این سند قوانین اصلی کسب‌وکار (Business Rules) سیستم Beyraghe Mandegar را تعریف می‌کند.

این قوانین مستقل از Implementation بوده و مبنای طراحی Backend، Database و User Experience هستند.

---

# Event Structure Rules

## Show

هر اثر هنری (Show) یک موجودیت مستقل است.

مثال:

- مکبث
- هملت
- بینوایان

یک Show می‌تواند چند اجرای مختلف داشته باشد.

---

## Performance

هر اجرای مشخص (Performance) شامل:

- Show
- Venue
- Date
- Time
- Capacity
- Sales Status

است.

مثال:
Show:
Macbeth
Performance:
20 Azar 1405
19:30
Farhangsara Khavaran

---

# Performance Rules

- هر Show می‌تواند چند Performance داشته باشد.
- هر Performance ظرفیت مستقل دارد.
- هر Performance وضعیت فروش مستقل دارد.
- چند Performance می‌توانند همزمان فعال باشند.
- Performanceهای پایان‌یافته وارد Archive می‌شوند.

---

# Capacity Rules

ظرفیت در چند سطح کنترل می‌شود:

## Venue Capacity

ظرفیت واقعی سالن.

## Performance Capacity

ظرفیت اختصاص داده شده برای یک اجرا.

## Sellable Capacity

تعداد بلیت قابل فروش.

فرمول:
Sellable Capacity =
Performance Capacity - Confirmed Tickets

---

# MVP Business Boundaries

در نسخه فعلی:

Included:

- Reservation
- Ticket
- Check-in
- SMS
- Dashboard

Excluded:

- Payment
- Accounting
- Contract Management
- Settlement Management
- Seat Selection
