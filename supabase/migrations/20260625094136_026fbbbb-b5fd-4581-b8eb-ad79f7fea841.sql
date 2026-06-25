
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Wallets
CREATE TABLE public.wallets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 1000.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all wallets" ON public.wallets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Rounds (each played round)
CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet NUMERIC(14,2) NOT NULL,
  crash_point NUMERIC(8,2) NOT NULL,
  cashed_out_at NUMERIC(8,2),
  payout NUMERIC(14,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('won','lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rounds_user_created_idx ON public.rounds(user_id, created_at DESC);
CREATE INDEX rounds_created_idx ON public.rounds(created_at DESC);
GRANT SELECT, INSERT ON public.rounds TO authenticated;
GRANT SELECT ON public.rounds TO anon;
GRANT ALL ON public.rounds TO service_role;
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rounds readable by all (leaderboard)" ON public.rounds FOR SELECT USING (true);
CREATE POLICY "Users insert own rounds" ON public.rounds FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + wallet + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atomic place-bet RPC: deducts wallet & returns crash point
CREATE OR REPLACE FUNCTION public.place_bet(_bet NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _bal NUMERIC;
  _crash NUMERIC;
  _r NUMERIC;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _bet <= 0 THEN RAISE EXCEPTION 'Invalid bet'; END IF;
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL THEN RAISE EXCEPTION 'No wallet'; END IF;
  IF _bal < _bet THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.wallets SET balance = balance - _bet, updated_at = now() WHERE user_id = _uid;
  -- Crash point: provably-fair-like with 3% instant crash, otherwise ~1/(1-r) capped
  _r := random();
  IF _r < 0.03 THEN
    _crash := 1.00;
  ELSE
    _crash := LEAST(round((0.99 / (1 - _r))::numeric, 2), 100.00);
    IF _crash < 1.01 THEN _crash := 1.01; END IF;
  END IF;
  RETURN _crash;
END;
$$;
GRANT EXECUTE ON FUNCTION public.place_bet(NUMERIC) TO authenticated;

-- Settle round: insert round, credit payout if won
CREATE OR REPLACE FUNCTION public.settle_round(_bet NUMERIC, _crash NUMERIC, _cashed NUMERIC)
RETURNS public.rounds LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid UUID := auth.uid();
  _payout NUMERIC := 0;
  _status TEXT;
  _row public.rounds;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _cashed IS NOT NULL AND _cashed < _crash AND _cashed >= 1 THEN
    _payout := round((_bet * _cashed)::numeric, 2);
    _status := 'won';
    UPDATE public.wallets SET balance = balance + _payout, updated_at = now() WHERE user_id = _uid;
  ELSE
    _status := 'lost';
    _cashed := NULL;
  END IF;
  INSERT INTO public.rounds(user_id, bet, crash_point, cashed_out_at, payout, status)
  VALUES (_uid, _bet, _crash, _cashed, _payout, _status)
  RETURNING * INTO _row;
  RETURN _row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.settle_round(NUMERIC, NUMERIC, NUMERIC) TO authenticated;
