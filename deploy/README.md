# Backend deployment

Target path:

```text
/opt/beyragh/backend
```

Runtime: Node.js 20.19+.

Source repository: `amirsheva/BeyragheMandegar`, branch `refactor/backend-split`.
Deploy a recorded, verified commit from that branch into the independent backend checkout; no new repository is required.

The backend defaults to `HOST=127.0.0.1` and `PORT=4000`. Its systemd service runs as the existing production `beyragh` user/group and configures that loopback address and port; keep the copied environment consistent because `EnvironmentFile` values can override unit defaults. The service user must be able to read its owner-only `.env` and write its database/backup directories. Check for an existing listener before starting it; use a different loopback port for staging if the old service already owns port 4000.

Before switching production:

1. Inspect the existing `/opt/beyragh/app` checkout, `beyragh.service`, Nginx configuration, environment-file location, and actual resolved SQLite path. Preserve the original checkout, service unit, and a timestamped copy of the Nginx configuration for rollback.
2. Copy the existing environment into `/opt/beyragh/backend/.env` with owner-only permissions. Preserve the exact admin password hash and all admin/customer/checker session, OTP, phone-lookup, PII-encryption, and QR secrets. Do not print, regenerate, or commit them. Set absolute `DB_STORAGE` and `BACKUP_DIR` paths for the new backend. Preserve its existing feature flags and provider settings. Set `NODE_ENV=production`, `TRUST_PROXY=1`, and the exact public HTTPS origin in `ADMIN_ORIGIN`, `CUSTOMER_ORIGIN`, and `CORS_ORIGINS`.
3. Create a consistent SQLite staging snapshot with SQLite's backup API or `VACUUM INTO`; copying just the live database file can lose changes in WAL/journal files. Run `PRAGMA integrity_check` and compare table counts without displaying customer data. Include any separately stored uploads or other runtime assets identified in the production inspection. Keep `.env`, SQLite data, backups, and uploads outside Git history.
4. Run preflight and stage the backend against that snapshot. Startup performs schema initialization, ticket backfills, and checker-user migration, so staging must not point to the live database. Verify API, authentication, OTP/customer, and reservation behavior through an isolated environment with noop SMS and synthetic data. Keep the public HTTPS origin and same-origin cookie path unchanged for the eventual cutover.
5. Prepare and validate Nginx to serve the frontend and `/admin` statically while proxying `/api/` to the loopback backend, retaining the `/api/` prefix and forwarding `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`. Preserve TLS and the existing public hostname. Run `nginx -t` before loading the candidate configuration.
6. After staging passes, apply a bounded write freeze/maintenance window and drain in-flight requests to the old backend. Take a final consistent snapshot from the authoritative database, verify its integrity and counts, and use that final snapshot for the new backend. Both backends must not accept public writes to separate database copies. Start the new backend, verify its loopback health, then load the validated Nginx configuration and verify the public frontend, `/admin`, `/api/health`, and same-origin session behavior.
7. Keep the old service unit and checkout for rollback. If the old service occupies port 4000, stop it only after the final snapshot and successful staging; restarting it remains the immediate rollback path. Record the source commits, old/new database paths, configuration copies, and cutover time. Do not remove the old service until production health is confirmed.

Backend installation/start commands, after the candidate environment and database are prepared:

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

Rollback before the new backend accepts writes can restore the saved Nginx configuration and restart the original service. Once the new backend has accepted writes, first freeze/drain writes again and make a verified consistent snapshot of the current authoritative database. Preserve those new reservations, OTP/customer state, and check-in changes when returning to the old backend; restarting it against its stale pre-cutover copy would lose data. Verify schema compatibility on a copy before returning traffic. If compatibility cannot be established, keep maintenance active and repair or roll forward instead of replacing current data with an older backup.
