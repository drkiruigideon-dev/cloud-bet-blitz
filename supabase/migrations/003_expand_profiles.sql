-- ==========================================
-- Cloud Bet Blitz v2
-- Migration 003 - Expand Profiles
-- ==========================================

-- Add phone number
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add country
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Kenya';

-- Add currency
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES';

-- Referral code
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Person who referred this user
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by UUID
REFERENCES public.profiles(id);

-- Verification status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Last login
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Updated timestamp
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Make phone unique
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
ON public.profiles(phone_number);

-- Automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_profiles_updated_at
ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();