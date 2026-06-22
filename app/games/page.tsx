"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Copy,
  Eye,
  Gamepad2,
  History,
  MailPlus,
  Plus,
  RotateCcw,
  Save,
  TabletSmartphone
} from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { InteriorNav } from "@/components/interior-nav";
import { Button } from "@/components/ui/button";
import {
  createDefaultGame,
  createSavedGame,
  fetchSavedGames,
  setCurrentGameAccess,
  type SavedGameSummary
} from "@/lib/game-state";
import { createClient } from "@/utils/supabase/client";

type GameInvite = {
  id: string;
  game_id: string;
  invitee_email: string;
  invited_user_id: string | null;
  status: "pending" | "added" | "revoked";
  created_at: string;
  updated_at: string;
};

export default function GamesPage() {
  const [games, setGames] = useState<SavedGameSummary[]>([]);
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedGameId, setCopiedGameId] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      if (!data.user) {
        setLoading(false);
        return;
      }
      void Promise.all([fetchSavedGames(), fetchGameInvites()])
        .then(([nextGames, nextInvites]) => {
          setGames(nextGames);
          setInvites(nextInvites);
        })
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

  async function copyViewOnlyLink(game: SavedGameSummary) {
    const href = buildViewOnlyHref(game);
    await navigator.clipboard.writeText(href);
    setCopiedGameId(game.id);
    window.setTimeout(() => setCopiedGameId((current) => (current === game.id ? null : current)), 1800);
  }

  async function setGameClosed(game: SavedGameSummary, closed: boolean) {
    setError("");
    const response = await fetch("/api/games", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: game.id, is_active: !closed })
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setError(result.error ?? "Unable to update game");
      return;
    }

    const updatedGame = (await response.json()) as SavedGameSummary;
    setGames((current) => current.map((candidate) => (candidate.id === updatedGame.id ? updatedGame : candidate)));
  }

  async function inviteToGame(game: SavedGameSummary) {
    const nextEmail = inviteEmails[game.id]?.trim();
    if (!nextEmail) {
      return;
    }

    setInviteStatus((current) => ({ ...current, [game.id]: "Sending invite..." }));
    setError("");

    const response = await fetch("/api/game-invites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ gameId: game.id, email: nextEmail })
    });

    const result = (await response.json().catch(() => ({}))) as {
      invite?: GameInvite;
      error?: string;
      deliveryProvider?: string;
    };

    if (!response.ok || !result.invite) {
      setInviteStatus((current) => ({ ...current, [game.id]: result.error ?? "Unable to send invite" }));
      return;
    }

    setInvites((current) => {
      const withoutExisting = current.filter((invite) => invite.id !== result.invite!.id);
      return [result.invite!, ...withoutExisting];
    });
    setInviteEmails((current) => ({ ...current, [game.id]: "" }));
    setInviteStatus((current) => ({
      ...current,
      [game.id]:
        result.deliveryProvider === "platform"
          ? "Platform user added."
          : `Invite sent by ${result.deliveryProvider ?? "email"}.`
    }));
  }

  async function revokeInvite(invite: GameInvite) {
    setInviteStatus((current) => ({ ...current, [invite.game_id]: "Removing invite..." }));

    const response = await fetch("/api/game-invites", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id: invite.id })
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      setInviteStatus((current) => ({ ...current, [invite.game_id]: result.error ?? "Unable to remove invite" }));
      return;
    }

    setInvites((current) => current.filter((candidate) => candidate.id !== invite.id));
    setInviteStatus((current) => ({ ...current, [invite.game_id]: "Invite removed." }));
  }

  const activeGames = games.filter((game) => game.is_active);
  const historicalGames = games.filter((game) => !game.is_active);
  const gamesPlayedThisMonth = games.filter((game) => isThisMonth(game.updated_at)).length;
  const lastUpdatedAt = games
    .map((game) => new Date(game.updated_at).getTime())
    .filter(Number.isFinite)
    .sort((left, right) => right - left)[0];

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5">
        <InteriorNav />
        <header className="flex flex-col gap-3 rounded-lg border border-border bg-background/75 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black">Games</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {email || "Login to keep games synced across devices."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void newSavedGame()} disabled={!email}>
              <Plus className="h-4 w-4" />
              New Game
            </Button>
          </div>
        </header>

        {error ? <p className="rounded-md border border-destructive bg-destructive/15 p-3 text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <div className="rounded-lg border border-border bg-card p-4">Loading...</div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile icon={<BarChart3 className="h-4 w-4" />} label="Games played" value={games.length} />
              <StatTile icon={<Gamepad2 className="h-4 w-4" />} label="Active games" value={activeGames.length} />
              <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Closed games" value={historicalGames.length} />
              <StatTile icon={<CalendarClock className="h-4 w-4" />} label="This month" value={gamesPlayedThisMonth} />
            </div>
            {lastUpdatedAt ? (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Last game activity {new Date(lastUpdatedAt).toLocaleString()}
              </p>
            ) : null}

            <GameSection
              title="Active games"
              description="Games that are still open for control and display."
              emptyText={email ? "No active games. Start a new game to get rolling." : "Login to create and sync games."}
              games={activeGames}
              invites={invites}
              inviteEmails={inviteEmails}
              inviteStatus={inviteStatus}
              setInviteEmail={setInviteEmails}
              inviteToGame={inviteToGame}
              revokeInvite={revokeInvite}
              copiedGameId={copiedGameId}
              copyViewOnlyLink={copyViewOnlyLink}
              setGameClosed={setGameClosed}
            />

            <GameSection
              title="Game history"
              description="Closed games stay here for review and sharing."
              emptyText="No historical games yet."
              games={historicalGames}
              invites={invites}
              inviteEmails={inviteEmails}
              inviteStatus={inviteStatus}
              setInviteEmail={setInviteEmails}
              inviteToGame={inviteToGame}
              revokeInvite={revokeInvite}
              copiedGameId={copiedGameId}
              copyViewOnlyLink={copyViewOnlyLink}
              setGameClosed={setGameClosed}
            />
          </>
        )}
      </section>
    </main>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-xs font-black uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function GameSection({
  title,
  description,
  emptyText,
  games,
  invites,
  inviteEmails,
  inviteStatus,
  setInviteEmail,
  inviteToGame,
  revokeInvite,
  copiedGameId,
  copyViewOnlyLink,
  setGameClosed
}: {
  title: string;
  description: string;
  emptyText: string;
  games: SavedGameSummary[];
  invites: GameInvite[];
  inviteEmails: Record<string, string>;
  inviteStatus: Record<string, string>;
  setInviteEmail: Dispatch<SetStateAction<Record<string, string>>>;
  inviteToGame: (game: SavedGameSummary) => Promise<void>;
  revokeInvite: (invite: GameInvite) => Promise<void>;
  copiedGameId: string | null;
  copyViewOnlyLink: (game: SavedGameSummary) => Promise<void>;
  setGameClosed: (game: SavedGameSummary, closed: boolean) => Promise<void>;
}) {
  return (
    <section className="space-y-3">
      <div>
        <div className="flex items-center gap-2 text-primary">
          {title === "Game history" ? <History className="h-4 w-4" /> : <Gamepad2 className="h-4 w-4" />}
          <h2 className="text-xl font-black">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {games.length > 0 ? (
          games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              invites={invites.filter((invite) => invite.game_id === game.id)}
              inviteEmail={inviteEmails[game.id] ?? ""}
              inviteStatus={inviteStatus[game.id] ?? ""}
              setInviteEmail={(value) => setInviteEmail((current) => ({ ...current, [game.id]: value }))}
              inviteToGame={inviteToGame}
              revokeInvite={revokeInvite}
              copied={copiedGameId === game.id}
              copyViewOnlyLink={copyViewOnlyLink}
              setGameClosed={setGameClosed}
            />
          ))
        ) : (
          <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground">
            <Save className="mb-3 h-5 w-5 text-primary" />
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

function GameCard({
  game,
  invites,
  inviteEmail,
  inviteStatus,
  setInviteEmail,
  inviteToGame,
  revokeInvite,
  copied,
  copyViewOnlyLink,
  setGameClosed
}: {
  game: SavedGameSummary;
  invites: GameInvite[];
  inviteEmail: string;
  inviteStatus: string;
  setInviteEmail: (value: string) => void;
  inviteToGame: (game: SavedGameSummary) => Promise<void>;
  revokeInvite: (invite: GameInvite) => Promise<void>;
  copied: boolean;
  copyViewOnlyLink: (game: SavedGameSummary) => Promise<void>;
  setGameClosed: (game: SavedGameSummary, closed: boolean) => Promise<void>;
}) {
  const isOwner = game.access_role !== "invited";

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-primary">
          <Gamepad2 className="h-4 w-4" />
          <span className="text-sm font-black uppercase tracking-wider">Commander</span>
        </div>
        {!game.is_active ? (
          <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-black uppercase text-muted-foreground">
            Closed
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-xl font-black">{game.name}</h3>
      <p className="mt-2 text-xs text-muted-foreground">
        Created {new Date(game.created_at).toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Updated {new Date(game.updated_at).toLocaleString()}
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setCurrentGameAccess({
              gameId: game.id,
              displayToken: game.display_token,
              controlToken: game.control_token
            });
            window.location.href = "/control";
          }}
        >
          <TabletSmartphone className="h-4 w-4" />
          Control
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={buildViewOnlyHref(game)} target="_blank">
            <Eye className="h-4 w-4" />
            View
          </Link>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => void copyViewOnlyLink(game)}>
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Share"}
        </Button>
        {isOwner ? (
          <Button type="button" variant="outline" size="sm" onClick={() => void setGameClosed(game, game.is_active)}>
            {game.is_active ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            {game.is_active ? "Close" : "Reopen"}
          </Button>
        ) : null}
      </div>
      {isOwner ? (
        <div className="mt-4 rounded-md border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-2 text-primary">
            <MailPlus className="h-4 w-4" />
            <h4 className="text-sm font-black uppercase tracking-wider">Invite players</h4>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="player@example.com"
            />
            <Button type="button" size="sm" onClick={() => void inviteToGame(game)} disabled={!inviteEmail.trim()}>
              Invite
            </Button>
          </div>
          {inviteStatus ? <p className="mt-2 text-xs text-muted-foreground">{inviteStatus}</p> : null}
          {invites.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {invites.map((invite) => (
                <span
                  key={invite.id}
                  className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
                >
                  <span className="max-w-40 truncate">{invite.invitee_email}</span>
                  <span className="font-semibold uppercase text-primary">{invite.status}</span>
                  <button
                    type="button"
                    className="font-semibold text-destructive"
                    onClick={() => void revokeInvite(invite)}
                  >
                    Remove
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function buildViewOnlyHref(game: SavedGameSummary) {
  const params = new URLSearchParams({ gameId: game.id });
  if (game.display_token) {
    params.set("token", game.display_token);
  }

  if (typeof window === "undefined") {
    return `/display?${params.toString()}`;
  }

  return `${window.location.origin}/display?${params.toString()}`;
}

function isThisMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

async function fetchGameInvites() {
  const response = await fetch("/api/game-invites", { cache: "no-store" });
  if (!response.ok) {
    return [] as GameInvite[];
  }

  const result = (await response.json()) as { invites: GameInvite[] };
  return result.invites ?? [];
}
