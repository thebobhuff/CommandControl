"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Crown, Dices, Gem, Moon, Skull, Slash, Sparkles, Star, Sun, TabletSmartphone, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchServerGame,
  hydrateGameAccessFromUrl,
  loadGame,
  saveGame,
  subscribeToGame,
  type CommanderGame,
  type CommanderPlayer
} from "@/lib/game-state";
import { cn } from "@/lib/utils";

export default function DisplayPage() {
  const [game, setGame] = useState<CommanderGame>(() => loadGame());
  const [connected, setConnected] = useState(false);
  const [, setClockTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    hydrateGameAccessFromUrl();

    const refresh = () => {
      void fetchServerGame()
        .then((serverGame) => {
          if (!mounted) {
            return;
          }
          setConnected(true);
          setGame((current) => {
            if (serverGame.updatedAt >= current.updatedAt) {
              saveGame(serverGame);
              return serverGame;
            }
            return current;
          });
        })
        .catch(() => setConnected(false));
    };

    refresh();
    const interval = window.setInterval(refresh, 900);
    const clock = window.setInterval(() => setClockTick((tick) => tick + 1), 1000);
    const unsubscribe = subscribeToGame((nextGame) => setGame(nextGame));

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.clearInterval(clock);
      unsubscribe();
    };
  }, []);

  const gridClass = useMemo(() => {
    if (game.players.length <= 2) {
      return "grid-cols-1 md:grid-cols-2 md:grid-rows-1";
    }
    if (game.players.length === 3) {
      return "grid-cols-1 md:grid-cols-3 md:grid-rows-1";
    }
    return "grid-cols-1 md:grid-cols-2 md:grid-rows-2";
  }, [game.players.length]);

  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const randomPlayer = game.players.find((player) => player.id === game.randomPlayerId);
  const timerSeconds = game.turnSeconds + (game.timerStartedAt ? Math.max(0, Math.floor((Date.now() - game.timerStartedAt) / 1000)) : 0);

  return (
    <main className="fixed-screen flex flex-col overflow-hidden bg-black text-foreground">
      <GameStatusBar
        game={game}
        connected={connected}
        activePlayer={activePlayer}
        randomPlayer={randomPlayer}
        timerSeconds={timerSeconds}
      />
      <div className={cn("grid min-h-0 flex-1 auto-rows-fr gap-1 p-1", gridClass)}>
        {game.players.map((player) => (
          <PlayerDisplay
            key={player.id}
            player={player}
            players={game.players}
            compact={game.players.length >= 4}
            isActive={game.activePlayerId === player.id}
            isRandom={game.randomPlayerId === player.id}
          />
        ))}
      </div>
    </main>
  );
}

function GameStatusBar({
  game,
  connected,
  activePlayer,
  randomPlayer,
  timerSeconds
}: {
  game: CommanderGame;
  connected: boolean;
  activePlayer?: CommanderPlayer;
  randomPlayer?: CommanderPlayer;
  timerSeconds: number;
}) {
  const monarch = game.players.find((player) => player.isMonarch);
  const initiative = game.players.find((player) => player.hasInitiative);
  const cityBlessed = game.players.filter((player) => player.hasCityBlessing);
  const cityLabel =
    cityBlessed.length === 0
      ? null
      : cityBlessed.length === 1
        ? cityBlessed[0].name
        : `${cityBlessed.length} players`;

  return (
    <header className="relative z-40 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-zinc-950/95 px-3 text-white shadow-[0_12px_36px_rgba(0,0,0,0.38)] screen-text-shadow sm:h-20 sm:px-5">
      <div className="flex h-full shrink-0 items-center gap-3 border-r border-white/10 pr-3 sm:pr-5">
        <span className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_14px_currentColor]", connected ? "bg-emerald-400 text-emerald-400" : "bg-destructive text-destructive")} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-white/45 sm:text-xs">Commander Control</p>
          <p className="text-sm font-black sm:text-lg">{connected ? "Live Game" : "Offline Display"}</p>
        </div>
      </div>

      <div
        className={cn(
          "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-black uppercase sm:h-14 sm:px-4 sm:text-xl",
          game.dayNight === "night"
            ? "bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-300/35"
            : game.dayNight === "day"
              ? "bg-amber-400/20 text-amber-100 ring-1 ring-amber-200/35"
              : "bg-white/10 text-white/70 ring-1 ring-white/10"
        )}
      >
        {game.dayNight === "night" ? <Moon className="h-5 w-5 sm:h-7 sm:w-7" /> : <Sun className="h-5 w-5 sm:h-7 sm:w-7" />}
        {game.dayNight ?? "Day/Night"}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {activePlayer ? <StatusItem label="Turn" value={activePlayer.name} /> : null}
        <StatusItem label={game.timerStartedAt ? "Timer Running" : "Timer"} value={timerSeconds ? formatDuration(timerSeconds) : "0:00"} icon={<Timer className="h-4 w-4" />} />
        {randomPlayer ? <StatusItem label="Pick" value={randomPlayer.name} /> : null}
        {game.diceRoll ? <StatusItem label="d20" value={game.diceRoll.toString()} icon={<Dices className="h-4 w-4" />} /> : null}
        {monarch ? <StatusItem label="Monarch" value={monarch.name} icon={<Crown className="h-4 w-4" />} /> : null}
        {initiative ? <StatusItem label="Initiative" value={initiative.name} icon={<Sparkles className="h-4 w-4" />} /> : null}
        {cityLabel ? <StatusItem label="City Blessing" value={cityLabel} icon={<Trophy className="h-4 w-4" />} /> : null}
      </div>

      <Button asChild size="icon" variant="ghost" className="h-11 w-11 shrink-0 bg-white/5 text-white hover:bg-white/10 sm:h-12 sm:w-12">
        <Link href="/control" aria-label="Open tablet controls">
          <TabletSmartphone className="h-5 w-5" />
        </Link>
      </Button>
    </header>
  );
}

function StatusItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex h-11 min-w-0 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.07] px-3 backdrop-blur sm:h-14 sm:px-4">
      {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-wider text-white/45 sm:text-[10px]">{label}</p>
        <p className="max-w-28 truncate text-sm font-black leading-tight sm:max-w-40 sm:text-lg">{value}</p>
      </div>
    </div>
  );
}

function PlayerDisplay({
  player,
  players,
  compact,
  isActive,
  isRandom
}: {
  player: CommanderPlayer;
  players: CommanderPlayer[];
  compact: boolean;
  isActive: boolean;
  isRandom: boolean;
}) {
  const previousLife = useRef(player.life);
  const previousPoison = useRef(player.poison);
  const [lifeBurst, setLifeBurst] = useState<{ delta: number; key: number } | null>(null);
  const [poisonBurst, setPoisonBurst] = useState<{ delta: number; key: number } | null>(null);
  const commanderThreat = Object.values(player.commanderDamage).some((damage) => damage >= 15);
  const deadToCommander = Object.values(player.commanderDamage).some((damage) => damage >= 21);
  const deadToPoison = player.poison >= 10;
  const eliminated = player.life <= 0 || deadToCommander || deadToPoison;

  useEffect(() => {
    const delta = player.life - previousLife.current;
    if (delta !== 0) {
      setLifeBurst({ delta, key: Date.now() });
    }
    previousLife.current = player.life;
  }, [player.life]);

  useEffect(() => {
    const delta = player.poison - previousPoison.current;
    if (delta !== 0) {
      setPoisonBurst({ delta, key: Date.now() });
    }
    previousPoison.current = player.poison;
  }, [player.poison]);

  return (
    <section
      className={cn(
        "relative flex h-full min-h-0 overflow-hidden rounded-md border border-white/10 bg-zinc-950",
        lifeBurst && lifeBurst.delta > 0 && "life-gain-pulse",
        lifeBurst && lifeBurst.delta < 0 && "life-loss-pulse",
        poisonBurst && "poison-pulse"
      )}
      style={{
        backgroundImage: player.backgroundImage
          ? `linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.36)), url(${player.backgroundImage})`
          : "linear-gradient(135deg, rgba(20,83,72,0.5), rgba(120,53,15,0.35), rgba(9,9,11,1))",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
      {eliminated ? <div className="absolute inset-0 bg-destructive/25" /> : null}
      {lifeBurst?.delta && lifeBurst.delta > 0 ? (
        <Star
          key={`star-${lifeBurst.key}`}
          className="star-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-32 w-32 fill-white text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.92)] md:h-44 md:w-44"
        />
      ) : null}
      {lifeBurst?.delta && lifeBurst.delta < 0 ? (
        <Slash
          key={`slash-${lifeBurst.key}`}
          className="slash-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-40 w-40 text-destructive drop-shadow-[0_0_28px_rgba(220,38,38,0.95)] md:h-56 md:w-56"
          strokeWidth={4}
        />
      ) : null}
      {poisonBurst?.delta && poisonBurst.delta > 0 ? (
        <Skull
          key={`poison-${poisonBurst.key}`}
          className="skull-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-32 w-32 fill-emerald-500/25 text-emerald-300 drop-shadow-[0_0_30px_rgba(16,185,129,0.95)] md:h-44 md:w-44"
          strokeWidth={2.8}
        />
      ) : null}
      <div className="relative z-10 flex w-full flex-col justify-between gap-3 p-3 screen-text-shadow sm:p-4 lg:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[clamp(1.35rem,3.4vw,3rem)] font-black leading-none">{player.name}</h2>
            {player.commanderName || player.backgroundCardName ? (
              <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wider text-primary lg:text-sm">
                {player.commanderName || player.backgroundCardName}
                {player.partnerCommanderName ? ` / ${player.partnerCommanderName}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex max-w-[45%] flex-wrap justify-end gap-1">
            {isActive ? <DisplayBadge>Turn</DisplayBadge> : null}
            {isRandom ? <DisplayBadge>Pick</DisplayBadge> : null}
            {player.isMonarch ? <DisplayBadge>Monarch</DisplayBadge> : null}
            {player.hasInitiative ? <DisplayBadge>Initiative</DisplayBadge> : null}
            {player.hasCityBlessing ? <DisplayBadge>City</DisplayBadge> : null}
            {eliminated ? <DisplayBadge danger>Out</DisplayBadge> : commanderThreat ? <DisplayBadge>Danger</DisplayBadge> : null}
          </div>
        </div>

        <div className="flex min-h-0 items-end justify-between gap-3 md:gap-5">
          <div
            className={cn(
              "relative min-w-0 font-black leading-none",
              compact ? "text-[clamp(4.75rem,12vw,9.25rem)]" : "text-[clamp(5.5rem,17vw,13rem)]"
            )}
          >
            {player.life}
            {lifeBurst ? (
              <span
                key={lifeBurst.key}
                className={cn(
                  "floating-delta absolute left-1/2 top-6 -translate-x-1/2 rounded-md bg-black/55 px-5 py-2 text-5xl backdrop-blur md:text-7xl",
                  lifeBurst.delta > 0 ? "text-primary" : "text-destructive"
                )}
              >
                {lifeBurst.delta > 0 ? "+" : ""}
                {lifeBurst.delta}
              </span>
            ) : null}
          </div>
          <div
            className={cn(
              "mb-1 grid shrink-0 gap-1 md:mb-4 md:gap-1.5",
              compact ? "w-[min(8.5rem,24vw)]" : "w-[min(9.75rem,28vw)]"
            )}
          >
            <div
              className={cn(
                "relative flex items-center justify-between rounded-md bg-black/45 px-3 py-2 backdrop-blur lg:px-4",
                poisonBurst && "poison-pulse"
              )}
              title="Poison"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-300/25 lg:h-9 lg:w-9">
                <Skull className="h-5 w-5 lg:h-6 lg:w-6" />
              </span>
              <span className="text-2xl font-black lg:text-3xl">{player.poison}</span>
              {poisonBurst ? (
                <span
                  key={poisonBurst.key}
                  className="floating-delta absolute -top-12 left-1/2 -translate-x-1/2 rounded-md bg-emerald-500/85 px-3 py-1 text-xl font-black text-white"
                >
                  {poisonBurst.delta > 0 ? "+" : ""}
                  {poisonBurst.delta}
                </span>
              ) : null}
            </div>
            {players
              .filter((source) => source.id !== player.id)
              .map((source, index) => (
                <div key={source.id} className="flex items-center justify-between gap-2 rounded-md bg-black/45 px-2.5 py-1.5 backdrop-blur lg:px-3" title={`Commander damage from ${source.name}`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-xs font-black text-primary ring-1 ring-primary/30 lg:h-8 lg:w-8 lg:text-sm">
                    P{index + 1}
                  </span>
                  <span className={cn("text-xl font-black leading-none lg:text-2xl", (player.commanderDamage[source.id] ?? 0) >= 15 && "text-primary")}>
                    {player.commanderDamage[source.id] ?? 0}
                  </span>
                </div>
              ))}
            <div className="grid grid-cols-3 gap-1.5">
              <StatPill icon={<Trophy className="h-3.5 w-3.5" />} value={player.experience} />
              <StatPill icon={<Sparkles className="h-3.5 w-3.5" />} value={player.energy} />
              <StatPill icon={<Gem className="h-3.5 w-3.5" />} value={player.treasure} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DisplayBadge({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span className={cn("rounded-md px-2 py-1 text-[10px] font-black uppercase sm:text-xs", danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}>
      {children}
    </span>
  );
}

function StatPill({ icon, value }: { icon: React.ReactNode; value: number }) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-md bg-black/45 px-2 py-1 text-sm font-black backdrop-blur">
      {icon}
      {value}
    </div>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}
