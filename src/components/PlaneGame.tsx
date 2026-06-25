import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane, Rocket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Phase = "idle" | "betting" | "flying" | "crashed" | "cashed";

// Smooth multiplier curve: m(t) = e^(k*t) so it grows exponentially
const GROWTH = 0.18; // per second
const TICK_MS = 50;

export function PlaneGame() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [bet, setBet] = useState("10");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [lastWin, setLastWin] = useState<{ amount: number; mult: number } | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const tickRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const cashedAtRef = useRef<number | null>(null);
  const crashRef = useRef<number>(0);

  // load recent crash history
  useEffect(() => {
    supabase
      .from("rounds")
      .select("crash_point")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setHistory(data.map((r) => Number(r.crash_point)));
      });
  }, []);

  const cleanup = useCallback(() => {
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const tick = useCallback(() => {
    const elapsed = (performance.now() - startRef.current) / 1000;
    const m = Math.max(1, Math.exp(GROWTH * elapsed));
    const rounded = Math.floor(m * 100) / 100;
    setMultiplier(rounded);
    if (rounded >= crashRef.current) {
      cleanup();
      finishRound(null);
    }
  }, [cleanup]);

  async function finishRound(cashed: number | null) {
    cleanup();
    const crash = crashRef.current;
    setHistory((h) => [crash, ...h].slice(0, 20));
    if (cashed != null) {
      setPhase("cashed");
      setLastWin({ amount: Number(bet) * cashed, mult: cashed });
    } else {
      setPhase("crashed");
      setLastWin(null);
    }
    setBusy(true);
    const { error } = await supabase.rpc("settle_round", {
      _bet: Number(bet),
      _crash: crash,
      _cashed: cashed as number,
    });
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["history"] });
    qc.invalidateQueries({ queryKey: ["leaderboard"] });
    setBusy(false);

    // reset to idle after 2.5s
    window.setTimeout(() => {
      setPhase("idle");
      setMultiplier(1);
      setCrashPoint(null);
      cashedAtRef.current = null;
    }, 2800);
  }

  async function placeBet() {
    const amount = Number(bet);
    if (!amount || amount <= 0) return toast.error("Enter a valid bet");
    setBusy(true);
    const { data, error } = await supabase.rpc("place_bet", { _bet: amount });
    setBusy(false);
    if (error) return toast.error(error.message);
    const crash = Number(data);
    crashRef.current = crash;
    setCrashPoint(crash);
    cashedAtRef.current = null;
    qc.invalidateQueries({ queryKey: ["wallet"] });

    setPhase("flying");
    setMultiplier(1);
    startRef.current = performance.now();
    tickRef.current = window.setInterval(tick, TICK_MS);
  }

  function cashOut() {
    if (phase !== "flying") return;
    cashedAtRef.current = multiplier;
    finishRound(multiplier);
  }

  // plane position based on multiplier (visual curve)
  const progress = Math.min(1, Math.log(multiplier) / Math.log(10));
  const planeX = 8 + progress * 80; // % across
  const planeY = 85 - progress * 70; // % from top (rises)

  return (
    <div className="space-y-4">
      {/* Recent crashes */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {history.map((c, i) => (
          <span
            key={i}
            className={`shrink-0 rounded-md px-2 py-1 text-xs font-bold tabular-nums ${
              c >= 2 ? "bg-win/20 text-win" : c >= 1.5 ? "bg-gold/20 text-gold" : "bg-loss/20 text-loss"
            }`}
          >
            {c.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Game screen */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-sky-gradient shadow-card aspect-[16/10] sm:aspect-[16/8]">
        {/* sun */}
        <div className="absolute right-[15%] top-[55%] h-32 w-32 rounded-full bg-gold-gradient blur-2xl opacity-70" />
        <div className="absolute right-[18%] top-[58%] h-20 w-20 rounded-full bg-gold-gradient opacity-90" />

        {/* clouds */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-[20%] left-[10%] h-8 w-24 bg-white/40 blur-md rounded-full" />
          <div className="absolute top-[35%] left-[60%] h-6 w-20 bg-white/30 blur-md rounded-full" />
          <div className="absolute top-[15%] left-[75%] h-5 w-16 bg-white/30 blur-md rounded-full" />
        </div>

        {/* trail */}
        {(phase === "flying" || phase === "cashed" || phase === "crashed") && (
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="trail" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.72 0.22 0)" stopOpacity="0" />
                <stop offset="100%" stopColor="oklch(0.85 0.16 85)" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d={`M 8 85 Q ${planeX * 0.5} 85 ${planeX} ${planeY}`}
              fill="none"
              stroke="url(#trail)"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* plane */}
        <div
          className="absolute transition-none"
          style={{
            left: `${planeX}%`,
            top: `${planeY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative">
            {phase === "flying" && (
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-2 w-4 bg-fire-gradient rounded-full blur-sm animate-flame" />
            )}
            <Plane
              className={`h-10 w-10 sm:h-12 sm:w-12 drop-shadow-2xl ${
                phase === "crashed" ? "text-loss rotate-90" : "text-foreground -rotate-45"
              } transition-transform duration-300`}
              strokeWidth={2}
            />
          </div>
        </div>

        {/* multiplier overlay */}
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div className="text-center">
            {phase === "idle" && (
              <div className="space-y-2">
                <Rocket className="h-12 w-12 mx-auto text-foreground/70" />
                <p className="text-sm font-medium text-foreground/80 uppercase tracking-widest">Place your bet</p>
              </div>
            )}
            {(phase === "flying" || phase === "cashed" || phase === "crashed") && (
              <div
                className={`font-bold tabular-nums text-6xl sm:text-8xl tracking-tighter drop-shadow-2xl ${
                  phase === "crashed" ? "text-loss" : phase === "cashed" ? "text-win" : "text-foreground"
                }`}
              >
                {multiplier.toFixed(2)}<span className="text-4xl sm:text-6xl">x</span>
              </div>
            )}
            {phase === "crashed" && (
              <p className="mt-2 text-xl font-bold text-loss uppercase tracking-widest animate-float-up">
                Crashed @ {crashPoint?.toFixed(2)}x
              </p>
            )}
            {phase === "cashed" && lastWin && (
              <p className="mt-2 text-xl font-bold text-win animate-float-up">
                +{lastWin.amount.toFixed(2)} won!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <div className="glass rounded-2xl p-3 flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground px-2">Bet</span>
          <Input
            type="number"
            min="1"
            step="1"
            value={bet}
            onChange={(e) => setBet(e.target.value)}
            disabled={phase === "flying"}
            className="bg-transparent border-0 text-lg font-bold tabular-nums focus-visible:ring-0"
          />
          <div className="flex gap-1">
            {[10, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setBet(String(v))}
                disabled={phase === "flying"}
                className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-40"
              >
                {v}
              </button>
            ))}
            <button
              onClick={() => setBet((b) => String(Math.max(1, Math.floor(Number(b) * 2))))}
              disabled={phase === "flying"}
              className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-accent disabled:opacity-40"
            >
              2x
            </button>
          </div>
        </div>

        {phase === "flying" ? (
          <Button
            onClick={cashOut}
            disabled={busy}
            className="h-auto py-4 px-8 text-lg font-bold bg-gold-gradient text-gold-foreground hover:opacity-90 shadow-gold-glow animate-pulse-glow"
          >
            Cash out @ {multiplier.toFixed(2)}x
            <br />
            <span className="text-sm opacity-80">+{(Number(bet) * multiplier).toFixed(2)}</span>
          </Button>
        ) : (
          <Button
            onClick={placeBet}
            disabled={busy || phase === "crashed" || phase === "cashed"}
            className="h-auto py-4 px-8 text-lg font-bold bg-fire-gradient text-primary-foreground hover:opacity-90 shadow-glow"
          >
            {phase === "idle" ? "Place bet & fly" : "Next round…"}
          </Button>
        )}
      </div>
    </div>
  );
}
