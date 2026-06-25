"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Dices,
  Gem,
  Minus,
  Monitor,
  Moon,
  Plus,
  RotateCcw,
  Settings,
  Skull,
  Slash,
  Sparkles,
  Star,
  Sun,
  Timer,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchServerGame,
  getCurrentGameAccess,
  hydrateGameAccessFromUrl,
  loadGame,
  pushServerGame,
  saveGame,
  subscribeToGame,
  updateGame,
  type GameAccess,
  type CommanderGame,
  type CommanderPlayer
} from "@/lib/game-state";
import { cn } from "@/lib/utils";

export default function TabletPage() {
  const [game, setGame] = useState<CommanderGame>(() => loadGame());
  const [connected, setConnected] = useState(false);
  const [gameAccess, setGameAccess] = useState<GameAccess>(() => ({
    gameId: null,
    displayToken: null,
    controlToken: null
  }));
  const [, setClockTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    const access = hydrateGameAccessFromUrl();
    setGameAccess(access);

    void fetchServerGame()
      .then((serverGame) => {
        if (!mounted) {
          return;
        }
        setConnected(true);
        setGame(serverGame);
        saveGame(serverGame);
      })
      .catch(() => setConnected(false));

    const unsubscribe = subscribeToGame((nextGame) => setGame(nextGame));
    const clock = window.setInterval(() => setClockTick((tick) => tick + 1), 1000);
    return () => {
      mounted = false;
      window.clearInterval(clock);
      unsubscribe();
    };
  }, []);

  function commit(nextGame: CommanderGame) {
    const stamped = { ...nextGame, updatedAt: Date.now() };
    setGame(stamped);
    saveGame(stamped);
    void pushServerGame(stamped)
      .then((serverGame) => {
        setConnected(true);
        setGame(serverGame);
        saveGame(serverGame);
      })
      .catch(() => setConnected(false));
  }

  function patchPlayer(playerId: string, patch: Partial<CommanderPlayer>) {
    commit(
      updateGame(game, (draft) => ({
        ...draft,
        players: draft.players.map((player) =>
          player.id === playerId ? { ...player, ...patch } : player
        )
      }))
    );
  }

  function setActivePlayer(playerId: string) {
    commit({ ...game, activePlayerId: playerId, turnSeconds: 0, timerStartedAt: game.timerStartedAt ? Date.now() : null });
  }

  function adjustLife(playerId: string, amount: number) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return;
    }
    patchPlayer(playerId, { life: player.life + amount });
  }

  function adjustPoison(playerId: string, amount: number) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return;
    }
    patchPlayer(playerId, { poison: Math.max(0, player.poison + amount) });
  }

  function adjustCommanderDamage(playerId: string, sourceId: string, amount: number) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return;
    }
    patchPlayer(playerId, {
      commanderDamage: {
        ...player.commanderDamage,
        [sourceId]: Math.max(0, (player.commanderDamage[sourceId] ?? 0) + amount)
      }
    });
  }

  function adjustPlayerCounter(
    playerId: string,
    key: "experience" | "energy" | "treasure",
    amount: number
  ) {
    const player = game.players.find((candidate) => candidate.id === playerId);
    if (!player) {
      return;
    }
    patchPlayer(playerId, { [key]: Math.max(0, player[key] + amount) });
  }

  function togglePlayerStatus(
    playerId: string,
    key: "isMonarch" | "hasInitiative" | "hasCityBlessing"
  ) {
    commit(
      updateGame(game, (draft) => ({
        ...draft,
        players: draft.players.map((player) => {
          if (key === "hasCityBlessing") {
            return player.id === playerId ? { ...player, hasCityBlessing: !player.hasCityBlessing } : player;
          }

          return {
            ...player,
            [key]: player.id === playerId ? !player[key] : false
          };
        })
      }))
    );
  }

  function cycleDayNight() {
    const next = game.dayNight === null ? "day" : game.dayNight === "day" ? "night" : null;
    commit({ ...game, dayNight: next });
  }

  function chooseRandomPlayer() {
    const player = game.players[Math.floor(Math.random() * game.players.length)];
    if (player) {
      commit({ ...game, randomPlayerId: player.id });
    }
  }

  function rollD20() {
    commit({ ...game, diceRoll: Math.floor(Math.random() * 20) + 1 });
  }

  function toggleTimer() {
    if (game.timerStartedAt) {
      const elapsed = Math.max(0, Math.floor((Date.now() - game.timerStartedAt) / 1000));
      commit({ ...game, turnSeconds: game.turnSeconds + elapsed, timerStartedAt: null });
      return;
    }

    commit({ ...game, timerStartedAt: Date.now() });
  }

  function resetLifeTotals() {
    commit(
      updateGame(game, (draft) => ({
        ...draft,
        players: draft.players.map((player) => ({
          ...player,
          life: draft.startingLife,
          poison: 0,
          commanderDamage: {}
        }))
      }))
    );
  }

  const gridClass = useMemo(() => {
    if (game.players.length <= 2) {
      return "grid-cols-1 sm:grid-cols-2";
    }
    if (game.players.length === 3) {
      return "grid-cols-1 md:grid-cols-3";
    }
    return "grid-cols-1 sm:grid-cols-2";
  }, [game.players.length]);

  const timerSeconds = game.turnSeconds + (game.timerStartedAt ? Math.max(0, Math.floor((Date.now() - game.timerStartedAt) / 1000)) : 0);
  const displayUrl = useMemo(() => {
    const token = gameAccess.displayToken ?? gameAccess.controlToken;
    if (!gameAccess.gameId || !token) {
      return "/display";
    }

    return `/display?gameId=${encodeURIComponent(gameAccess.gameId)}&token=${encodeURIComponent(token)}`;
  }, [gameAccess.controlToken, gameAccess.displayToken, gameAccess.gameId]);

  const controlUrl = useMemo(() => {
    const access = gameAccess.gameId ? gameAccess : getCurrentGameAccess();
    if (!access.gameId || !access.controlToken) {
      return "/control";
    }

    return `/control?gameId=${encodeURIComponent(access.gameId)}&token=${encodeURIComponent(access.controlToken)}`;
  }, [gameAccess]);

  return (
    <main className="fixed-screen flex flex-col overflow-hidden bg-black text-foreground">
      <header className="z-30 flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/85 px-2 py-1.5 backdrop-blur sm:min-h-14 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", connected ? "bg-emerald-400" : "bg-destructive")} />
          <span className="truncate text-xs font-black uppercase tracking-wider sm:text-sm">
            {game.dayNight ? game.dayNight : "Tablet"} {game.diceRoll ? ` d20:${game.diceRoll}` : ""} {timerSeconds ? ` ${formatDuration(timerSeconds)}` : ""}
          </span>
        </div>
        <div className="flex shrink-0 gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href={displayUrl} aria-label="Open TV display">
              <Monitor className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href={controlUrl} aria-label="Open setup controls">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      <TabletControlBar
        game={game}
        timerSeconds={timerSeconds}
        onResetLifeTotals={resetLifeTotals}
        onCycleDayNight={cycleDayNight}
        onChooseRandomPlayer={chooseRandomPlayer}
        onRollD20={rollD20}
        onToggleTimer={toggleTimer}
        onSetActivePlayer={setActivePlayer}
      />

      <div className="min-h-0 flex-1 p-1">
        <section className={cn("grid h-full min-h-0 auto-rows-fr gap-1", gridClass)}>
          {game.players.map((player) => (
            <TabletPlayerPanel
              key={player.id}
              player={player}
              players={game.players}
              isActive={game.activePlayerId === player.id}
              isRandom={game.randomPlayerId === player.id}
              onName={(name) => patchPlayer(player.id, { name })}
              onCommanderName={(commanderName) => patchPlayer(player.id, { commanderName })}
              onLife={adjustLife}
              onPoison={adjustPoison}
              onCommanderDamage={adjustCommanderDamage}
              onCounter={adjustPlayerCounter}
              onStatus={togglePlayerStatus}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function TabletControlBar({
  game,
  timerSeconds,
  onResetLifeTotals,
  onCycleDayNight,
  onChooseRandomPlayer,
  onRollD20,
  onToggleTimer,
  onSetActivePlayer
}: {
  game: CommanderGame;
  timerSeconds: number;
  onResetLifeTotals: () => void;
  onCycleDayNight: () => void;
  onChooseRandomPlayer: () => void;
  onRollD20: () => void;
  onToggleTimer: () => void;
  onSetActivePlayer: (playerId: string) => void;
}) {
  return (
    <div className="shrink-0 border-b border-white/10 bg-black/75 px-1.5 py-1.5 backdrop-blur">
      <div className="flex items-center gap-1 overflow-x-auto">
        <Button variant="outline" size="sm" onClick={onResetLifeTotals} className="h-8 shrink-0 px-2 text-xs">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button variant={game.timerStartedAt ? "secondary" : "outline"} size="sm" onClick={onToggleTimer} className="h-8 shrink-0 px-2 text-xs">
          <Timer className="h-4 w-4" />
          {game.timerStartedAt ? "Pause" : timerSeconds ? formatDuration(timerSeconds) : "Timer"}
        </Button>
        <Button variant="outline" size="sm" onClick={onCycleDayNight} className="h-8 shrink-0 px-2 text-xs">
          {game.dayNight === "night" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {game.dayNight ?? "Day/Night"}
        </Button>
        <Button variant="outline" size="sm" onClick={onChooseRandomPlayer} className="h-8 shrink-0 px-2 text-xs">
          <Sparkles className="h-4 w-4" />
          Random
        </Button>
        <Button variant="outline" size="sm" onClick={onRollD20} className="h-8 shrink-0 px-2 text-xs">
          <Dices className="h-4 w-4" />
          d20 {game.diceRoll ? game.diceRoll : ""}
        </Button>
        <div className="flex shrink-0 gap-1 border-l border-white/10 pl-1">
          {game.players.map((player) => (
            <Button
              key={player.id}
              variant={game.activePlayerId === player.id ? "secondary" : "outline"}
              size="sm"
              className="h-8 min-w-11 px-2 text-xs"
              onClick={() => onSetActivePlayer(player.id)}
            >
              {shortName(player.name)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function shortName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    return "P";
  }
  const words = trimmed.split(/\s+/);
  if (words.length > 1 && words[0].toLowerCase() === "player") {
    return `P${words[1]?.slice(0, 1) ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 6);
}

function TabletPlayerPanel({
  player,
  players,
  isActive,
  isRandom,
  onName,
  onCommanderName,
  onLife,
  onPoison,
  onCommanderDamage,
  onCounter,
  onStatus
}: {
  player: CommanderPlayer;
  players: CommanderPlayer[];
  isActive: boolean;
  isRandom: boolean;
  onName: (name: string) => void;
  onCommanderName: (commanderName: string) => void;
  onLife: (playerId: string, amount: number) => void;
  onPoison: (playerId: string, amount: number) => void;
  onCommanderDamage: (playerId: string, sourceId: string, amount: number) => void;
  onCounter: (playerId: string, key: "experience" | "energy" | "treasure", amount: number) => void;
  onStatus: (playerId: string, key: "isMonarch" | "hasInitiative" | "hasCityBlessing") => void;
}) {
  const previousLife = useRef(player.life);
  const previousPoison = useRef(player.poison);
  const [lifeBurst, setLifeBurst] = useState<{ delta: number; key: number } | null>(null);
  const [poisonBurst, setPoisonBurst] = useState<{ delta: number; key: number } | null>(null);
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
    <article
      className={cn(
        "relative isolate flex min-h-0 overflow-hidden rounded-md border border-white/10 bg-zinc-950",
        lifeBurst && lifeBurst.delta > 0 && "life-gain-pulse",
        lifeBurst && lifeBurst.delta < 0 && "life-loss-pulse",
        poisonBurst && "poison-pulse"
      )}
      style={{
        backgroundImage: player.backgroundImage
          ? `linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.42)), url(${player.backgroundImage})`
          : "linear-gradient(135deg, rgba(20,83,72,0.55), rgba(120,53,15,0.4), rgba(9,9,11,1))",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <button
        type="button"
        className="absolute inset-y-0 left-0 z-10 w-1/2 bg-black/5 transition active:bg-destructive/35"
        onClick={() => onLife(player.id, -1)}
        aria-label={`Decrease ${player.name} life`}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-0 z-10 w-1/2 bg-black/5 transition active:bg-primary/30"
        onClick={() => onLife(player.id, 1)}
        aria-label={`Increase ${player.name} life`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      {eliminated ? <div className="absolute inset-0 bg-destructive/25" /> : null}
      {lifeBurst?.delta && lifeBurst.delta > 0 ? (
        <Star
          key={`star-${lifeBurst.key}`}
          className="star-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-28 w-28 fill-white text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] md:h-36 md:w-36"
        />
      ) : null}
      {lifeBurst?.delta && lifeBurst.delta < 0 ? (
        <Slash
          key={`slash-${lifeBurst.key}`}
          className="slash-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-36 w-36 text-destructive drop-shadow-[0_0_24px_rgba(220,38,38,0.9)] md:h-48 md:w-48"
          strokeWidth={4}
        />
      ) : null}
      {poisonBurst?.delta && poisonBurst.delta > 0 ? (
        <Skull
          key={`poison-${poisonBurst.key}`}
          className="skull-burst pointer-events-none absolute left-1/2 top-1/2 z-30 h-28 w-28 fill-emerald-500/25 text-emerald-300 drop-shadow-[0_0_26px_rgba(16,185,129,0.95)] md:h-36 md:w-36"
          strokeWidth={2.8}
        />
      ) : null}

      <div className="pointer-events-none relative z-20 flex w-full flex-col justify-between gap-1.5 p-2 screen-text-shadow sm:p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="pointer-events-auto grid min-w-0 flex-1 gap-1">
            <Input
              value={player.name}
              onChange={(event) => onName(event.target.value)}
              className="h-7 border-white/10 bg-black/45 px-2 text-sm font-black text-white shadow-none sm:h-8 sm:text-base"
              aria-label={`${player.name} name`}
            />
            <Input
              value={player.commanderName}
              onChange={(event) => onCommanderName(event.target.value)}
              className="h-7 border-white/10 bg-black/35 px-2 text-[11px] font-bold uppercase tracking-wider text-primary shadow-none placeholder:text-white/35 sm:h-8 sm:text-xs"
              placeholder={player.backgroundCardName || "Commander"}
              aria-label={`${player.name} commander`}
            />
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {isActive ? <Badge>Turn</Badge> : null}
            {isRandom ? <Badge>Pick</Badge> : null}
            {player.isMonarch ? <Badge>Monarch</Badge> : null}
            {player.hasInitiative ? <Badge>Init</Badge> : null}
            {player.hasCityBlessing ? <Badge>City</Badge> : null}
            {eliminated ? <Badge danger>Out</Badge> : null}
          </div>
        </div>

        <div className="flex min-h-0 items-center justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 sm:h-12 sm:w-12">
            <Minus className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="relative min-w-0 text-center text-[clamp(4.2rem,12vw,8rem)] font-black leading-none">
            {player.life}
            {lifeBurst ? (
              <span
                key={lifeBurst.key}
                className={cn(
                  "floating-delta absolute left-1/2 top-4 -translate-x-1/2 rounded-md bg-black/55 px-4 py-2 text-4xl backdrop-blur md:text-6xl",
                  lifeBurst.delta > 0 ? "text-primary" : "text-destructive"
                )}
              >
                {lifeBurst.delta > 0 ? "+" : ""}
                {lifeBurst.delta}
              </span>
            ) : null}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/45 sm:h-12 sm:w-12">
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-auto grid gap-1 rounded-md bg-black/45 p-1.5 backdrop-blur sm:gap-1.5 sm:p-2",
            poisonBurst && "poison-pulse"
          )}
        >
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onPoison(player.id, -1)}>-</Button>
            <div className="relative flex items-center justify-center gap-1 text-xs font-black sm:text-sm">
              <Skull className="h-4 w-4 text-emerald-300" />
              Poison {player.poison}
              {poisonBurst ? (
                <span
                  key={poisonBurst.key}
                  className="floating-delta absolute -top-10 left-1/2 -translate-x-1/2 rounded-md bg-emerald-500/85 px-2 py-1 text-sm text-white"
                >
                  {poisonBurst.delta > 0 ? "+" : ""}
                  {poisonBurst.delta}
                </span>
              ) : null}
            </div>
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onPoison(player.id, 1)}>+</Button>
          </div>

          <div className="grid max-h-24 gap-1 overflow-y-auto pr-1 sm:max-h-28">
            <div className="grid grid-cols-3 gap-1">
              <MiniCounter
                icon={<Trophy className="h-3.5 w-3.5" />}
                value={player.experience}
                onMinus={() => onCounter(player.id, "experience", -1)}
                onPlus={() => onCounter(player.id, "experience", 1)}
              />
              <MiniCounter
                icon={<Sparkles className="h-3.5 w-3.5" />}
                value={player.energy}
                onMinus={() => onCounter(player.id, "energy", -1)}
                onPlus={() => onCounter(player.id, "energy", 1)}
              />
              <MiniCounter
                icon={<Gem className="h-3.5 w-3.5" />}
                value={player.treasure}
                onMinus={() => onCounter(player.id, "treasure", -1)}
                onPlus={() => onCounter(player.id, "treasure", 1)}
              />
            </div>
            <div className="grid grid-cols-3 gap-1">
              <Button size="sm" className="h-7 px-1 text-xs" variant={player.isMonarch ? "secondary" : "ghost"} onClick={() => onStatus(player.id, "isMonarch")}>
                <Crown className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" className="h-7 px-1 text-xs" variant={player.hasInitiative ? "secondary" : "ghost"} onClick={() => onStatus(player.id, "hasInitiative")}>
                Init
              </Button>
              <Button size="sm" className="h-7 px-1 text-xs" variant={player.hasCityBlessing ? "secondary" : "ghost"} onClick={() => onStatus(player.id, "hasCityBlessing")}>
                City
              </Button>
            </div>
            {players
              .filter((source) => source.id !== player.id)
              .map((source) => (
                <div key={source.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-1 text-xs">
                  <span className="truncate font-semibold">{source.name}</span>
                  <span className="w-7 text-center text-sm font-black">{player.commanderDamage[source.id] ?? 0}</span>
                  <Button size="sm" className="h-7 px-2" variant="ghost" onClick={() => onCommanderDamage(player.id, source.id, -1)}>-</Button>
                  <Button size="sm" className="h-7 px-2" variant="ghost" onClick={() => onCommanderDamage(player.id, source.id, 1)}>+</Button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function Badge({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase sm:px-2 sm:py-1 sm:text-[10px]", danger ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}>
      {children}
    </span>
  );
}

function MiniCounter({
  icon,
  value,
  onMinus,
  onPlus
}: {
  icon: React.ReactNode;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1 rounded-md bg-black/35 px-1 py-0.5 text-xs">
      <button type="button" onClick={onMinus} className="rounded px-1">-</button>
      <span className="flex items-center justify-center gap-1 font-black">
        {icon}
        {value}
      </span>
      <button type="button" onClick={onPlus} className="rounded px-1">+</button>
    </div>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}
