# Cloud Bet Blitz Architecture

## Technology Stack

Frontend

- React
- TanStack Start
- TypeScript
- Tailwind CSS

Backend

- Supabase
- PostgreSQL
- Row Level Security
- Realtime

Authentication

- Supabase Auth

Hosting

- Vercel (planned)

Payments

- M-Pesa API (planned)

---

## High-Level Architecture

                Browser
                    │
                    ▼
            React Application
                    │
                    ▼
             TanStack Start
                    │
                    ▼
               Supabase API
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
 Authentication             PostgreSQL
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
             Profiles         Wallets        Transactions
                                  │
                 ┌────────────────┴──────────────┐
                 ▼                               ▼
            Deposits                     Withdrawals

                     Game Engine
                           │
                    ┌──────┴──────┐
                    ▼             ▼
               Game Rounds       Bets
