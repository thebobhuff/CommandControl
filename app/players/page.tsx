"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Loader2, LogOut, Plus, UserRound } from "lucide-react";
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
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
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

  async function updatePlayer(
    player: PlayerProfile,
    patch: Partial<Pick<PlayerProfile, "display_name" | "favorite_commander" | "background_image">>
  ) {
    setError("");
    setSavingPlayerId(player.id);
    const nextPlayer = {
      ...player,
      ...patch
    };

    const response = await fetch("/api/players", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: player.id,
        display_name: nextPlayer.display_name,
        favorite_commander: nextPlayer.favorite_commander || null,
        background_image: nextPlayer.background_image || null
      })
    });

    setSavingPlayerId(null);

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setError(result.error ?? "Unable to update player");
      return;
    }

    const savedPlayer = (await response.json()) as PlayerProfile;
    setPlayers((current) =>
      current.map((candidate) => (candidate.id === savedPlayer.id ? savedPlayer : candidate))
    );
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
                <Label htmlFor="background-image">Profile image</Label>
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-primary">
                          <UserRound className="h-4 w-4" />
                          <span className="text-sm font-black uppercase tracking-wider">Player</span>
                        </div>
                        <h3 className="mt-2 truncate text-xl font-black">{player.display_name}</h3>
                        {player.favorite_commander ? (
                          <p className="mt-1 truncate text-sm text-muted-foreground">{player.favorite_commander}</p>
                        ) : null}
                      </div>
                      {savingPlayerId === player.id ? <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-primary" /> : null}
                    </div>
                    <details className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2">
                      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        Profile image
                      </summary>
                      <div className="mt-3 space-y-2">
                        <Label htmlFor={`${player.id}-profile-image`}>Image URL</Label>
                        <div className="grid grid-cols-[1fr_auto] gap-2">
                          <Input
                            id={`${player.id}-profile-image`}
                            value={player.background_image ?? ""}
                            onChange={(event) => {
                              setPlayers((current) =>
                                current.map((candidate) =>
                                  candidate.id === player.id
                                    ? { ...candidate, background_image: event.target.value }
                                    : candidate
                                )
                              );
                            }}
                            onBlur={(event) => void updatePlayer(player, { background_image: event.target.value })}
                            placeholder="https://..."
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void updatePlayer(player, { background_image: null })}
                            disabled={!player.background_image || savingPlayerId === player.id}
                          >
                            Clear
                          </Button>
                        </div>
                        <ScryfallPicker
                          onSelect={(imageUrl, cardName) =>
                            void updatePlayer(player, {
                              background_image: imageUrl,
                              favorite_commander: player.favorite_commander || cardName
                            })
                          }
                        />
                      </div>
                    </details>
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
