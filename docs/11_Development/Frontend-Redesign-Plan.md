# Frontend Redesign Plan

## Objective

Transform Beyraghe Mandegar from a simple reservation website into a premium artistic brand website with integrated ticketing.

The frontend must support two identities:

1. Ticket Reservation Platform
2. Official Artistic Group Website

---

# Current Frontend Review

Current components:

- Header
- PosterCard
- ScheduleList
- MapSection
- Modals
- DirectionLinks

Current limitations:

- Limited storytelling
- No archive experience
- No user ticket area
- No premium visual identity
- Components are tightly coupled

---

# Target Frontend Architecture

src/

components/

## layout

- Header
- Footer
- Navigation

## home

- HeroSection
- Countdown
- UpcomingShows
- PerformanceCard
- AboutSection
- ArchiveSection
- NewsSection

## ticket

- TicketCard
- QRCode
- CheckInStatus

## common

- Button
- Modal
- SectionTitle

pages/

- Home
- MyTickets
- Archive
- About

---

# Migration Strategy

## Phase 1 - Foundation

Tasks:

- Create new layout
- Setup theme variables
- Improve typography
- Add responsive structure

## Phase 2 - Homepage

Build:

- Hero
- Countdown
- Performance cards
- Artistic sections

## Phase 3 - Ticket Experience

Add:

- User profile
- Ticket list
- QR display
- Share and print

## Phase 4 - Archive

Add:

- Previous shows
- Gallery
- News

---

# UI Principles

- RTL First
- Mobile First
- Vazirmatn typography
- Premium cultural style
- Smooth animations
- Reusable components

---

# Technical Notes

Avoid rewriting backend dependencies during UI migration.

Frontend must consume APIs independently.

Future APIs:

- /shows
- /performances
- /tickets
- /profile
