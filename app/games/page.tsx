"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, LogOut, Plus, Save, UserRound } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Button } from "@/components/ui/button";
import {
  createDefaultGame,
  createSavedGame,
  fetchSavedGames,
  setCurrentGameAccess,
  setCurrentGameId,
  type SavedGameSummary
} from "@/lib/game-state";
import { createClient } from "@/utils/supabase/client";

export default function GamesPage() {
  const [games, setGames] = useState<SavedGameSummary[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      if (!data.user) {
        setLoading(false);
        return;
      }
      void fetchSavedGames()
        .then(setGames)
        .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load games"))
        .finally(() => setLoading(false));
    });
  }, []);

  async function newSavedGame() {
    setError("");
    try {
      await createSavedGame(createDefaultGame(), "Commander Game");
      window.location.href = "/control";
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create game");
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCurrentGameId(null);
    window.location.href = "/";
  }

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5">
        <header className="flex flex-col gap-3 rounded-lg border border-border bg-background/75 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 w-fit">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </Button>
            <h1 className="text-3xl font-black">Saved games</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {email || "Login to save game states across devices."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {email ? (
              <Button variant="outline" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            ) : (
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}
            <Button onClick={() => void newSavedGame()} disabled={!email}>
              <Plus className="h-4 w-4" />
              New Saved Game
            </Button>
            <Button asChild variant="secondary">
              <Link href="/players">
                <UserRound className="h-4 w-4" />
                Players
              </Link>
            </Button>
          </div>
        </header>

        {error ? <p className="rounded-md border border-destructive bg-destructive/15 p-3 text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-3 md:grid-cols-2">
          {loading ? (
            <div className="rounded-lg border border-border bg-card p-4">Loading...</div>
          ) : games.length > 0 ? (
            games.map((game) => (
              <button
                key={game.id}
                type="button"
                className="rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary"
                onClick={() => {
                  setCurrentGameAccess({
                    gameId: game.id,
                    displayToken: game.display_token,
                    controlToken: game.control_token
                  });
                  window.location.href = "/control";
                }}
              >
                <div className="flex items-center gap-2 text-primary">
                  <Gamepad2 className="h-4 w-4" />
                  <span className="text-sm font-black uppercase tracking-wider">Commander</span>
                </div>
                <h2 className="mt-2 text-xl font-black">{game.name}</h2>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {new Date(game.updated_at).toLocaleString()}
                </p>
              </button>
            ))
          ) : (
            <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
              <Save className="mb-3 h-5 w-5 text-primary" />
              No saved games yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
