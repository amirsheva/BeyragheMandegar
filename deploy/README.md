# Backend deployment

Target path:

```text
/opt/beyragh/backend
```

Runtime: Node.js 20.19+.

Before switching production, preserve the current SQLite database and real `.env`. Do not recreate secrets.

Suggested deployment sequence:

```bash
cd /opt/beyragh/backend
npm ci --omit=dev
npm run preflight:prod
sudo cp deploy/systemd/beyragh-backend.service /etc/systemd/system/beyragh-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now beyragh-backend.service
sudo systemctl status beyragh-backend.service --no-pager -l
curl -fsS http://127.0.0.1:4000/api/health
```

The backend should not serve frontend assets. Nginx exposes it through `/api/`.
