
# Backend scripts

`npm run dev` starts the local API on `127.0.0.1:4000`.
`npm start` starts the API with the configured environment.
`npm run preflight:prod` verifies production environment and storage configuration.

Run the integration checks through the `test:*` scripts in `package.json`.
Core and backup test runners use isolated databases; never point individual test scripts at the production database.

Frontend and Admin React/Vite builds run on `refactor/frontend-split`, not in this backend branch.
