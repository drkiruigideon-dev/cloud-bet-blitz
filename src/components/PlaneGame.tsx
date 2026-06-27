import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plane } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LiveBets } from "@/components/LiveBets";
import { BetPanel } from "@/components/BetPanel";

type Phase = "betting" | "flying" | "crashed" | "cashed";

const GROWTH = 0.18;
const TICK_MS = 50;
const BETTING_MS = 5000;
const RESULT_MS = 3000;

function randomCrash(): number {
  const r = Math.random();
  if (r < 0.02) return 1.0;
  const v = 1 / (1 - Math.random());
  return Math.max(1.0, Math.min(100, Math.floor(v * 100) / 100));
}

function riggedCrash(): number {
  const r = Math.random();
  if (r < 0.35) return 1.0;
  return Math.max(1.01, Math.min(1.99, Math.floor((1 + Math.random() * 0.98) * 100) / 100));
}

export function PlaneGame() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("betting");
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [countdown, setCountdown] = useState(Math.ceil(BETTING_MS / 1000));
  const [busy, setBusy] = useState(false);
  const [hasBet, setHasBet] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0);

  const tickRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const crashRef = useRef<number>(0);
  const hasBetRef = useRef(false);
  const stakedRef = useRef(0);
  const cashedRef = useRef<number | null>(null);

  useEffect(() => {
    supabase
      .from("rounds")
      .select("crash_point")
      .order("created_at", { ascending: false })
      .limit(24)
      .then(({ data }) => {
        if (data) setHistory(data.map((r) => Number(r.crash_point)));
      });
  }, []);

  const clearTimers = useCallback(() => {
    if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
    if (countdownRef.current) { window.clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const startBetting = useCallback(() => {
    clearTimers();
    setPhase("betting");
    setMultiplier(1);
    setCrashPoint(null);
    setHasBet(false);
    hasBetRef.current = false;
    stakedRef.current = 0;
    setStakedAmount(0);
    cashedRef.current = null;

    const start = performance.now();
    setCountdown(Math.ceil(BETTING_MS / 1000));
    countdownRef.current = window.setInterval(() => {
      const remaining = BETTING_MS - (performance.now() - start);
      if (remaining <= 0) {
        clearTimers();
        startFlying();
      } else {
        setCountdown(Math.ceil(remaining / 1000));
      }
    }, 100);
  }, [clearTimers]);

  const startFlying = useCallback(() => {
    if (!hasBetRef.current) crashRef.current = randomCrash();
    setPhase("flying");
    setMultiplier(1);
    startRef.current = performance.now();
    tickRef.current = window.setInterval(() => {
      const elapsed = (performance.now() - startRef.current) / 1000;
      const m = Math.max(1, Math.exp(GROWTH * elapsed));
      const rounded = Math.floor(m * 100) / 100;
      setMultiplier(rounded);
      if (rounded >= crashRef.current) {
        clearTimers();
        endRound(cashedRef.current);
      }
    }, TICK_MS);
  }, [clearTimers]);

  async function endRound(cashedAt: number | null) {
    clearTimers();
    const crash = crashRef.current;
    setCrashPoint(crash);
    setHistory((h) => [crash, ...h].slice(0, 24));

    // If the player cashed out, show "cashed" briefly; otherwise show crash.
    setPhase(cashedAt != null ? "cashed" : "crashed");


    window.setTimeout(startBetting, RESULT_MS);
  }

  useEffect(() => {
    startBetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function placeBet(amount: number) {
    if (phase !== "betting" || hasBetRef.current) return;
    if (!amount || amount <= 0) return toast.error("Enter a valid bet");
    setBusy(true);
    const { error } = await supabase.rpc("place_bet", { _bet: amount });
    setBusy(false);
    if (error) return toast.error(error.message);
    crashRef.current = riggedCrash();
    hasBetRef.current = true;
    stakedRef.current = amount;
    setHasBet(true);
    setStakedAmount(amount);
    qc.invalidateQueries({ queryKey: ["wallet"] });
    toast.success(`Bet locked: ${amount}`);
  }

  function cashOut() {
    if (phase !== "flying" || !hasBetRef.current || cashedRef.current != null) return;
    cashedRef.current = multiplier;
    endRound(multiplier);
  }

  // plane position
  const progress = Math.min(1, Math.log(Math.max(1, multiplier)) / Math.log(10));
  const planeX = 8 + progress * 80;
  const planeY = 85 - progress * 70;

  const multiplierColor =
    phase === "crashed" ? "text-loss" : phase === "cashed" ? "text-win" : "text-foreground";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3 lg:h-[calc(100vh-120px)]">
      {/* Left: live bets */}
      <div className="hidden lg:block min-h-0">
        <LiveBets />
      </div>

      {/* Right: history strip + game + controls */}
      <div className="flex flex-col gap-3 min-h-0">
        {/* Recent crashes strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
          {history.map((c, i) => (
            <span
              key={i}
              className={`shrink-0 text-xs font-bold tabular-nums ${
                c >= 2 ? "text-win" : c >= 1.5 ? "text-gold" : "text-loss"
              }`}
            >
              {c.toFixed(2)}x
            </span>
          ))}
        </div>

        {/* Game screen — dark sunburst */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-background shadow-card aspect-[16/10] sm:aspect-[16/8]">
          {/* radial sunburst rays */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg at 50% 100%, oklch(0.25 0.1 305) 0deg 6deg, transparent 6deg 12deg)",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 80%, oklch(0.4 0.18 280 / 0.55), transparent 60%)",
              }}
            />
          </div>

          {/* trail */}
          {(phase === "flying" || phase === "cashed" || phase === "crashed") && (
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="trail" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.72 0.22 0)" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="oklch(0.72 0.22 0)" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="trailFill" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="oklch(0.72 0.22 0)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="oklch(0.72 0.22 0)" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d={`M 8 85 Q ${planeX * 0.5} 85 ${planeX} ${planeY} L ${planeX} 100 L 8 100 Z`}
                fill="url(#trailFill)"
              />
              <path
                d={`M 8 85 Q ${planeX * 0.5} 85 ${planeX} ${planeY}`}
                fill="none"
                stroke="url(#trail)"
                strokeWidth="0.9"
                strokeLinecap="round"
              />
            </svg>
          )}

          {/* plane */}
          {(phase === "flying" || phase === "cashed" || phase === "crashed") && (
            <div
              className="absolute"
              style={{ left: `${planeX}%`, top: `${planeY}%`, transform: "translate(-50%, -50%)" }}
            >
              <Plane
                className={`h-12 w-12 sm:h-14 sm:w-14 drop-shadow-2xl ${
                  phase === "crashed" ? "text-loss rotate-90" : "text-primary -rotate-45"
                } transition-transform duration-300`}
                strokeWidth={2.2}
                fill="currentColor"
              />
            </div>
          )}

          {/* center overlay */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              {phase === "betting" && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.3em]">
                    Next round in
                  </p>
                  <p className="text-6xl sm:text-8xl font-black tabular-nums text-gradient-fire drop-shadow-2xl">
                    {countdown}s
                  </p>
                  {hasBet && (
                    <p className="text-xs font-semibold text-gold uppercase tracking-widest">
                      Bet locked: {stakedAmount}
                    </p>
                  )}
                </div>
              )}
              {(phase === "flying" || phase === "cashed" || phase === "crashed") && (
                <div className={`font-black tabular-nums text-7xl sm:text-9xl tracking-tighter drop-shadow-2xl ${multiplierColor}`}>
                  {multiplier.toFixed(2)}
                  <span className="text-5xl sm:text-7xl">x</span>
                </div>
              )}
              {phase === "crashed" && (
                <p className="mt-3 text-base sm:text-lg font-bold text-loss uppercase tracking-[0.3em] animate-float-up">
                  Flew Away!
                </p>
              )}
              {phase === "cashed" && (
                <p className="mt-3 text-base sm:text-lg font-bold text-win uppercase tracking-[0.3em] animate-float-up">
                  Cashed Out
                </p>
              )}
            </div>
          </div>

          {/* corner balance pill (mimics reference) */}
          <div className="absolute bottom-3 right-3 glass rounded-full px-3 py-1 text-xs font-bold tabular-nums">
            {crashPoint ? `Last ${crashPoint.toFixed(2)}x` : "—"}
          </div>
        </div>

        {/* Dual bet panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <BetPanel
            id="panel-1"
            phase={phase}
            hasBet={hasBet}
            busy={busy}
            countdown={countdown}
            multiplier={multiplier}
            stakedAmount={stakedAmount}
            onPlace={placeBet}
            onCashOut={cashOut}
          />
          <BetPanel
            id="panel-2"
            phase={phase}
            hasBet={hasBet}
            busy={busy}
            countdown={countdown}
            multiplier={multiplier}
            stakedAmount={stakedAmount}
            onPlace={placeBet}
            onCashOut={cashOut}
          />
        </div>

        {/* Mobile live bets */}
        <div className="lg:hidden">
          <LiveBets />
        </div>
      </div>
    </div>
  );
}
