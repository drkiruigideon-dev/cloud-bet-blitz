-- ============================================
-- Cloud Bet Blitz
-- Migration 008A.1 - Wallet Engine Foundation
-- ============================================

BEGIN;

-- ============================================
-- Wallet Operations
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'wallet_operation'
    ) THEN
        CREATE TYPE public.wallet_operation AS ENUM (
            'credit',
            'debit',
            'lock',
            'unlock'
        );
    END IF;
END $$;

-- ============================================
-- Wallet Operation Result
-- ============================================

DROP TYPE IF EXISTS public.wallet_operation_result CASCADE;

CREATE TYPE public.wallet_operation_result AS (

    financial_event_id UUID,

    transaction_id UUID,

    balance_before NUMERIC(14,2),

    balance_after NUMERIC(14,2)

);

-- ============================================
-- Internal Wallet Engine
-- ============================================

CREATE OR REPLACE FUNCTION public._execute_wallet_operation(

    p_user_id UUID,

    p_operation public.wallet_operation,

    p_balance_type public.balance_type,

    p_amount NUMERIC,

    p_event_type public.financial_event_type,

    p_description TEXT,

    p_metadata JSONB DEFAULT '{}'::jsonb

)

RETURNS public.wallet_operation_result

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS $$

DECLARE

    result public.wallet_operation_result;

BEGIN

    RAISE NOTICE
    '_execute_wallet_operation() not implemented yet';

    RETURN result;

END;

$$;

REVOKE EXECUTE
ON FUNCTION public._execute_wallet_operation
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public._execute_wallet_operation
TO service_role;

COMMIT;