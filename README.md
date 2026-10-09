# Beyragh Mandegar Backend

Standalone API/backend for Beyragh Mandegar.

## Stack

- Node.js 20.19+
- Express
- Sequelize
- PostgreSQL
- OTP / SMS
- Admin, customer and ticket-checker APIs

This backend branch (`refactor/backend-split`) of `amirsheva/BeyragheMandegar` does not build or serve React/Vite assets. The frontend and `/admin` static builds belong to the frontend branch and are served by Nginx.

## Development

```bash
docker compose up -d db
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

## Backups

`npm run backup:db` writes a `pg_dump` custom-format archive to `BACKUP_DIR` and verifies it with `pg_restore --list`. `npm run test:backup` runs the full backup/restore pipeline against a throwaway `<DB_NAME>_backup_test` database; the DB user needs `CREATEDB`.

The PostgreSQL client tools (`pg_dump`, `pg_restore`) must be installed and match the server's major version. Override their paths with `PG_DUMP_BIN` / `PG_RESTORE_BIN`, for example a wrapper script around `docker exec -i -e PGPASSWORD beyragh-postgres pg_dump -h localhost "$@"`.
