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
- No resign, draw offer, abort, rematch, rating update, spectator mode, or reconnect recovery workflow.
- A player who leaves a waiting room must return to the lobby; there is no cancellation endpoint yet.
- No automated browser or integration tests have been run. Validate the full flow against a migrated PostgreSQL database before enabling public access.
