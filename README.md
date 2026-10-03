# Beyragh Mandegar Frontend

Frontend-only repository for Beyragh Mandegar.

## Stack

- React 18
- Vite 7
- Tailwind CSS
- Public UI + custom React Admin UI

## Runtime

Node.js **20.19+**.

## Development

Backend should be running on `http://localhost:4000`.

```bash
npm ci
npm run dev
```

Public UI: `http://localhost:5173`

Admin UI:

```bash
npm run dev:admin
```

Admin: `http://localhost:5174/admin/`

Both Vite dev servers proxy `/api` to the backend.

## Production

```bash
npm ci
npm run build
npm run build:admin
```

Deploy `dist/` as the public site and `dist-admin/` at `/admin/`. Keep `/api` on the same public origin and reverse-proxy it to the backend service. This preserves the existing HttpOnly session-cookie security model without cross-site cookie changes.
