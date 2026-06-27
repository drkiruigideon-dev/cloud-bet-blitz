
-- Private schema for SECURITY DEFINER helpers
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- has_role moved to private
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- place_bet moved to private
CREATE OR REPLACE FUNCTION private.place_bet(_bet numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
REVOKE ALL ON FUNCTION private.place_bet(numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.place_bet(numeric) TO authenticated, service_role;

-- settle_round moved to private
CREATE OR REPLACE FUNCTION private.settle_round(_bet numeric, _crash numeric, _cashed numeric)
RETURNS public.rounds LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
REVOKE ALL ON FUNCTION private.settle_round(numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.settle_round(numeric, numeric, numeric) TO authenticated, service_role;

-- handle_new_user moved to private; re-point auth trigger
CREATE OR REPLACE FUNCTION private.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
REVOKE ALL ON FUNCTION private.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();

-- Re-point any policy that referenced public.has_role
DROP POLICY IF EXISTS "Admins can read all wallets" ON public.wallets;
CREATE POLICY "Admins can read all wallets" ON public.wallets
FOR SELECT USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Drop old public SECURITY DEFINER functions
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.place_bet(numeric);
DROP FUNCTION IF EXISTS public.settle_round(numeric, numeric, numeric);

-- Public SECURITY INVOKER wrappers that the app continues to call
CREATE FUNCTION public.place_bet(_bet numeric)
RETURNS numeric LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT private.place_bet(_bet) $$;
REVOKE ALL ON FUNCTION public.place_bet(numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bet(numeric) TO authenticated;

CREATE FUNCTION public.settle_round(_bet numeric, _crash numeric, _cashed numeric)
RETURNS public.rounds LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT private.settle_round(_bet, _crash, _cashed) $$;
REVOKE ALL ON FUNCTION public.settle_round(numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.settle_round(numeric, numeric, numeric) TO authenticated;

-- Restrict reads on rounds to the owner (admins still covered by their own policy below)
DROP POLICY IF EXISTS "Completed rounds readable by all" ON public.rounds;
CREATE POLICY "Users can read own rounds" ON public.rounds
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all rounds" ON public.rounds
FOR SELECT USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Safe leaderboard helpers: never expose crash_point or per-round detail beyond payouts/multipliers
CREATE OR REPLACE FUNCTION private.leaderboard_top_profit()
RETURNS TABLE(user_id uuid, display_name text, username text, profit numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  WITH recent AS (
    SELECT user_id, payout, bet
    FROM public.rounds
    WHERE status = 'won'
    ORDER BY created_at DESC
    LIMIT 500
  ), agg AS (
    SELECT user_id, SUM(payout - bet) AS profit
    FROM recent GROUP BY user_id
    ORDER BY profit DESC
    LIMIT 20
  )
  SELECT a.user_id, p.display_name, p.username, a.profit
  FROM agg a LEFT JOIN public.profiles p ON p.id = a.user_id
  ORDER BY a.profit DESC;
$$;
REVOKE ALL ON FUNCTION private.leaderboard_top_profit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.leaderboard_top_profit() TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION private.leaderboard_big_wins()
RETURNS TABLE(id uuid, display_name text, username text, cashed_out_at numeric, payout numeric, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.id, p.display_name, p.username, r.cashed_out_at, r.payout, r.created_at
  FROM public.rounds r LEFT JOIN public.profiles p ON p.id = r.user_id
  WHERE r.status = 'won'
  ORDER BY r.cashed_out_at DESC NULLS LAST
  LIMIT 10;
$$;
REVOKE ALL ON FUNCTION private.leaderboard_big_wins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.leaderboard_big_wins() TO authenticated, anon, service_role;

CREATE FUNCTION public.leaderboard_top_profit()
RETURNS TABLE(user_id uuid, display_name text, username text, profit numeric)
LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT * FROM private.leaderboard_top_profit() $$;
GRANT EXECUTE ON FUNCTION public.leaderboard_top_profit() TO authenticated, anon;

CREATE FUNCTION public.leaderboard_big_wins()
RETURNS TABLE(id uuid, display_name text, username text, cashed_out_at numeric, payout numeric, created_at timestamptz)
LANGUAGE sql SECURITY INVOKER SET search_path = public
AS $$ SELECT * FROM private.leaderboard_big_wins() $$;
GRANT EXECUTE ON FUNCTION public.leaderboard_big_wins() TO authenticated, anon;
