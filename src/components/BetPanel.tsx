import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

type Mode = "bet" | "auto";

type Props = {
  id: string;
  phase: "betting" | "flying" | "crashed" | "cashed";
  hasBet: boolean;
  busy: boolean;
  countdown: number;
  multiplier: number;
  stakedAmount: number;
  onPlace: (amount: number) => void;
  onCashOut: () => void;
};

const PRESETS = [100, 200, 500, 1000];
const MIN_AUTO_CASHOUT = 1.01;

export function BetPanel({ id, phase, hasBet, busy, countdown, multiplier, stakedAmount, onPlace, onCashOut }: Props) {
  const [mode, setMode] = useState<Mode>("bet");
  const [amount, setAmount] = useState(10);

  // Auto-mode controls
  const [autoBet, setAutoBet] = useState(false);
  const [autoCashout, setAutoCashout] = useState(false);
  const [cashoutAt, setCashoutAt] = useState(2.0);

  const placedThisRoundRef = useRef(false);
  const cashedThisRoundRef = useRef(false);

  const inc = () => setAmount((a) => Math.min(20000, Math.round((a + 1) * 100) / 100));
  const dec = () => setAmount((a) => Math.max(1, Math.round((a - 1) * 100) / 100));

  const disabled = phase !== "betting" || hasBet;
  const showCashOut = phase === "flying" && hasBet;

  // Reset per-round flags when a new betting window opens
  useEffect(() => {
    if (phase === "betting") {
      placedThisRoundRef.current = false;
      cashedThisRoundRef.current = false;
    }
  }, [phase]);

  // Auto-bet: place when betting window is open
  useEffect(() => {
    if (mode !== "auto" || !autoBet) return;
    if (phase !== "betting" || hasBet || busy) return;
    if (placedThisRoundRef.current) return;
    placedThisRoundRef.current = true;
    onPlace(amount);
  }, [mode, autoBet, phase, hasBet, busy, amount, onPlace]);

  // Auto-cashout: trigger when multiplier crosses target (must exceed by >= 0.01)
  useEffect(() => {
    if (mode !== "auto" || !autoCashout) return;
    if (phase !== "flying" || !hasBet) return;
    if (cashedThisRoundRef.current) return;
    const target = Math.max(MIN_AUTO_CASHOUT, cashoutAt);
    if (multiplier + 1e-9 >= target) {
      cashedThisRoundRef.current = true;
      onCashOut();
    }
  }, [mode, autoCashout, phase, hasBet, multiplier, cashoutAt, onCashOut]);

  const adjustCashout = (delta: number) =>
    setCashoutAt((v) => Math.max(MIN_AUTO_CASHOUT, Math.round((v + delta) * 100) / 100));

  return (
    <div className="glass rounded-2xl p-3 space-y-3">
      {/* Mode toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-full bg-muted/60 p-0.5 text-xs font-semibold">
          {(["bet", "auto"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-5 py-1.5 rounded-full capitalize transition-colors ${
                mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3 items-stretch">
        {/* Stake controls */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 bg-background/60 rounded-full px-2 py-1.5 border border-border">
            <button
              onClick={dec}
              disabled={disabled}
              aria-label="Decrease"
              className="h-7 w-7 rounded-full bg-muted hover:bg-accent disabled:opacity-40 grid place-items-center"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={1}
              step={1}
              value={amount}
              disabled={disabled}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 bg-transparent text-center text-base font-bold tabular-nums focus:outline-none disabled:opacity-60"
            />
            <button
              onClick={inc}
              disabled={disabled}
              aria-label="Increase"
              className="h-7 w-7 rounded-full bg-muted hover:bg-accent disabled:opacity-40 grid place-items-center"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                disabled={disabled}
                className="rounded-full bg-muted/70 hover:bg-accent px-2 py-1 text-[11px] font-semibold tabular-nums disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Action button */}
        {showCashOut ? (
          <Button
            id={`${id}-cashout`}
            onClick={onCashOut}
            disabled={busy}
            className="h-full min-h-[88px] rounded-2xl text-lg font-bold bg-gold-gradient text-gold-foreground hover:opacity-90 shadow-gold-glow animate-pulse-glow flex flex-col items-center justify-center gap-0.5"
          >
            <span>Cash Out</span>
            <span className="text-sm font-semibold opacity-90 tabular-nums">
              {(stakedAmount * multiplier).toFixed(2)} @ {multiplier.toFixed(2)}x
            </span>
          </Button>
        ) : (
          <Button
            id={`${id}-bet`}
            onClick={() => onPlace(amount)}
            disabled={busy || disabled}
            className="h-full min-h-[88px] rounded-2xl text-xl font-bold bg-fire-gradient text-primary-foreground hover:opacity-95 shadow-glow disabled:opacity-50 flex flex-col items-center justify-center gap-0.5"
          >
            {hasBet ? (
              <>
                <span>Bet Locked</span>
                <span className="text-sm font-semibold opacity-90 tabular-nums">{stakedAmount.toFixed(2)} KES</span>
              </>
            ) : phase === "betting" ? (
              <>
                <span>{mode === "auto" && autoBet ? "Auto Bet" : "Bet"}</span>
                <span className="text-sm font-semibold opacity-90 tabular-nums">
                  {amount.toFixed(2)} KES · {countdown}s
                </span>
              </>
            ) : (
              <>
                <span>Waiting…</span>
                <span className="text-sm font-semibold opacity-80">Next round soon</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Auto mode controls */}
      {mode === "auto" && (
        <div className="rounded-xl border border-border bg-background/40 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`${id}-autobet`} className="text-xs font-semibold text-foreground">
              Auto Bet
            </label>
            <Switch id={`${id}-autobet`} checked={autoBet} onCheckedChange={setAutoBet} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor={`${id}-autocashout`} className="text-xs font-semibold text-foreground">
              Auto Cash Out
            </label>
            <Switch id={`${id}-autocashout`} checked={autoCashout} onCheckedChange={setAutoCashout} />
          </div>

          <div className={`flex items-center gap-1.5 bg-background/60 rounded-full px-2 py-1 border border-border ${autoCashout ? "" : "opacity-50"}`}>
            <button
              onClick={() => adjustCashout(-0.1)}
              disabled={!autoCashout}
              aria-label="Decrease cashout"
              className="h-6 w-6 rounded-full bg-muted hover:bg-accent disabled:opacity-40 grid place-items-center"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="number"
              min={MIN_AUTO_CASHOUT}
              step={0.01}
              value={cashoutAt}
              disabled={!autoCashout}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v)) setCashoutAt(Math.max(MIN_AUTO_CASHOUT, Math.round(v * 100) / 100));
              }}
              className="flex-1 bg-transparent text-center text-sm font-bold tabular-nums focus:outline-none"
            />
            <span className="text-xs font-semibold text-muted-foreground pr-1">x</span>
            <button
              onClick={() => adjustCashout(0.1)}
              disabled={!autoCashout}
              aria-label="Increase cashout"
              className="h-6 w-6 rounded-full bg-muted hover:bg-accent disabled:opacity-40 grid place-items-center"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Minimum auto cash out is {MIN_AUTO_CASHOUT.toFixed(2)}x
          </p>
        </div>
      )}
    </div>
  );
}
