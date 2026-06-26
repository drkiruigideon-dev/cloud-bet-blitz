import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function BetPanel({ id, phase, hasBet, busy, countdown, multiplier, stakedAmount, onPlace, onCashOut }: Props) {
  const [mode, setMode] = useState<Mode>("bet");
  const [amount, setAmount] = useState(10);

  const inc = () => setAmount((a) => Math.min(20000, Math.round((a + 1) * 100) / 100));
  const dec = () => setAmount((a) => Math.max(1, Math.round((a - 1) * 100) / 100));

  const disabled = phase !== "betting" || hasBet;
  const showCashOut = phase === "flying" && hasBet;

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
                <span>Bet</span>
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
    </div>
  );
}
