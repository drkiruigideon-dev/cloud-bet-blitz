import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, History } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AviatorDemo" },
      { name: "description", content: "Your wallet, stats, and round history." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data: wallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("balance").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: rounds } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rounds")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const stats = (rounds ?? []).reduce(
    (acc, r) => {
      acc.total++;
      acc.wagered += Number(r.bet);
      acc.payout += Number(r.payout);
      if (r.status === "won") acc.wins++;
      return acc;
    },
    { total: 0, wins: 0, wagered: 0, payout: 0 },
  );
  const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;
  const net = stats.payout - stats.wagered;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Your dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Wallet} label="Balance" value={Number(wallet?.balance ?? 0).toFixed(2)} accent="gold" />
        <StatCard icon={History} label="Rounds played" value={String(stats.total)} />
        <StatCard icon={TrendingUp} label="Win rate" value={`${winRate}%`} />
        <StatCard icon={net >= 0 ? TrendingUp : TrendingDown} label="Net" value={`${net >= 0 ? "+" : ""}${net.toFixed(2)}`} accent={net >= 0 ? "win" : "loss"} />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <h2 className="px-5 pt-5 pb-3 text-lg font-bold">Recent rounds</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-2">When</th>
                <th className="text-right px-3 py-2">Bet</th>
                <th className="text-right px-3 py-2">Crash</th>
                <th className="text-right px-3 py-2">Cashed</th>
                <th className="text-right px-5 py-2">Result</th>
              </tr>
            </thead>
            <tbody>
              {(rounds ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-5 py-3 text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{Number(r.bet).toFixed(2)}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{Number(r.crash_point).toFixed(2)}x</td>
                  <td className="px-3 py-3 text-right tabular-nums">{r.cashed_out_at ? `${Number(r.cashed_out_at).toFixed(2)}x` : "—"}</td>
                  <td className={`px-5 py-3 text-right font-bold tabular-nums ${r.status === "won" ? "text-win" : "text-loss"}`}>
                    {r.status === "won" ? `+${Number(r.payout).toFixed(2)}` : `-${Number(r.bet).toFixed(2)}`}
                  </td>
                </tr>
              ))}
              {(rounds ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No rounds yet — go play!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: "gold" | "win" | "loss" }) {
  const accentCls = accent === "gold" ? "text-gold" : accent === "win" ? "text-win" : accent === "loss" ? "text-loss" : "text-foreground";
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Icon className="h-3.5 w-3.5" />{label}</div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${accentCls}`}>{value}</div>
    </div>
  );
}
