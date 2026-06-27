-- ============================================
-- Cloud Bet Blitz
-- Migration 003 - Wallet V2
-- ============================================

BEGIN;

-- Rename existing balance column
ALTER TABLE public.wallets
RENAME COLUMN balance TO main_balance;

-- Add new balance columns
ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC(14,2)
NOT NULL DEFAULT 0.00;

ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS locked_balance NUMERIC(14,2)
NOT NULL DEFAULT 0.00;

ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS withdrawable_balance NUMERIC(14,2)
NOT NULL DEFAULT 0.00;

-- Existing money becomes withdrawable
UPDATE public.wallets
SET withdrawable_balance = main_balance;

-- Ensure balances can never go negative
ALTER TABLE public.wallets
ADD CONSTRAINT wallets_main_balance_check
CHECK (main_balance >= 0);

ALTER TABLE public.wallets
ADD CONSTRAINT wallets_bonus_balance_check
CHECK (bonus_balance >= 0);

ALTER TABLE public.wallets
ADD CONSTRAINT wallets_locked_balance_check
CHECK (locked_balance >= 0);

ALTER TABLE public.wallets
ADD CONSTRAINT wallets_withdrawable_balance_check
CHECK (withdrawable_balance >= 0);

COMMIT;