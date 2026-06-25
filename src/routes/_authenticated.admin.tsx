import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — AviatorDemo" }] }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) navigate({ to: "/play" });
  }, [loading, isAdmin, navigate]);

  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [{ count: users }, { count: rounds }, { data: recent }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("rounds").select("*", { count: "exact", head: true }),
        supabase.from("rounds").select("*").order("created_at", { ascending: false }).limit(30),
      ]);
      return { users: users ?? 0, rounds: rounds ?? 0, recent: recent ?? [] };
    },
  });

  if (!isAdmin) return null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-7 w-7 text-gold" /> Admin</h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Users</div>
          <div className="text-3xl font-bold tabular-nums">{stats?.users ?? "—"}</div>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Rounds played</div>
          <div className="text-3xl font-bold tabular-nums">{stats?.rounds ?? "—"}</div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <h2 className="px-5 pt-5 pb-3 text-lg font-bold">Recent rounds (all users)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-2 text-left">User</th>
                <th className="px-3 py-2 text-right">Bet</th>
                <th className="px-3 py-2 text-right">Crash</th>
                <th className="px-3 py-2 text-right">Result</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent ?? []).map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-5 py-2 truncate max-w-[200px] text-muted-foreground text-xs">{r.user_id}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(r.bet).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{Number(r.crash_point).toFixed(2)}x</td>
                  <td className={`px-3 py-2 text-right font-bold ${r.status === "won" ? "text-win" : "text-loss"}`}>
                    {r.status === "won" ? `+${Number(r.payout).toFixed(2)}` : `-${Number(r.bet).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-muted-foreground border-t border-border">
          To grant admin role to a user, insert into <code className="font-mono">user_roles</code> with role <code className="font-mono">admin</code>.
        </p>
      </div>
    </main>
  );
}
