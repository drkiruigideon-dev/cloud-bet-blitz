# Document Information

Project: Cloud Bet Blitz
Version: 2.0
Status: Draft
Last Updated: June 2026
Owner: Gideon Kirui

# Cloud Bet Blitz Database

## Database Engine

PostgreSQL (Supabase)

---

# Current Tables

## auth.users

Managed by Supabase Authentication.

Purpose:

Stores user authentication data.

---

## profiles

Purpose:

Stores user profile information.

Current Columns

- id
- username
- display_name
- created_at

Future Columns

- phone_number
- country
- currency
- referral_code
- referred_by
- vip_level
- avatar
- is_verified
- updated_at
- last_login

---

## wallets

Purpose:

Stores player balances.

Current

- balance

Future

- main_balance
- bonus_balance
- locked_balance
- withdrawable_balance

---

## user_roles

Purpose:

Stores application roles.

Roles

- user
- admin

---

## rounds

Current Purpose

Stores player betting history.

Future

This table will be replaced by:

- game_rounds
- bets

---

# Planned Tables

- transactions
- deposits
- withdrawals
- bonuses
- referrals
- notifications
- game_rounds
- bets
- admin_logs

---

# Database Principles

- Every balance change creates a transaction.
- No direct wallet updates.
- Security through RLS.
- Authentication handled by Supabase.
- Business logic handled by PostgreSQL functions.