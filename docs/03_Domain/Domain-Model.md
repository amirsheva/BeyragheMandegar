# Domain Model

## Overview

The domain model defines the core business concepts of Beyraghe Mandegar.

The system is modeled around artistic events, performances, reservations, digital tickets, and event operations.

---

# Core Domain Concepts

## Show

A Show represents an artistic work created by the group.

Examples:

- Macbeth
- Hamlet

A Show contains general information and does not represent a specific event occurrence.

---

## Performance

A Performance represents a specific execution of a Show.

A Performance defines:

- Date
- Time
- Venue
- Capacity
- Sales Status

Relationship:

Show
1:N
Performance

A single Show can have multiple performances in different venues and dates.

---

## Venue

A Venue represents the physical location where a Performance happens.

Information includes:

- Name
- Address
- Coordinates
- Navigation providers

---

## Customer

A Customer represents an audience member.

Identity is based on:

- Mobile Number
- OTP Verification

A Customer can have multiple reservations.

---

## Reservation

A Reservation represents a customer's request to reserve tickets for a Performance.

A Reservation controls:

- Quantity
- Status
- Expiration
- Customer ownership

Relationship:

Customer
1:N
Reservation

---

## Ticket

A Ticket represents the admission document generated from a confirmed reservation.

A Reservation may create multiple Tickets.

Relationship:

Reservation
1:N
Ticket

---

## Check-in

Check-in represents the attendance validation process.

A Ticket can be checked in once.

Relationship:

Ticket
1:1
CheckIn

---

# Supporting Domains

## Notification

Responsible for communication:

- OTP
- Confirmation
- Reminder

---

## Content

Responsible for public information:

- News
- Gallery
- Archive

---

## Identity and Access

Responsible for administration:

- Admin Users
- Roles
- Permissions
- Audit Logs