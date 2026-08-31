# Database Schema v2

## Shows

Stores artistic works.

Fields:

- id
- title
- description
- poster
- status

## Performances

Stores specific executions.

Fields:

- id
- show_id
- venue_id
- start_datetime
- capacity
- sale_start_at
- sale_end_at
- status

## Venues

Fields:

- id
- name
- address
- latitude
- longitude

## Customers

Fields:

- id
- mobile
- name
- verified_at

## Reservations

Fields:

- id
- customer_id
- performance_id
- quantity
- status
- expires_at

## Tickets

Fields:

- id
- reservation_id
- qr_token
- status
- used_at
