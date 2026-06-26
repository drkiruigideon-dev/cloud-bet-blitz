import { createFileRoute } from "@tanstack/react-router";
import { PlaneGame } from "@/components/PlaneGame";
import { ResponsibleNotice } from "@/components/ResponsibleNotice";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "Play — AviatorDemo" },
      { name: "description", content: "Play the crash multiplier demo with virtual credits." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  return (
    <main className="mx-auto max-w-7xl px-3 sm:px-4 py-4 space-y-4">
      <PlaneGame />
      <ResponsibleNotice compact />
    </main>
  );
}
