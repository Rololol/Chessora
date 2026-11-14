# Chessora

A modern online chess platform built for competitive play, learning, and community.

## Product vision

Chessora brings together live multiplayer chess, accurate ratings, engine analysis, AI-assisted coaching, training, tournaments, and player communities in one responsive platform.

## Planned stack

- **Web:** Next.js, React, TypeScript, Tailwind CSS
- **API:** Node.js, NestJS, TypeScript
- **Data:** PostgreSQL, Prisma, Redis
- **Authentication:** Better Auth with database-backed sessions
- **Realtime:** WebSockets / Socket.IO
- **Chess rules:** server-authoritative rules engine
- **Analysis:** Stockfish (WASM initially; worker-based analysis later)
- **Tooling:** pnpm workspaces, Turborepo, Vitest, Playwright, Docker

## Architecture principles

1. The server is authoritative for legal moves, clocks, game results, and rating changes.
2. Chess rules and rating calculations live in reusable packages, not UI components.
3. Start with a modular monolith; split realtime and analysis workloads when operationally justified.
4. Never present placeholder flows as working product features.
5. Build privacy, security, accessibility, and observability into the foundation.

## Repository layout

```text
apps/
  web/                 Next.js application
  api/                 NestJS HTTP API
  realtime/            WebSocket gateway
packages/
  chess-core/          Rules, FEN, PGN, move validation
  rating/              Glicko-2 rating system
  shared/              Shared types and schemas
  ui/                   Shared UI components
  database/             Prisma schema and database client
services/
  analysis/             Stockfish analysis workers
  matchmaking/          Matchmaking orchestration
  tournaments/          Tournament workflows
infra/
  docker/               Local infrastructure
 docs/                  Architecture and product decisions
```

## Development status

The repository includes a responsive landing page, a local legal-move chessboard, Better Auth email/password authentication, editable player profiles, a basic open-game lobby with polling-based two-player rooms, and PostgreSQL models for persistent games and moves. Authentication and multiplayer are not production-ready: database setup, server-authoritative game APIs, realtime transport, security hardening, and automated tests are still pending. See [docs/ROADMAP.md](docs/ROADMAP.md) for the staged delivery plan.

## Local development

Prerequisites: Node.js 22+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Configure `.env` using `.env.example`, then run `pnpm db:generate` and `pnpm db:push` against a development PostgreSQL database before starting the web app. The database push command is for local development only; production should use reviewed migrations.

## License

TBD. A license will be selected before public redistribution of the source code.
