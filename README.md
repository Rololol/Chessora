# Chessora

A modern online chess platform built for competitive play, learning, and community.

## Product vision

Chessora brings together live multiplayer chess, accurate ratings, engine analysis, AI-assisted coaching, training, tournaments, and player communities in one responsive platform.

## Planned stack

- **Web:** Next.js, React, TypeScript, Tailwind CSS
- **API:** Node.js, NestJS, TypeScript
- **Data:** PostgreSQL, Prisma, Redis
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

The repository is being bootstrapped. See [docs/ROADMAP.md](docs/ROADMAP.md) for the staged delivery plan.

## Local development

Prerequisites: Node.js 22+ and pnpm 9+.

```bash
pnpm install
pnpm dev
```

Individual apps and packages will become runnable as their initial implementation lands.

## License

TBD. A license will be selected before public redistribution of the source code.
