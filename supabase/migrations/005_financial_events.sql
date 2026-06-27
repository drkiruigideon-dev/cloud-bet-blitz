-- ============================================
-- Cloud Bet Blitz
-- Migration 005 - Financial Events
-- ============================================

BEGIN;

-- ============================================
-- Event Types
-- ============================================

CREATE TYPE public.financial_event_type AS ENUM (
    'deposit',
    'withdrawal',
    'bet',
    'cashout',
    'win',
    'refund',
    'bonus',
    'adjustment',
    'transfer'
);

-- ============================================
-- Event Status
-- ============================================

CREATE TYPE public.financial_event_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
);

-- ============================================
-- Financial Events Table
-- ============================================

CREATE TABLE public.financial_events (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    event_type public.financial_event_type NOT NULL,

    status public.financial_event_status
        NOT NULL DEFAULT 'pending',

    reference TEXT UNIQUE,

    description TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    completed_at TIMESTAMPTZ
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX financial_events_user_idx
ON public.financial_events(user_id);

CREATE INDEX financial_events_status_idx
ON public.financial_events(status);

CREATE INDEX financial_events_type_idx
ON public.financial_events(event_type);

CREATE INDEX financial_events_created_idx
ON public.financial_events(created_at DESC);

-- ============================================
-- Permissions
-- ============================================

GRANT SELECT ON public.financial_events TO authenticated;

GRANT ALL ON public.financial_events TO service_role;

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE public.financial_events
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own financial events"
ON public.financial_events
FOR SELECT
USING (
    auth.uid() = user_id
);

CREATE POLICY "No direct inserts"
ON public.financial_events
AS RESTRICTIVE
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct updates"
ON public.financial_events
AS RESTRICTIVE
FOR UPDATE
USING (false);

CREATE POLICY "No direct deletes"
ON public.financial_events
AS RESTRICTIVE
FOR DELETE
USING (false);

COMMIT;