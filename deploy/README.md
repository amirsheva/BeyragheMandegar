# Frontend deployment

Build with Node 20.19+:

```bash
npm ci
npm run build
npm run build:admin
```

The resulting `dist/` directory contains both the public SPA and `dist/admin/`.

Use `deploy/nginx/beyragh.conf` as the base Nginx server block. In production replace `server_name _;` with the real host if the existing virtual host requires it, then validate with:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The backend remains bound to `127.0.0.1:4000` and is exposed only through `/api/`.
