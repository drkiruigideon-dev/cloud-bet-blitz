import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-7xl font-bold text-gradient-fire">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Lost in the clouds</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-fire-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Back to runway
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center glass rounded-3xl p-10">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try refreshing the page.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-fire-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AviatorDemo — Crash multiplier simulation (no real money)" },
      { name: "description", content: "Free, educational demo of a crash-style multiplier game. Virtual credits only, no real money. Practice cash-out timing and explore game mechanics." },
      { name: "author", content: "AviatorDemo" },
      { property: "og:title", content: "AviatorDemo — Crash multiplier simulation (no real money)" },
      { property: "og:description", content: "Free, educational demo of a crash-style multiplier game. Virtual credits only, no real money. Practice cash-out timing and explore game mechanics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "AviatorDemo — Crash multiplier simulation (no real money)" },
      { name: "twitter:description", content: "Free, educational demo of a crash-style multiplier game. Virtual credits only, no real money. Practice cash-out timing and explore game mechanics." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93f3fd17-2a65-4e34-b752-faa798c33a4c/id-preview-988106a4--d14efae0-a679-4cf3-aca8-198d01cc4771.lovable.app-1782380754639.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/93f3fd17-2a65-4e34-b752-faa798c33a4c/id-preview-988106a4--d14efae0-a679-4cf3-aca8-198d01cc4771.lovable.app-1782380754639.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
