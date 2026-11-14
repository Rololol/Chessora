# Authentication and player identity

## Current implementation

The web app uses Better Auth with its Prisma adapter and PostgreSQL. Email/password registration and sign-in are exposed through the catch-all route at `/api/auth/[...all]`. Passwords are handled by Better Auth; application code must never store or log plaintext passwords.

The Prisma schema includes the Better Auth user/session/account/verification models and a separate PlayerProfile. Player profile ratings are initialized to 1200 for display scaffolding only; rating changes must later be made by the server's rating service, never by a client request.

## Required environment

- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: high-entropy random secret (at least 32 bytes)
- `BETTER_AUTH_URL`: canonical server URL, e.g. `http://localhost:3000`
- `NEXT_PUBLIC_APP_URL`: browser-visible application URL

## Local setup

1. Install dependencies from the repository root.
2. Copy the root `.env.example` to `.env` and set the required values.
3. Run `pnpm --filter @chessora/database db:generate`.
4. Run `pnpm --filter @chessora/database db:push` against a disposable development database.
5. Start the web app with `pnpm --filter @chessora/web dev`.

For production, use reviewed Prisma migrations rather than `db push`. Configure HTTPS, trusted origins, rate limiting, email verification, password reset delivery, account recovery, and monitoring before public launch. Do not treat the current email/password flow as production-ready until those controls are enabled and tested.
