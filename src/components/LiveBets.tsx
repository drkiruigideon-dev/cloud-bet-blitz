import { useMemo, useState } from "react";
import { Users, Trophy, History } from "lucide-react";

type Tab = "all" | "previous" | "top";

// Deterministic-ish fake live bets so the panel feels alive.
function seedBets(count: number) {
  const names = ["A***1", "9***5", "8***9", "7***2", "j***5", "5***3", "8***6", "0***6", "8***5", "k***4", "m***7", "p***0", "q***3", "r***8"];
  const out: { name: string; bet: number; mult: number | null; win: number | null }[] = [];
  for (let i = 0; i < count; i++) {
    const bet = Math.round((10 + Math.random() * 990) * 100) / 100;
    const cashed = Math.random() < 0.55;
    const mult = cashed ? Math.round((1.1 + Math.random() * 8) * 100) / 100 : null;
    const win = cashed ? Math.round(bet * (mult as number) * 100) / 100 : null;
    out.push({ name: names[Math.floor(Math.random() * names.length)], bet, mult, win });
  }
  return out.sort((a, b) => (b.win ?? 0) - (a.win ?? 0));
}

export function LiveBets() {
  const [tab, setTab] = useState<Tab>("all");
  const bets = useMemo(() => seedBets(40), []);
  const top = useMemo(() => [...bets].filter((b) => b.win).sort((a, b) => (b.win ?? 0) - (a.win ?? 0)).slice(0, 25), [bets]);
  const previous = useMemo(() => bets.slice(0, 25), [bets]);
  const list = tab === "top" ? top : tab === "previous" ? previous : bets;

  const totalBets = bets.length;
  const totalWin = bets.reduce((s, b) => s + (b.win ?? 0), 0);

  return (
    <aside className="glass rounded-2xl overflow-hidden flex flex-col h-full min-h-0">
      {/* Tabs */}
      <div className="grid grid-cols-3 text-xs font-semibold border-b border-border">
        {([
          ["all", "All Bets", Users],
          ["previous", "Previous", History],
          ["top", "Top", Trophy],
        ] as const).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex items-center justify-center gap-1.5 py-2.5 transition-colors ${
              tab === k ? "bg-accent/40 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-accent/30 border-b border-border">
        <div>
          <div className="flex -space-x-2 mb-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full bg-fire-gradient border-2 border-card"
                style={{ background: `linear-gradient(135deg, hsl(${i * 80} 70% 60%), hsl(${i * 80 + 40} 70% 50%))` }}
              />
            ))}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{totalBets} Bets</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold tabular-nums text-gold">{totalWin.toFixed(2)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total win</div>
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
        <span>Player</span>
        <span className="text-right w-14">Bet</span>
        <span className="text-right w-10">x</span>
        <span className="text-right w-16">Win</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {list.map((b, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center px-3 py-2 text-xs tabular-nums border-b border-border/40 ${
              b.win ? "bg-win/5" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="h-5 w-5 rounded-full shrink-0"
                style={{ background: `linear-gradient(135deg, hsl(${(i * 37) % 360} 70% 60%), hsl(${(i * 37 + 60) % 360} 70% 45%))` }}
              />
              <span className="truncate text-muted-foreground">{b.name}</span>
            </div>
            <span className="text-right w-14">{b.bet.toFixed(2)}</span>
            <span className={`text-right w-10 font-semibold ${b.mult ? "text-gold" : "text-muted-foreground/40"}`}>
              {b.mult ? `${b.mult.toFixed(2)}x` : "—"}
            </span>
            <span className={`text-right w-16 font-semibold ${b.win ? "text-win" : "text-muted-foreground/40"}`}>
              {b.win ? b.win.toFixed(2) : "—"}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
