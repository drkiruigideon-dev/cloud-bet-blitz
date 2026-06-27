-- ============================================
-- Cloud Bet Blitz
-- Migration 004 - Transaction Ledger
-- ============================================

BEGIN;

-- =====================================================
-- Transaction Types
-- =====================================================

CREATE TYPE public.transaction_type AS ENUM (
    'deposit',
    'withdrawal',
    'bet',
    'win',
    'bonus',
    'refund',
    'adjustment',
    'transfer'
);

CREATE TYPE public.transaction_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'cancelled'
);

CREATE TYPE public.balance_type AS ENUM (
    'main',
    'bonus',
    'locked',
    'withdrawable'
);

-- =====================================================
-- Transactions Table
-- =====================================================

CREATE TABLE public.transactions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    type public.transaction_type NOT NULL,

    balance_type public.balance_type NOT NULL,

    amount NUMERIC(14,2) NOT NULL,

    balance_before NUMERIC(14,2) NOT NULL,

    balance_after NUMERIC(14,2) NOT NULL,

    reference TEXT UNIQUE,

    description TEXT,

    status public.transaction_status
        NOT NULL DEFAULT 'completed',

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX transactions_user_idx
ON public.transactions(user_id);

CREATE INDEX transactions_created_idx
ON public.transactions(created_at DESC);

CREATE INDEX transactions_type_idx
ON public.transactions(type);

CREATE INDEX transactions_balance_type_idx
ON public.transactions(balance_type);

CREATE INDEX transactions_status_idx
ON public.transactions(status);

-- =====================================================
-- Permissions
-- =====================================================

GRANT SELECT ON public.transactions TO authenticated;

GRANT ALL ON public.transactions TO service_role;

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE public.transactions
ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions

CREATE POLICY "Users can read own transactions"

ON public.transactions

FOR SELECT

USING (
    auth.uid() = user_id
);

-- No direct inserts

CREATE POLICY "No direct inserts"

ON public.transactions

AS RESTRICTIVE

FOR INSERT

WITH CHECK (false);

-- No direct updates

CREATE POLICY "No direct updates"

ON public.transactions

AS RESTRICTIVE

FOR UPDATE

USING (false);

-- No direct deletes

CREATE POLICY "No direct deletes"

ON public.transactions

AS RESTRICTIVE

FOR DELETE

USING (false);

COMMIT;