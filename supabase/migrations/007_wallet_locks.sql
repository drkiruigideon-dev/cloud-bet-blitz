-- ============================================
-- Cloud Bet Blitz
-- Migration 007 - Wallet Locks
-- ============================================

BEGIN;

-- ============================================
-- Lock Status Enum
-- ============================================

CREATE TYPE public.wallet_lock_status AS ENUM (
    'active',
    'released',
    'cancelled'
);

-- ============================================
-- Wallet Locks Table
-- ============================================

CREATE TABLE public.wallet_locks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    financial_event_id UUID NOT NULL
        REFERENCES public.financial_events(id)
        ON DELETE RESTRICT,

    amount NUMERIC(14,2) NOT NULL
        CHECK (amount > 0),

    reason TEXT NOT NULL,

    status public.wallet_lock_status
        NOT NULL DEFAULT 'active',

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    released_at TIMESTAMPTZ
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX wallet_locks_user_idx
ON public.wallet_locks(user_id);

CREATE INDEX wallet_locks_status_idx
ON public.wallet_locks(status);

CREATE INDEX wallet_locks_event_idx
ON public.wallet_locks(financial_event_id);

CREATE INDEX wallet_locks_created_idx
ON public.wallet_locks(created_at DESC);

-- ============================================
-- Permissions
-- ============================================

GRANT SELECT ON public.wallet_locks TO authenticated;

GRANT ALL ON public.wallet_locks TO service_role;

-- ============================================
-- Enable RLS
-- ============================================

ALTER TABLE public.wallet_locks
ENABLE ROW LEVEL SECURITY;

-- Users can only view their own locks

CREATE POLICY "Users can read own wallet locks"

ON public.wallet_locks

FOR SELECT

USING (
    auth.uid() = user_id
);

-- No direct inserts

CREATE POLICY "No direct wallet lock inserts"

ON public.wallet_locks

AS RESTRICTIVE

FOR INSERT

WITH CHECK (false);

-- No direct updates

CREATE POLICY "No direct wallet lock updates"

ON public.wallet_locks

AS RESTRICTIVE

FOR UPDATE

USING (false);

-- No direct deletes

CREATE POLICY "No direct wallet lock deletes"

ON public.wallet_locks

AS RESTRICTIVE

FOR DELETE

USING (false);

COMMIT;