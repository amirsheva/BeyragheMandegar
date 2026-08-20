# Domain Entities

## Show

Purpose:

Represents an artistic production.

Attributes:

- id
- title
- description
- poster
- status
- created_at

---

## Performance

Purpose:

Represents a scheduled execution.

Attributes:

- id
- show_id
- venue_id
- start_datetime
- capacity
- sale_start_at
- sale_end_at
- status

---

## Venue

Purpose:

Represents execution location.

Attributes:

- id
- name
- address
- latitude
- longitude

---

## Customer

Purpose:

Represents audience identity.

Attributes:

- id
- mobile
- name
- verified_at
- created_at

---

## Reservation

Purpose:

Represents ticket reservation.

Attributes:

- id
- customer_id
- performance_id
- quantity
- status
- expires_at
- created_at

---

## Ticket

Purpose:

Represents digital admission.

Attributes:

- id
- reservation_id
- qr_token
- status
- used_at

---

## CheckIn

Purpose:

Represents entrance validation.

Attributes:

- id
- ticket_id
- checked_in_at
- operator_id
- validation_mode

---

## Notification

Purpose:

Stores communication records.

Attributes:

- id
- customer_id
- type
- provider
- status

---

## AuditLog

Purpose:

Tracks administrative actions.

Attributes:

- id
- user_id
- action
- entity
- timestamp