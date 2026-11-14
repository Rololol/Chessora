# Chessora roadmap

## Phase 0 — Foundation
- [x] Create repository and workspace structure
- [x] Establish product identity and responsive landing page
- [ ] Add CI, formatting, linting, and type-check gates
- [ ] Add architecture decision records and threat model

## Phase 1 — Playable MVP
- [x] Account registration and login foundation (Better Auth + Prisma; production hardening pending)
- [x] Basic player profiles (username, bio, country code, initial rating fields)
- [x] Local interactive chessboard with legal move validation
- [ ] Server-authoritative game sessions and clocks
- [ ] Realtime matchmaking for Bullet, Blitz, and Rapid
- [ ] Resign, draw offers, disconnect recovery, and rematch
- [ ] PGN export and game history
- [ ] Glicko-2 ratings with tests

## Phase 2 — Analysis and learning
- [ ] Stockfish analysis workers
- [ ] Move classifications and position review
- [ ] Opening explorer and personal repertoire
- [ ] Training puzzles and progress tracking
- [ ] AI coach grounded in engine output and position context

## Phase 3 — Competition and community
- [ ] Arena and Swiss tournaments
- [ ] Clubs, friends, chat, and activity feed
- [ ] Moderation queues and reporting
- [ ] Fair-play signals and human review workflows

## Phase 4 — Scale and premium
- [ ] Premium subscriptions and entitlements
- [ ] Dedicated realtime capacity and analysis queue scaling
- [ ] Observability, SLOs, backups, and disaster recovery
- [ ] Accessibility and localization audits

## Release rule
A feature is complete only when its core behavior works end-to-end, has automated coverage for critical paths, and has appropriate authorization, abuse prevention, and failure handling. A visual mockup is not a completed feature.
