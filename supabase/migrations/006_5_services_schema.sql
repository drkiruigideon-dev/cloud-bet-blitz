-- ============================================
-- Cloud Bet Blitz
-- Migration 006.5 - Services Schema
-- ============================================

BEGIN;

-- ============================================
-- Create Services Schema
-- ============================================

CREATE SCHEMA IF NOT EXISTS services;

-- ============================================
-- Restrict Access
-- ============================================

REVOKE ALL ON SCHEMA services FROM PUBLIC;
REVOKE ALL ON SCHEMA services FROM anon;
REVOKE ALL ON SCHEMA services FROM authenticated;

GRANT USAGE ON SCHEMA services TO service_role;

COMMIT;