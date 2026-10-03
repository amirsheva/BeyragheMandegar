# Beyragh Mandegar Backend

Standalone API/backend for Beyragh Mandegar.

## Stack

- Node.js 20.19+
- Express
- Sequelize
- SQLite
- OTP / SMS
- Admin, customer and ticket-checker APIs

This repository does not build or serve React/Vite assets.

## Development

```bash
npm ci
cp .env.example .env
npm run dev
```

API: `http://localhost:4000/api`

The standalone frontend dev servers proxy `/api` to this service.

## Production

Run this service on localhost (for example port 4000) behind Nginx. Nginx should serve the frontend static builds and reverse-proxy `/api` to this backend. Keep the existing database and production secrets outside the repository.

```bash
npm ci
npm run preflight:prod
npm start
```
