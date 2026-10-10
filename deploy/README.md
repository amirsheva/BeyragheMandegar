# Frontend deployment

Use the frontend split branch in the existing repository; no separate repository is required:

```bash
git clone --branch refactor/frontend-split --single-branch https://github.com/amirsheva/BeyragheMandegar.git /opt/beyragh/frontend
cd /opt/beyragh/frontend
```

Build with Node 20.19+ (the QR scanner is pinned to a release whose dependency supports Node 20):

```bash
npm ci
npm run build
npm run build:admin
```

The resulting `dist/` directory contains both the public SPA and `dist/admin/` (the admin build's `outDir` is `../dist/admin`, resolved relative to the admin build's own root, so it lands nested under the public `dist/`).

## Architecture: the frontend calls the API cross-origin

`src/lib/config.js` defaults `VITE_API_BASE_URL` to `https://api.beyraghmandegar.ir`, and `src/lib/apiBase.js` rewrites every relative `/api/...` fetch call in the app (public site and admin alike) to that absolute URL, adding `credentials: "include"` so admin/customer/checker session cookies still ride along. This means:

- The public site and admin panel are served same-origin at `beyraghmandegar.ir` (admin under `/admin/`), but the **API is a separate origin**, `api.beyraghmandegar.ir`.
- This is a deliberate change from an earlier same-origin design. Do not "fix" it back to same-origin `/api` without also reverting `config.js`/`apiBase.js` — the two must agree.
- Because of this, the backend's CORS config must have `credentials: true` (not `false`) and `CORS_ORIGINS` must include `https://beyraghmandegar.ir` and `https://www.beyraghmandegar.ir` — see `back/BeyragheMandegar/.env.example`. Cookies are host-only to `api.beyraghmandegar.ir` by default (no `domain` attribute is set), which is correct here since every API call — from both the main site and `/admin/` — goes to that one host.
- To build a staging/local variant that talks same-origin instead, set `VITE_API_BASE_URL=` (empty) before building; the `location ^~ /api/` proxy below exists for exactly that case.

The sample `deploy/nginx/beyragh.conf` has two server blocks: one for `beyraghmandegar.ir` + `www.beyraghmandegar.ir` (serves the SPA and `/admin/` from `dist/`, with the `/api/` proxy kept only as a same-origin fallback), and one for `api.beyraghmandegar.ir` (pure reverse proxy to the backend). Merge it into your real virtual hosts rather than replacing an existing one wholesale — preserve any custom security headers. Obtain TLS for all three hostnames (recommended: `sudo certbot --nginx -d beyraghmandegar.ir -d www.beyraghmandegar.ir -d api.beyraghmandegar.ir`, which edits the config in place to add the HTTPS listeners and HTTP→HTTPS redirects) rather than hand-writing certificate paths. Each hostname needs its own DNS A/AAAA record pointing at this server before certbot can issue certificates for it.

Raw access logging is disabled because ticket paths, API URLs, and Referer headers may contain private tracking codes. Preserve error logging; re-enable access logs only with a format that redacts sensitive path segments, query parameters, and Referer values.

Validate the staged configuration before switching traffic:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The backend remains bound to `127.0.0.1:4000`. With this architecture it's reached directly via the `api.beyraghmandegar.ir` server block (not through a path prefix on the main domain), though the `/api/` proxy on the main domain is kept working as a fallback. Run the public, admin, session, OTP, reservation, and API checks against the staged configuration before switching production traffic.
