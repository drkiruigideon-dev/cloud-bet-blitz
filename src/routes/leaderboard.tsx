import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Nav } from "@/components/Nav";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — AviatorDemo" },
      { name: "description", content: "Top winners and highest multipliers in the AviatorDemo simulation." },
    ],
  }),
  component: Leaderboard,
});

function Leaderboard() {
  const { data: topWinners } = useQuery({
    queryKey: ["leaderboard", "winners"],
    queryFn: async () => {
      const { data: rounds } = await supabase
        .from("rounds")
        .select("user_id, payout, bet")
        .eq("status", "won")
        .order("created_at", { ascending: false })
        .limit(500);
      const totals = new Map<string, number>();
      (rounds ?? []).forEach((r) => {
        totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (Number(r.payout) - Number(r.bet)));
      });
      const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
      const ids = top.map(([id]) => id);
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return top.map(([id, profit]) => ({ id, profit, profile: map.get(id) }));
    },
  });

  const { data: bigWins } = useQuery({
    queryKey: ["leaderboard", "big"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rounds")
        .select("id, user_id, bet, cashed_out_at, payout, created_at")
        .eq("status", "won")
        .order("cashed_out_at", { ascending: false })
        .limit(10);
      const ids = [...new Set((data ?? []).map((r) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, username").in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return (data ?? []).map((r) => ({ ...r, profile: map.get(r.user_id) }));
    },
  });

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-gold" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Top demo players and biggest multipliers</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <section className="glass rounded-2xl overflow-hidden">
            <h2 className="px-5 pt-5 pb-3 text-lg font-bold">Top profit (recent)</h2>
            <ol className="divide-y divide-border">
              {(topWinners ?? []).map((w, i) => (
                <li key={w.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${
                    i === 0 ? "bg-gold-gradient text-gold-foreground" :
                    i === 1 ? "bg-muted text-foreground" :
                    i === 2 ? "bg-fire-gradient text-primary-foreground" :
                    "bg-muted/50 text-muted-foreground"
                  }`}>{i + 1}</span>
                  <span className="flex-1 font-medium truncate">{w.profile?.display_name || w.profile?.username || "anon"}</span>
                  <span className={`tabular-nums font-bold ${w.profit >= 0 ? "text-win" : "text-loss"}`}>
                    {w.profit >= 0 ? "+" : ""}{w.profit.toFixed(2)}
                  </span>
                </li>
              ))}
              {(topWinners ?? []).length === 0 && (
                <li className="px-5 py-10 text-center text-muted-foreground">No winners yet — be the first.</li>
              )}
            </ol>
          </section>

          <section className="glass rounded-2xl overflow-hidden">
            <h2 className="px-5 pt-5 pb-3 text-lg font-bold flex items-center gap-2"><Medal className="h-5 w-5 text-gold" /> Biggest cash-outs</h2>
            <ol className="divide-y divide-border">
              {(bigWins ?? []).map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-2xl font-bold text-gradient-gold tabular-nums">{Number(r.cashed_out_at).toFixed(2)}x</span>
                  <span className="flex-1 truncate text-sm text-muted-foreground">{r.profile?.display_name || r.profile?.username || "anon"}</span>
                  <span className="text-win font-bold tabular-nums">+{Number(r.payout).toFixed(2)}</span>
                </li>
              ))}
              {(bigWins ?? []).length === 0 && (
                <li className="px-5 py-10 text-center text-muted-foreground">No big wins yet.</li>
              )}
            </ol>
          </section>
        </div>
      </main>
    </div>
  );
}
