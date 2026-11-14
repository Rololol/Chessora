# Game API

The first authenticated game API is implemented in the Next.js app routes. It is a persistence and rules-validation foundation, not yet a complete online-play experience.

## Endpoints

All endpoints require a valid Better Auth session.

- `GET /api/games` — list the signed-in player's latest 30 games.
- `POST /api/games` — create an open game. JSON body: `{"timeControl":"5+0"}`. Supported controls: `1+0`, `3+0`, `3+2`, `5+0`, `5+3`, `10+0`, `15+10`.
- `POST /api/games/:id/join` — atomically join a waiting game as Black. The creator is White.
- `GET /api/games/:id` — retrieve a game and ordered move history. Only its players can access it.
- `POST /api/games/:id/moves` — submit a move as JSON, for example `{"from":"e2","to":"e4"}` or `{"from":"e7","to":"e8","promotion":"q"}`.

## Rules and clock behavior

The server loads the canonical FEN with chess.js and validates turn ownership and legal moves. It calculates elapsed time from the persisted server timestamp, applies the increment after a legal move, and records FEN, PGN, SAN, and remaining clocks. Checkmate and chess.js draw conditions complete the game. Game updates use a serializable transaction and an optimistic `updatedAt` condition to reject concurrent submissions.

## Current limitations

- There is no lobby UI, matchmaking queue, WebSocket transport, or automatic client polling yet.
- Joining a game starts it immediately; the first move belongs to White.
- Timeout currently awards the game to the opponent without a mating-material adjudication.
- Resignation, draw offers, abort rules, disconnect handling, rematches, rating updates, and anti-cheat controls are not implemented.
- The endpoints have not yet been exercised against a live PostgreSQL database or covered by automated tests.
- Deployments must apply the Prisma schema before using these routes.

Do not expose these endpoints as production-rated play until concurrency, timeout edge cases, abuse controls, and integration tests have been completed.
