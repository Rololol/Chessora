# Architecture

## Initial shape

Chessora starts as a TypeScript monorepo with a Next.js web client and independently deployable backend services added as product capabilities mature. Keep the initial backend a modular monolith unless realtime or analysis load justifies a separate process.

## Proposed workspace

- `apps/web`: Next.js user-facing application
- `apps/api`: NestJS REST API and application modules
- `apps/realtime`: Socket.IO gateway for live game events
- `packages/chess-core`: FEN/PGN, legal move generation, game state, clocks
- `packages/rating`: Glicko-2 implementation
- `packages/shared`: shared contracts, validation schemas, constants
- `packages/ui`: reusable accessible UI components
- `packages/database`: Prisma schema and database access
- `services/analysis`: queued Stockfish analysis
- `services/matchmaking`: pairing and queue orchestration
- `services/tournaments`: tournament lifecycle and pairings

## Non-negotiable invariants

1. The server validates every move against the canonical game state.
2. Clients never authoritatively set clocks, outcomes, ratings, or tournament standings.
3. Realtime commands are authenticated, authorized, rate-limited, and idempotent where needed.
4. Rating changes are recorded as auditable transactions after a confirmed result.
5. Analysis jobs are isolated from latency-sensitive game traffic.
6. Secrets are never committed; production data is never used in local development.

## Data and infrastructure

PostgreSQL is the source of truth. Redis is used for ephemeral presence, matchmaking queues, rate limits, and realtime coordination—not as the only record of a game result. Use migrations, backups, structured logs, metrics, and tracing from the beginning.

## Privacy and security

Collect only necessary personal data, define retention periods, support account export/deletion workflows, and document processing purposes before launch. Apply least privilege, secure session handling, CSRF protections where relevant, input validation, output encoding, dependency scanning, and regular backup restoration tests.
