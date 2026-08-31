# Entity Relationship Diagram

## Core Relationships

Show
1
|
|
N
Performance
1
|
|
N
Reservation
1
|
|
N
Ticket
1
|
|
1
CheckIn

---

# Customer Flow

Customer
1
|
N
Reservation

---

# Venue Relationship

Venue
1
|
N
Performance

---

# Notification Relationship

Customer
1
|
N
Notification

---

# Administrative Relationship

AdminUser
1
|
N
AuditLog

---

# Future Extensions

Possible future entities:

- Seat
- Payment
- Invoice
- Contract
- Organization