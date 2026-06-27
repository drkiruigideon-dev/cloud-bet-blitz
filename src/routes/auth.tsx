import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AviatorDemo" },
      { name: "description", content: "Sign in or create a free demo account to play." },
    ],
  }),
  component: AuthPage,
});

// Normalize to E.164: strip spaces/dashes/parens, ensure leading "+"
function normalizePhone(input: string): string {
  const trimmed = input.trim().replace(/[\s\-()]/g, "");
  if (!trimmed) return "";
  return trimmed.startsWith("+") ? trimmed : `+${trimmed.replace(/^0+/, "")}`;
}

function AuthPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/play" });
    });
  }, [navigate]);

  function validate(): string | null {
    const p = normalizePhone(phone);
    if (!/^\+\d{7,15}$/.test(p)) return "Enter a valid phone number with country code (e.g. +254712345678)";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  }

  async function handleSignUp() {
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      phone: normalizePhone(phone),
      password,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Account created!"); navigate({ to: "/play" }); }
  }

  async function handleSignIn() {
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      phone: normalizePhone(phone),
      password,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else navigate({ to: "/play" });
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-12">
      <div className="absolute inset-0 -z-10 opacity-40">
        <div className="absolute top-1/4 left-1/3 h-96 w-96 rounded-full bg-pink/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      </div>
      <div className="w-full max-w-md glass rounded-3xl p-8 shadow-card">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-fire-gradient shadow-glow">
            <Plane className="h-6 w-6 -rotate-45 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Welcome to <span className="text-gradient-fire">AviatorDemo</span></h1>
          <p className="text-sm text-muted-foreground mt-1">Get 1,000 demo credits on signup</p>
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="space-y-3 mt-4">
            <div>
              <Label>Phone</Label>
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="+254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleSignIn} disabled={busy} className="w-full bg-fire-gradient text-primary-foreground shadow-glow">Sign in</Button>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <div>
              <Label>Phone</Label>
              <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="+254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleSignUp} disabled={busy} className="w-full bg-fire-gradient text-primary-foreground shadow-glow">Create account</Button>
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-xs text-center text-muted-foreground">Include your country code, e.g. +254 for Kenya.</p>
      </div>
    </div>
  );
}
