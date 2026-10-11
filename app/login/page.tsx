"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2, Mail, RotateCcw, UserPlus } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { InteriorNav } from "@/components/interior-nav";
import { Button } from "@/components/ui/button";
import { Button as MotionButton } from "@/components/motion/button/base";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export default function LoginPage() {
  const [mode, setMode] = useState<"password" | "signup" | "magic" | "reset">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteEmail = new URLSearchParams(window.location.search).get("email");
    if (inviteEmail) {
      setEmail(inviteEmail);
      setMode("signup");
    }
  }, []);

  async function signIn() {
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const redirectTo = `${configuredSiteUrl ?? window.location.origin}/games`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setMessage("Check your email for a magic link.");
  }

  async function signInWithPassword() {
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    window.location.href = "/games";
  }

  async function createAccount() {
    setLoading(true);
    setMessage("");
    setError("");

    const supabase = createClient();
    const redirectTo = `${configuredSiteUrl ?? window.location.origin}/games`;
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo
      }
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.session) {
      window.location.href = "/games";
      return;
    }

    setMessage("Account created. Check your email to finish signing in.");
  }

  async function sendPasswordReset() {
    setLoading(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/auth/password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    setLoading(false);

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setError(result.error ?? "Unable to send password reset email.");
      return;
    }

    setMessage("Check your email for a password reset link.");
  }

  async function submitAuth() {
    try {
    if (mode === "magic") {
      await signIn();
      return;
    }

    if (mode === "reset") {
      await sendPasswordReset();
      return;
    }

    if (mode === "signup") {
      await createAccount();
      return;
    }

    await signInWithPassword();
    } catch {
      setError("Could not connect. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <main id="main-content" className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="workspace relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-5 px-4 py-5">
        <InteriorNav />
        <div className="auth-layout">
        <div className="auth-intro"><h2>Same table.<br /><em className="text-primary">Every game night.</em></h2><p>Save your regular players, bring their commanders along, and pick up your games across devices.</p><div className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">Just here to play? <a href="/tablet" className="text-link ml-1">Start a local game</a></div></div>
        <div className="auth-panel">
          <div className="mb-5">
            <h1>{mode === "signup" ? "Join the table." : mode === "reset" ? "Reset your password." : mode === "magic" ? "Get a sign-in link." : "Welcome back."}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Save Commander games and player profiles across devices.
            </p>
          </div>
          <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void submitAuth(); }}>
            <div className="grid grid-cols-3 gap-1 rounded-md border border-border bg-muted/30 p-1">
              <Button type="button" size="sm" variant={mode === "password" ? "secondary" : "ghost"} aria-pressed={mode === "password"} onClick={() => { setMode("password"); setError(""); setMessage(""); }}>
                Login
              </Button>
              <Button type="button" size="sm" variant={mode === "signup" ? "secondary" : "ghost"} aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>
                Sign up
              </Button>
              <Button type="button" size="sm" variant={mode === "magic" ? "secondary" : "ghost"} aria-pressed={mode === "magic"} onClick={() => { setMode("magic"); setError(""); setMessage(""); }}>
                Email link
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {mode !== "magic" && mode !== "reset" ? (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={mode === "signup" ? 6 : undefined}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"

                />
              </div>
            ) : null}
            <MotionButton type="submit" className="w-full rounded-md focus-visible:ring-2 focus-visible:ring-ring" disabled={!email || (mode !== "magic" && mode !== "reset" && !password) || loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "reset" ? (
                <RotateCcw className="h-4 w-4" />
              ) : mode === "magic" ? (
                <Mail className="h-4 w-4" />
              ) : mode === "signup" ? (
                <UserPlus className="h-4 w-4" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {mode === "reset" ? "Send reset link" : mode === "magic" ? "Send magic link" : mode === "signup" ? "Create account" : "Sign in"}
            </MotionButton>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setMode(mode === "reset" ? "password" : "reset");
                setMessage("");
                setError("");
              }}
            >
              {mode === "reset" ? "Back to login" : "Forgot your password?"}
            </Button>
            {message ? <p role="status" className="text-sm text-emerald-300">{message}</p> : null}
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          </form>
        </div>
        </div>
      </section>
    </main>
  );
}
