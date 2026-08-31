# Beyragh Mandegar — Next Roadmap

## Current baseline

- Public React/Vite app on port 5173.
- Express API on port 4000.
- React admin served only from `/admin/` on port 4000.
- Domain model: `Production -> Performance -> Reservation`.
- Seed data: one production (`بیرق ماندگار`) and five performances from 1405/08/01 through 1405/08/05 at 20:00.
- Admin CRUD foundation for productions, performances and reservation state management.
- Runtime SQLite database excluded from Git.

## P0 — Security and data protection

1. Add admin authentication before any public deployment.
   - Session-based login.
   - Strong password hashing.
   - Secure, HttpOnly, SameSite cookies.
   - Login rate limiting and lockout/backoff.
   - Optional 2FA after the first stable release.
2. Protect every `/api/admin/*` route with authentication/authorization middleware.
3. Move all secrets to environment variables and add a safe `.env.example`.
4. Treat phone number and national ID as PII.
   - Never log them in plain text.
   - Never commit runtime data or backups.
   - Encrypt sensitive values at rest or move production storage to a database/volume with encryption support.
   - Mask values in admin lists where full display is unnecessary.
5. Add request validation and normalization for phone, national ID, ticket count, dates and IDs.
6. Make capacity reservation atomic to prevent overselling under concurrent requests.
7. Add an admin audit log for create/edit/delete/cancel/reopen actions.
8. Add encrypted backups and perform an actual restore test.

## P1 — Automated tests

1. Reservation creation success path.
2. Reject reservation when capacity is insufficient.
3. Reject booking when a performance is closed.
4. Ensure remaining capacity decreases exactly once.
5. Cancel reservation and restore capacity.
6. Reactivate reservation only when enough capacity exists.
7. Performance create/edit/delete tests.
8. Production CRUD tests.
9. Admin authentication and authorization tests.
10. Smoke test for public `/api/productions`, `/api/performances` and compatibility `/api/shows`.

## P2 — SMS test and notification layer

1. Introduce an SMS service interface instead of calling a provider directly from reservation code.
2. Add `SMS_MODE=mock` for local development.
   - Do not send real SMS.
   - Store/log the rendered message safely for testing.
3. Templates:
   - Reservation confirmation with tracking code, show date and time.
   - Reservation cancellation.
   - Reservation reactivation if needed.
4. Add idempotency so one reservation cannot accidentally send duplicate confirmation SMS messages.
5. Add send status, provider message ID, retry count and last error to an SMS log table.
6. Add controlled retry with a maximum retry count.
7. Add rate limits to endpoints capable of causing SMS sends.
8. After mock tests pass, connect one real SMS provider using credentials only from environment variables.

## P3 — Poster and media management

1. Generate the primary visual direction for `بیرق ماندگار`.
2. Prepare consistent image variants:
   - Main poster: 4:5 or 2:3.
   - Website hero: 16:9.
   - Social square: 1:1.
   - Story/reel cover: 9:16.
3. Prefer generating the artwork without dense typography; keep critical Persian title/date text as a controlled overlay so spelling and layout remain exact.
4. Add media upload/selection to Admin.
5. Validate image type and size server-side.
6. Store generated/uploaded media outside the source tree in production and persist only its URL/path in the database.
7. Generate optimized WebP/AVIF variants and thumbnails.

## P4 — Content management

1. Finish production editor: title, slug, subtitle, short description, full description, director/credits, tags, status and poster.
2. News CRUD.
3. Gallery CRUD and ordering.
4. Homepage content sourced from the API instead of hard-coded placeholders.
5. Upcoming-performance block, remaining capacity and booking CTA.
6. SEO fields: title, description, Open Graph image and canonical slug.

## P5 — Reservation operations

1. Search/filter by tracking code, phone, date, performance and reservation status.
2. Mask phone/national ID by default and reveal only when authorized.
3. CSV/Excel export with an explicit admin action and audit entry.
4. Tracking-code lookup page for the customer.
5. Optional duplicate-reservation rules by phone/national ID depending on business policy.
6. Clear closed/sold-out states in public UI.

## P6 — Production infrastructure

1. HTTPS behind a reverse proxy.
2. Production environment variables and secret management.
3. Database backup schedule plus retention policy.
4. Error monitoring and health endpoint.
5. Structured logs with PII redaction.
6. Dependency/security scanning.
7. CI checks: build, tests and lint before deployment.
8. Staging environment before production.


## P7 — QR ticket and hall check-in

1. Generate a unique signed QR payload for every valid ticket/reservation.
2. Add a dedicated mobile-first hall-checker page with phone camera access and QR Reader.
3. Add a `ticket_checker` role with independent authentication; support two, three, or more concurrent checker users.
4. Validate scans atomically so the same ticket cannot be accepted twice, including near-simultaneous scans by different checker devices.
5. Return a clear scan result:
   - valid / admitted
   - already used
   - cancelled
   - wrong performance
   - invalid or forged QR
6. Record every scan in an audit log with checker identity, performance, timestamp, result and relevant device/session metadata.
7. Add manual tracking-code lookup as a fallback when camera/QR scanning is unavailable.
8. Add an attendance/check-in dashboard for hall operations.
9. Design offline check-in and controlled synchronization as a later hardening phase.
## Recommended execution order

1. Admin authentication + `/api/admin` protection.
2. PII handling, validation, atomic capacity update and backups.
3. Automated reservation/security tests.
4. SMS mock service and templates.
5. Poster generation + media management.
6. Complete content/news/gallery management.
7. Reservation search/export/operations.
8. Staging, security pass and production deployment.
