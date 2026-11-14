# Multiplayer lobby and game room

The web application now has a basic lobby at `/multiplayer` and game rooms at `/games/:id`.

## Flow

1. A signed-in player creates a waiting game and chooses a supported time control.
2. Other signed-in players see waiting challenges in the lobby and can join as Black.
3. The creator is White and the joiner is Black. Joining atomically claims the open seat and starts the server clock.
4. The game room polls the authorized game endpoint every two seconds, displays the canonical FEN, move list, and remaining clocks, and submits moves to the server-authoritative move endpoint.

The lobby refreshes its list every five seconds. This polling implementation is an interim transport; it is not a WebSocket service and should be replaced when realtime infrastructure is introduced.

## Known limitations

- No push notifications or low-latency realtime delivery; polling can add up to two seconds of delay.
- Clock display is client-estimated between server snapshots. The server remains authoritative when a move is submitted.
- Resignation, draw offers (offer/accept/decline), and creator cancellation of waiting games are now implemented as authenticated game actions.
- Game history and authenticated PGN download are now available.
- No rematch, rating update, spectator mode, disconnect recovery, or reconnect workflow.
- Draw offers are cleared when either player makes a move.
- No automated browser or integration tests have been run. Validate the full flow against a migrated PostgreSQL database before enabling public access.

## Game actions

`POST /api/games/:id/actions` accepts one of `resign`, `offer_draw`, `accept_draw`, `decline_draw`, or `cancel`. Only a participant may act. The creator may cancel a waiting game; either participant may resign; draw offers are stored on the game and can only be accepted or declined by the opponent. Active-game actions calculate elapsed server time before applying the action. Concurrent changes are rejected using an optimistic update condition inside a serializable transaction.

The Prisma schema now includes nullable `drawOfferBy`; apply the schema change to the development database before testing these actions.

## Game history and PGN export

The `/history` page lists the signed-in player's recent games. `GET /api/games/:id/pgn` returns a downloadable PGN with event, site, date, player, time-control, and result tags. Only one of the game's participants may download its record. The game room also links directly to its PGN file.
