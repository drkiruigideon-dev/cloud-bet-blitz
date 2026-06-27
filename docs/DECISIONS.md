# Architecture Decisions

## ADR-001

Decision

Use Supabase instead of building a custom backend.

Reason

Rapid development with enterprise-grade authentication and PostgreSQL.

---

## ADR-002

Decision

Keep Supabase Authentication.

Reason

Provides secure password hashing, JWT authentication, and Row Level Security integration.

---

## ADR-003

Decision

Use PostgreSQL functions for financial operations.

Reason

Prevents client-side wallet manipulation.

---

## ADR-004

Decision

Separate game rounds from player bets.

Reason

Supports real-time multiplayer gameplay.

---

## ADR-005

Decision

Maintain a transaction ledger for every balance change.

Reason

Provides complete financial auditability.
