# Cloud Bet Blitz API

## Document Information

**Project:** Cloud Bet Blitz  
**Version:** 2.0

---

# Current RPC Functions

## place_bet()

Purpose

Deduct player balance and generate a crash point.

Input

- bet_amount

Output

- crash_point

---

## settle_round()

Purpose

Calculate winnings and update wallet.

Input

- bet_amount
- crash_point
- cashout_multiplier

Output

- Round Result

---

## has_role()

Purpose

Determine whether a user has a specific role.

---

# Planned APIs

deposit()

withdraw()

cashout()

create_round()

join_round()

generate_referral()

claim_bonus()