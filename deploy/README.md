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

The resulting `dist/` directory contains both the public SPA and `dist/admin/`.

The sample `deploy/nginx/beyragh.conf` is an HTTP server block for staging and integration. For production, merge its root and locations into the existing virtual host while preserving its real host names, HTTPS listeners, certificate paths, security headers, and HTTP-to-HTTPS redirects. Do not replace an existing TLS virtual host with this sample. Keep the public SPA and `/admin/` on the same origin as `/api` so existing session cookies remain same-origin.

The exact `/api` location is proxied instead of falling back to the SPA. The `^~ /api/` prefix keeps existing static-file regex locations from intercepting API requests. No `/uploads/` proxy is included because the backend does not serve that path; preserve any actual production asset locations discovered during server inspection.

Raw access logging is disabled because ticket paths, API URLs, and Referer headers may contain private tracking codes. Preserve error logging; re-enable access logs only with a format that redacts sensitive path segments, query parameters, and Referer values. When copying these locations into an existing virtual host, apply this logging policy to the whole virtual host, including static asset requests.

Validate the staged configuration before switching traffic:

```bash
sudo nginx -t
```

The backend remains bound to `127.0.0.1:4000` and is exposed through `/api` and `/api/`. Run the public, admin, session, OTP, reservation, and API checks against the staged configuration before switching production traffic with `sudo systemctl reload nginx`. Keep the previous virtual-host configuration and service available for rollback until production health is confirmed.
