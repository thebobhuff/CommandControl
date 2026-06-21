"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LogOut, Plus, UserRound } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { ScryfallPicker } from "@/components/scryfall-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";

type PlayerProfile = {
  id: string;
  display_name: string;
  favorite_commander: string | null;
  background_image: string | null;
  updated_at: string;
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [favoriteCommander, setFavoriteCommander] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      if (data.user) {
        void loadPlayers();
      }
    });
  }, []);

  async function loadPlayers() {
    const response = await fetch("/api/players", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const result = (await response.json()) as { players: PlayerProfile[] };
    setPlayers(result.players ?? []);
  }

  async function addPlayer() {
    setError("");
    const response = await fetch("/api/players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        display_name: displayName,
        favorite_commander: favoriteCommander || null,
        background_image: backgroundImage || null
      })
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setError(result.error ?? "Unable to save player");
      return;
    }

    setDisplayName("");
    setFavoriteCommander("");
    setBackgroundImage("");
    await loadPlayers();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5">
        <header className="flex flex-col gap-3 rounded-lg border border-border bg-background/75 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" className="mb-3 w-fit">
              <Link href="/games">
                <ArrowLeft className="h-4 w-4" />
                Games
              </Link>
            </Button>
            <h1 className="text-3xl font-black">Players</h1>
            <p className="mt-1 text-sm text-muted-foreground">{email || "Login to save players."}</p>
          </div>
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
        </header>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="mb-4 text-xl font-black">Add player</h2>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="favorite-commander">Favorite commander</Label>
                <Input id="favorite-commander" value={favoriteCommander} onChange={(event) => setFavoriteCommander(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="background-image">Background image</Label>
                <Input id="background-image" value={backgroundImage} onChange={(event) => setBackgroundImage(event.target.value)} placeholder="https://..." />
                <ScryfallPicker
                  onSelect={(imageUrl, cardName) => {
                    setBackgroundImage(imageUrl);
                    if (!favoriteCommander) {
                      setFavoriteCommander(cardName);
                    }
                  }}
                />
              </div>
              <Button className="w-full" onClick={() => void addPlayer()} disabled={!email || !displayName}>
                <Plus className="h-4 w-4" />
                Save Player
              </Button>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {players.length > 0 ? (
              players.map((player) => (
                <div key={player.id} className="overflow-hidden rounded-lg border border-border bg-card">
                  <div
                    className="h-28 bg-muted bg-cover bg-center"
                    style={{ backgroundImage: player.background_image ? `url(${player.background_image})` : undefined }}
                  />
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-primary">
                      <UserRound className="h-4 w-4" />
                      <span className="text-sm font-black uppercase tracking-wider">Player</span>
                    </div>
                    <h3 className="mt-2 text-xl font-black">{player.display_name}</h3>
                    {player.favorite_commander ? (
                      <p className="mt-1 text-sm text-muted-foreground">{player.favorite_commander}</p>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">No saved players yet.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
