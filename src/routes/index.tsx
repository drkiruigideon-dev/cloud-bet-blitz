import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plane, Sparkles, Trophy, Shield, Wallet } from "lucide-react";
import { Nav } from "@/components/Nav";
import { ResponsibleNotice } from "@/components/ResponsibleNotice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AviatorDemo — Crash multiplier simulation (no real money)" },
      { name: "description", content: "Free demo of a crash-style multiplier game. Virtual credits, leaderboard, round history. No real money is ever wagered." },
      { property: "og:title", content: "AviatorDemo — Crash multiplier demo" },
      { property: "og:description", content: "Practice cash-out timing on a beautifully animated demo. Virtual credits only." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-7xl px-4">
        {/* Hero */}
        <section className="relative py-16 sm:py-24">
          <div className="absolute inset-0 -z-10 opacity-50">
            <div className="absolute top-10 left-1/4 h-64 w-64 rounded-full bg-pink/30 blur-3xl" />
            <div className="absolute top-32 right-1/4 h-72 w-72 rounded-full bg-gold/20 blur-3xl" />
          </div>
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <Sparkles className="h-3 w-3 text-gold" />
              100% free educational demo · No real money
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter leading-[1.05]">
              Ride the curve.<br />
              <span className="text-gradient-fire">Cash out before</span><br />
              <span className="text-gradient-gold">it crashes.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              A beautifully animated demo of a crash-style multiplier game. Watch the plane fly, choose when to cash out, and see how greedy timing punishes you. Virtual credits only.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/play"
                className="inline-flex items-center gap-2 rounded-xl bg-fire-gradient px-6 py-3 text-base font-bold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
              >
                Start playing <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/leaderboard"
                className="inline-flex items-center gap-2 rounded-xl glass px-6 py-3 text-base font-bold hover:bg-accent transition-colors"
              >
                <Trophy className="h-4 w-4 text-gold" /> Leaderboard
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-16">
          {[
            { icon: Plane, title: "Smooth animation", body: "Watch the multiplier climb on a hand-tuned exponential curve with a fiery trail." },
            { icon: Wallet, title: "Virtual wallet", body: "Every account starts with 1,000 demo credits. Top yourself up by winning rounds." },
            { icon: Shield, title: "Safe by design", body: "No payments, no withdrawals. Built to demonstrate mechanics, not to gamble." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="glass rounded-2xl p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-fire-gradient shadow-glow mb-4">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="pb-24">
          <ResponsibleNotice />
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        AviatorDemo · Built for education · Not affiliated with any gambling operator
      </footer>
    </div>
  );
}
