import { AlertTriangle } from "lucide-react";

export function ResponsibleNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gold" />
        <span>
          Demo only — no real money. This simulation uses virtual credits to illustrate how crash-style games work. Real gambling can be harmful. Play responsibly.
        </span>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-5 w-5 text-gold" />
        <h3 className="font-semibold">Responsible play</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This is a <strong className="text-foreground">free, educational demo</strong>. No real money is wagered or won — only virtual credits. Crash-style games are designed to lose money over time. If gambling is affecting your life, reach out to a support service in your country (e.g. <a className="underline hover:text-foreground" href="https://www.begambleaware.org" target="_blank" rel="noreferrer">BeGambleAware</a>, <a className="underline hover:text-foreground" href="https://www.ncpgambling.org" target="_blank" rel="noreferrer">NCPG</a>).
      </p>
    </div>
  );
}
