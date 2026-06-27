-- ============================================
-- Cloud Bet Blitz
-- Migration 006 - Wallet Service Foundation
-- ============================================

BEGIN;

-- ============================================
-- Reference Sequences
-- ============================================

CREATE SEQUENCE IF NOT EXISTS public.event_reference_seq
START WITH 1
INCREMENT BY 1;

CREATE SEQUENCE IF NOT EXISTS public.transaction_reference_seq
START WITH 1
INCREMENT BY 1;

-- ============================================
-- Generate Event Reference
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_event_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    seq BIGINT;
BEGIN
    seq := nextval('public.event_reference_seq');

    RETURN format(
        'EVT-%s-%06s',
        EXTRACT(YEAR FROM now())::INT,
        seq
    );
END;
$$;

-- ============================================
-- Generate Transaction Reference
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_transaction_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    seq BIGINT;
BEGIN
    seq := nextval('public.transaction_reference_seq');

    RETURN format(
        'TXN-%s-%06s',
        EXTRACT(YEAR FROM now())::INT,
        seq
    );
END;
$$;

-- ============================================
-- Automatically generate references
-- ============================================

ALTER TABLE public.financial_events
ALTER COLUMN reference
SET DEFAULT public.generate_event_reference();

ALTER TABLE public.transactions
ALTER COLUMN reference
SET DEFAULT public.generate_transaction_reference();

-- ============================================
-- Security
-- ============================================

REVOKE EXECUTE ON FUNCTION public.generate_event_reference()
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.generate_transaction_reference()
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.generate_event_reference()
TO service_role;

GRANT EXECUTE ON FUNCTION public.generate_transaction_reference()
TO service_role;

COMMIT;