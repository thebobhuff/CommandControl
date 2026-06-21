"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2, Monitor, Tablet, TabletSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSavedGames, setCurrentGameAccess, type SavedGameSummary } from "@/lib/game-state";

export function ActiveGamesList() {
  const [games, setGames] = useState<SavedGameSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetchSavedGames()
      .then((savedGames) => setGames(savedGames.filter((game) => game.is_active).slice(0, 4)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || games.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Active Games</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/games">View all</Link>
        </Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {games.map((game) => {
          const displayHref = `/display?gameId=${encodeURIComponent(game.id)}&token=${encodeURIComponent(game.display_token)}`;
          const controlHref = `/control?gameId=${encodeURIComponent(game.id)}&token=${encodeURIComponent(game.control_token)}`;
          const tabletHref = `/tablet?gameId=${encodeURIComponent(game.id)}&token=${encodeURIComponent(game.control_token)}`;

          return (
            <article key={game.id} className="rounded-lg border border-border bg-card/85 p-3 backdrop-blur">
              <div className="flex items-start gap-2">
                <Gamepad2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-black">{game.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {new Date(game.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <GameLink href={controlHref} game={game} label="Control" icon={<TabletSmartphone className="h-4 w-4" />} />
                <GameLink href={tabletHref} game={game} label="Tablet" icon={<Tablet className="h-4 w-4" />} />
                <GameLink href={displayHref} game={game} label="TV" icon={<Monitor className="h-4 w-4" />} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function GameLink({
  href,
  game,
  label,
  icon
}: {
  href: string;
  game: SavedGameSummary;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        href={href}
        onClick={() =>
          setCurrentGameAccess({
            gameId: game.id,
            displayToken: game.display_token,
            controlToken: game.control_token
          })
        }
      >
        {icon}
        {label}
      </Link>
    </Button>
  );
}
