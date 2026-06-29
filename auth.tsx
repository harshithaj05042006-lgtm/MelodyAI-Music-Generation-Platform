import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MelodyAI" },
      { name: "description", content: "Sign in or create a free MelodyAI account to start generating music." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email if confirmation is required.");
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset email sent.");
        setMode("signin");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber/15 blur-3xl" />
      </div>
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
      </header>
      <main className="relative z-10 mx-auto flex max-w-md flex-col px-6 pt-12 pb-24">
        <div className="glass rounded-3xl p-8">
          <h1 className="font-display text-3xl font-semibold">
            {mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset password" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Free forever. No credit card." : mode === "forgot" ? "We'll send a reset link." : "Sign in to continue composing."}
          </p>

          {mode !== "forgot" && (
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-amber transition disabled:opacity-50"
            >
              <GoogleIcon /> Continue with Google
            </button>
          )}

          {mode !== "forgot" && (
            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Name" value={name} onChange={setName} placeholder="Your name" />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@email.com" required />
            {mode !== "forgot" && (
              <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" required />
            )}
            <button
              disabled={busy}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-amber to-teal py-2.5 text-sm font-semibold text-background shadow-glow transition hover:scale-[1.01] disabled:opacity-60"
            >
              {busy ? "…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            {mode !== "forgot" && (
              <button onClick={() => setMode("forgot")} className="hover:text-foreground">Forgot password?</button>
            )}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="hover:text-foreground"
            >
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create account"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-border bg-input/40 px-4 py-2.5 text-sm outline-none transition focus:border-amber focus:bg-input/60"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z"/>
    </svg>
  );
}