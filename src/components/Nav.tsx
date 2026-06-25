import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plane, LogOut, Wallet, Trophy, LayoutDashboard, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Nav() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    refetchInterval: 4000,
  });

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-fire-gradient shadow-glow group-hover:scale-105 transition-transform">
            <Plane className="h-5 w-5 -rotate-45 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Aviator<span className="text-gradient-gold">Demo</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {user && (
            <Link to="/play" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors">
              Play
            </Link>
          )}
          {user && (
            <Link to="/dashboard" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          )}
          <Link to="/leaderboard" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
            <Trophy className="h-4 w-4" /> Leaderboard
          </Link>
          {isAdmin && (
            <Link to="/admin" className="px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-gold-gradient px-3 py-1.5 shadow-gold-glow">
                <Wallet className="h-4 w-4 text-gold-foreground" />
                <span className="text-sm font-bold text-gold-foreground tabular-nums">
                  {Number(wallet?.balance ?? 0).toFixed(2)}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/auth" })} className="bg-fire-gradient text-primary-foreground hover:opacity-90 shadow-glow">
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
