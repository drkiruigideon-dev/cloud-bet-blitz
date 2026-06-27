-- ============================================
-- Cloud Bet Blitz
-- Migration 008A.2 - Wallet Validation
-- ============================================

BEGIN;

-- ============================================
-- Wallet Validation Result
-- ============================================

DROP TYPE IF EXISTS services.wallet_validation_result CASCADE;

CREATE TYPE services.wallet_validation_result AS (

    user_id UUID,

    balance_before NUMERIC(14,2),

    balance_type public.balance_type

);

-- ============================================
-- Wallet Validation Function
-- ============================================

CREATE OR REPLACE FUNCTION services._validate_wallet(

    p_user_id UUID,

    p_balance_type public.balance_type,

    p_amount NUMERIC,

    p_operation public.wallet_operation

)

RETURNS services.wallet_validation_result

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public, services

AS $$

DECLARE

    v_wallet public.wallets%ROWTYPE;

    v_balance NUMERIC(14,2);

    result services.wallet_validation_result;

BEGIN

    ---------------------------------------------------
    -- Validate Amount
    ---------------------------------------------------

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero.';
    END IF;

    ---------------------------------------------------
    -- Lock Wallet Row
    ---------------------------------------------------

    SELECT *
    INTO v_wallet
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found.';
    END IF;

    ---------------------------------------------------
    -- Determine Balance
    ---------------------------------------------------

    CASE p_balance_type

        WHEN 'main' THEN
            v_balance := v_wallet.main_balance;

        WHEN 'bonus' THEN
            v_balance := v_wallet.bonus_balance;

        WHEN 'locked' THEN
            v_balance := v_wallet.locked_balance;

        WHEN 'withdrawable' THEN
            v_balance := v_wallet.withdrawable_balance;

        ELSE
            RAISE EXCEPTION 'Unknown balance type.';
    END CASE;

    ---------------------------------------------------
    -- Validate Available Balance
    ---------------------------------------------------

    IF p_operation IN ('debit', 'lock') THEN

        IF v_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient balance.';
        END IF;

    END IF;

    ---------------------------------------------------
    -- Return Validation Result
    ---------------------------------------------------

    result.user_id := p_user_id;

    result.balance_before := v_balance;

    result.balance_type := p_balance_type;

    RETURN result;

END;

$$;

-- ============================================
-- Security
-- ============================================

REVOKE EXECUTE
ON FUNCTION services._validate_wallet
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION services._validate_wallet
TO service_role;

COMMIT;