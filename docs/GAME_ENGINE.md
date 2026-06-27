# Cloud Bet Blitz Game Engine

## Document Information

**Project:** Cloud Bet Blitz  
**Version:** 2.0  
**Status:** Draft

---

# Overview

Cloud Bet Blitz uses a multiplayer crash game where all players participate in the same game round.

---

# Round Lifecycle

Waiting

↓

Accept Bets

↓

Round Starts

↓

Multiplier Increases

↓

Players Cash Out

↓

Crash

↓

Results Saved

↓

Next Round

---

# Database Design

game_rounds

- id
- round_number
- crash_point
- server_seed
- client_seed
- hash
- status
- started_at
- ended_at

bets

- id
- round_id
- user_id
- bet_amount
- auto_cashout
- cashout_multiplier
- payout
- status
- created_at

---

# Crash Generation

Each round has a single crash multiplier shared by all players.

Example

Round #1050

Crash = 2.84x

Player A → Cashed at 1.70x

Player B → Cashed at 2.10x

Player C → Lost

---

# Future Improvements

- Provably Fair Algorithm
- Live Spectator Mode
- Auto Bet
- Auto Cash Out
- Round Replay
- Live Statistics