
-- 1. rounds: replace permissive public SELECT with completed-rounds-only
DROP POLICY IF EXISTS "Rounds readable by all (leaderboard)" ON public.rounds;
CREATE POLICY "Completed rounds readable by all"
  ON public.rounds FOR SELECT
  USING (status IN ('won', 'lost'));

-- 2. rounds: explicit deny for UPDATE/DELETE
CREATE POLICY "No one can update rounds"
  ON public.rounds AS RESTRICTIVE FOR UPDATE
  USING (false);
CREATE POLICY "No one can delete rounds"
  ON public.rounds AS RESTRICTIVE FOR DELETE
  USING (false);

-- 3. wallets: explicit deny for direct INSERT/UPDATE/DELETE
-- All balance mutations go through SECURITY DEFINER functions which bypass RLS.
CREATE POLICY "No direct wallet inserts"
  ON public.wallets AS RESTRICTIVE FOR INSERT
  WITH CHECK (false);
CREATE POLICY "No direct wallet updates"
  ON public.wallets AS RESTRICTIVE FOR UPDATE
  USING (false);
CREATE POLICY "No direct wallet deletes"
  ON public.wallets AS RESTRICTIVE FOR DELETE
  USING (false);

-- 4. Lock down SECURITY DEFINER function EXECUTE privileges
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.place_bet(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.settle_round(numeric, numeric, numeric) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_bet(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_round(numeric, numeric, numeric) TO authenticated;
