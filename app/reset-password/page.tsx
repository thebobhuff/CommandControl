"use client";

import { useEffect, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { InteriorNav } from "@/components/interior-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("Checking reset link...");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const code = new URLSearchParams(window.location.search).get("code");

    if (!code) {
      void supabase.auth.getSession().then(({ data }) => {
        setReady(Boolean(data.session));
        setMessage(data.session ? "Enter a new password." : "");
        setError(data.session ? "" : "Open this page from the password reset email.");
      });
      return;
    }

    void supabase.auth.exchangeCodeForSession(code).then(({ error: sessionError }) => {
      if (sessionError) {
        setReady(false);
        setMessage("");
        setError(sessionError.message);
        return;
      }

      setReady(true);
      setMessage("Enter a new password.");
      window.history.replaceState({}, document.title, "/reset-password");
    });
  }, []);

  async function updatePassword() {
    setMessage("");
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated. You can log in with the new password.");
  }

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-5 px-4 py-5">
        <InteriorNav />
        <div className="mx-auto w-full max-w-md rounded-lg border border-border bg-background/75 p-5 backdrop-blur">
          <div className="mb-5">
            <h1 className="text-3xl font-black">Reset password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose a new password for your Commander Control account.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                disabled={!ready}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repeat your new password"
                disabled={!ready}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && ready && password && confirmPassword && !loading) {
                    void updatePassword();
                  }
                }}
              />
            </div>
            <Button className="w-full" onClick={() => void updatePassword()} disabled={!ready || !password || !confirmPassword || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Update password
            </Button>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
