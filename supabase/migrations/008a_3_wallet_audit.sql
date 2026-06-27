-- ============================================================
-- Cloud Bet Blitz
-- Migration 008A.3 - Wallet Audit Services
-- ============================================================

BEGIN;

-- ============================================================
-- INTERNAL SERVICE:
-- Create Financial Event
-- ============================================================

CREATE OR REPLACE FUNCTION services._create_financial_event(

    p_user_id UUID,
    p_event_type public.financial_event_type,
    p_amount NUMERIC(14,2),
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb

)

RETURNS UUID

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public, services

AS $$

DECLARE

    v_event_id UUID;

BEGIN

    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Financial event amount must be greater than zero.';
    END IF;

    INSERT INTO public.financial_events (

        user_id,
        event_type,
        amount,
        description,
        metadata

    )

    VALUES (

        p_user_id,
        p_event_type,
        p_amount,
        p_description,
        p_metadata

    )

    RETURNING id
    INTO v_event_id;

    RETURN v_event_id;

END;

$$;

REVOKE EXECUTE
ON FUNCTION services._create_financial_event
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION services._create_financial_event
TO service_role;

-- ============================================================
-- INTERNAL SERVICE:
-- Create Transaction
-- ============================================================

CREATE OR REPLACE FUNCTION services._create_transaction(

    p_wallet_id UUID,
    p_financial_event_id UUID,
    p_balance_type public.balance_type,
    p_transaction_type public.transaction_type,
    p_amount NUMERIC(14,2),
    p_balance_before NUMERIC(14,2),
    p_balance_after NUMERIC(14,2)

)

RETURNS UUID

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public, services

AS $$

DECLARE

    v_transaction_id UUID;

BEGIN

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be greater than zero.';
    END IF;

    INSERT INTO public.transactions (

        wallet_id,
        financial_event_id,
        balance_type,
        transaction_type,
        amount,
        balance_before,
        balance_after

    )

    VALUES (

        p_wallet_id,
        p_financial_event_id,
        p_balance_type,
        p_transaction_type,
        p_amount,
        p_balance_before,
        p_balance_after

    )

    RETURNING id
    INTO v_transaction_id;

    RETURN v_transaction_id;

END;

$$;

REVOKE EXECUTE
ON FUNCTION services._create_transaction
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION services._create_transaction
TO service_role;

COMMIT;