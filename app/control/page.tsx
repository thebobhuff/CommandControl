"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Dices,
  Gem,
  LogIn,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Skull,
  Sparkles,
  Sun,
  Tablet,
  TabletSmartphone,
  Timer,
  Trash2,
  Trophy,
  UserPlus
} from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { GlowingBorder } from "@/components/aceternity/glowing-border";
import { ScryfallPicker } from "@/components/scryfall-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createDefaultGame,
  createId,
  createSavedGame,
  fetchServerGame,
  getCurrentGameAccess,
  getCurrentGameId,
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

export default function ControlPage() {
  const [game, setGame] = useState<CommanderGame>(() => loadGame());
  const [serverStatus, setServerStatus] = useState("Local state loaded");
  const [savedGameId, setSavedGameId] = useState<string | null>(null);
  const [gameAccess, setGameAccess] = useState<GameAccess>(() => ({
    gameId: null,
    displayToken: null,
    controlToken: null
  }));

  useEffect(() => {
    let mounted = true;
    const access = hydrateGameAccessFromUrl();
    setGameAccess(access);
    setSavedGameId(access.gameId ?? getCurrentGameId());
    void fetchServerGame()
      .then((serverGame) => {
        if (!mounted) {
          return;
        }
        setGame(serverGame);
        saveGame(serverGame);
        setServerStatus("Connected to game server");
      })
      .catch(() => setServerStatus("Using local state until the server responds"));

    const unsubscribe = subscribeToGame((nextGame) => setGame(nextGame));
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  function commit(nextGame: CommanderGame) {
    const stamped = { ...nextGame, updatedAt: Date.now() };
    setGame(stamped);
    saveGame(stamped);
    void pushServerGame(stamped)
      .then((serverGame) => {
        setGame(serverGame);
        saveGame(serverGame);
        setServerStatus("Synced");
      })
      .catch(() => setServerStatus("Not synced. Check that the Next server is running."));
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

  function addPlayer() {
    const id = createId();
    commit(
      updateGame(game, (draft) => ({
        ...draft,
        players: [
          ...draft.players,
          {
            id,
            name: `Player ${draft.players.length + 1}`,
            commanderName: "",
            partnerCommanderName: "",
            life: draft.startingLife,
            poison: 0,
            experience: 0,
            energy: 0,
            treasure: 0,
            isMonarch: false,
            hasInitiative: false,
            hasCityBlessing: false,
            commanderDamage: {},
            backgroundImage: ""
          }
        ]
      }))
    );
  }

  function removePlayer(playerId: string) {
    if (game.players.length <= 2) {
      return;
    }
    commit(
      updateGame(game, (draft) => ({
        ...draft,
        players: draft.players.filter((player) => player.id !== playerId)
      }))
    );
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

  function newGame() {
    commit(createDefaultGame());
  }

  function cycleDayNight() {
    const next = game.dayNight === null ? "day" : game.dayNight === "day" ? "night" : null;
    commit({ ...game, dayNight: next });
  }

  function chooseRandomPlayer() {
    const player = game.players[Math.floor(Math.random() * game.players.length)];
    if (!player) {
      return;
    }
    commit({ ...game, randomPlayerId: player.id });
  }

  function rollD20() {
    commit({ ...game, diceRoll: Math.floor(Math.random() * 20) + 1 });
  }

  function setActivePlayer(playerId: string) {
    commit({
      ...game,
      activePlayerId: playerId,
      turnSeconds: 0,
      timerStartedAt: game.timerStartedAt ? Date.now() : null
    });
  }

  function toggleTimer() {
    if (game.timerStartedAt) {
      const elapsed = Math.max(0, Math.floor((Date.now() - game.timerStartedAt) / 1000));
      commit({
        ...game,
        turnSeconds: game.turnSeconds + elapsed,
        timerStartedAt: null
      });
      return;
    }

    commit({ ...game, timerStartedAt: Date.now() });
  }

  function resetTimer() {
    commit({ ...game, turnSeconds: 0, timerStartedAt: game.timerStartedAt ? Date.now() : null });
  }

  async function saveCurrentGame() {
    try {
      const name = game.players.map((player) => player.name).join(" vs ").slice(0, 80) || "Commander Game";
      const saved = await createSavedGame(game, name);
      setSavedGameId(saved.id);
      setGameAccess(getCurrentGameAccess());
      setServerStatus("Saved to Supabase");
    } catch {
      setServerStatus("Login required to save games");
    }
  }

  const displayUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/display";
    }
    const token = gameAccess.displayToken ?? gameAccess.controlToken;
    if (!gameAccess.gameId || !token) {
      return `${window.location.origin}/display`;
    }

    return `${window.location.origin}/display?gameId=${encodeURIComponent(gameAccess.gameId)}&token=${encodeURIComponent(token)}`;
  }, [gameAccess.controlToken, gameAccess.displayToken, gameAccess.gameId]);

  const tabletUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "/tablet";
    }
    if (!gameAccess.gameId || !gameAccess.controlToken) {
      return `${window.location.origin}/tablet`;
    }

    return `${window.location.origin}/tablet?gameId=${encodeURIComponent(gameAccess.gameId)}&token=${encodeURIComponent(gameAccess.controlToken)}`;
  }, [gameAccess.controlToken, gameAccess.gameId]);

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <div className="relative z-10 mx-auto flex w-full max-w-[112rem] flex-col gap-2 px-2 py-2 sm:px-3 lg:flex-row">
        <aside className="lg:sticky lg:top-2 lg:h-[calc(100vh-1rem)] lg:w-64 lg:shrink-0 xl:w-72">
          <ControlSidebar
            game={game}
            serverStatus={serverStatus}
            savedGameId={savedGameId}
            displayUrl={displayUrl}
            tabletUrl={tabletUrl}
            onResetLifeTotals={resetLifeTotals}
            onSaveCurrentGame={() => void saveCurrentGame()}
            onNewGame={newGame}
            onAddPlayer={addPlayer}
            onStartingLife={(startingLife) => commit({ ...game, startingLife })}
            onCycleDayNight={cycleDayNight}
            onChooseRandomPlayer={chooseRandomPlayer}
            onRollD20={rollD20}
            onToggleTimer={toggleTimer}
            onSetActivePlayer={setActivePlayer}
            onResetTimer={resetTimer}
          />
        </aside>

        <section className="grid min-w-0 flex-1 gap-2">
          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
            {game.players.map((player) => (
              <GlowingBorder key={player.id} className="min-w-0">
                <PlayerControl
                  player={player}
                  players={game.players}
                  onName={(name) => patchPlayer(player.id, { name })}
                  onImage={(backgroundImage, backgroundCardName) =>
                    patchPlayer(player.id, { backgroundImage, backgroundCardName })
                  }
                  onManualImage={(backgroundImage) => patchPlayer(player.id, { backgroundImage })}
                  onLife={adjustLife}
                  onPoison={adjustPoison}
                  onCommanderDamage={adjustCommanderDamage}
                  onCounter={adjustPlayerCounter}
                  onStatus={togglePlayerStatus}
                  onCommanderName={(commanderName) => patchPlayer(player.id, { commanderName })}
                  onPartnerCommanderName={(partnerCommanderName) => patchPlayer(player.id, { partnerCommanderName })}
                  onRemove={() => removePlayer(player.id)}
                  canRemove={game.players.length > 2}
                />
              </GlowingBorder>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function ControlSidebar({
  game,
  serverStatus,
  savedGameId,
  displayUrl,
  tabletUrl,
  onResetLifeTotals,
  onSaveCurrentGame,
  onNewGame,
  onAddPlayer,
  onStartingLife,
  onCycleDayNight,
  onChooseRandomPlayer,
  onRollD20,
  onToggleTimer,
  onSetActivePlayer,
  onResetTimer
}: {
  game: CommanderGame;
  serverStatus: string;
  savedGameId: string | null;
  displayUrl: string;
  tabletUrl: string;
  onResetLifeTotals: () => void;
  onSaveCurrentGame: () => void;
  onNewGame: () => void;
  onAddPlayer: () => void;
  onStartingLife: (startingLife: number) => void;
  onCycleDayNight: () => void;
  onChooseRandomPlayer: () => void;
  onRollD20: () => void;
  onToggleTimer: () => void;
  onSetActivePlayer: (playerId: string) => void;
  onResetTimer: () => void;
}) {
  return (
    <div className="flex max-h-full flex-col gap-3 overflow-y-auto rounded-lg border border-border bg-background/85 p-3 backdrop-blur">
      <div className="flex items-start gap-3">
        <TabletSmartphone className="mt-1 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <div className="text-sm font-black uppercase tracking-wider">Control</div>
          <div className="mt-1 text-xs text-muted-foreground">{serverStatus}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={onResetLifeTotals} className="justify-start">
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button size="sm" variant="outline" onClick={onSaveCurrentGame} className="justify-start">
          <Save className="h-4 w-4" />
          {savedGameId ? "Saved" : "Save"}
        </Button>
        <Button asChild size="sm" variant="secondary" className="justify-start">
          <Link href={tabletUrl}>
            <Tablet className="h-4 w-4" />
            Tablet
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="justify-start">
          <Link href={displayUrl} target="_blank">
            <Monitor className="h-4 w-4" />
            TV
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onNewGame} className="justify-start">
          <Skull className="h-4 w-4" />
          New
        </Button>
        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link href="/games">
            <Save className="h-4 w-4" />
            Games
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="justify-start">
          <Link href="/login">
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </Button>
        <Button onClick={onAddPlayer} size="sm" className="justify-start">
          <UserPlus className="h-4 w-4" />
          Player
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor="starting-life">Starting life</Label>
        <Input
          id="starting-life"
          type="number"
          inputMode="numeric"
          value={game.startingLife}
          onChange={(event) => onStartingLife(Number(event.target.value || 40))}
        />
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-muted/30 p-2">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={onCycleDayNight}>
            {game.dayNight === "night" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            {game.dayNight ?? "Day/Night"}
          </Button>
          <Button variant="outline" size="sm" onClick={onChooseRandomPlayer}>
            <Sparkles className="h-4 w-4" />
            Random
          </Button>
          <Button variant="outline" size="sm" onClick={onRollD20}>
            <Dices className="h-4 w-4" />
            d20 {game.diceRoll ? game.diceRoll : ""}
          </Button>
          <Button variant={game.timerStartedAt ? "secondary" : "outline"} size="sm" onClick={onToggleTimer}>
            <Timer className="h-4 w-4" />
            {game.timerStartedAt ? "Pause" : "Timer"}
          </Button>
        </div>

        <div className="grid gap-2">
          <div className="flex flex-wrap gap-1">
            {game.players.map((player) => (
              <Button
                key={player.id}
                size="sm"
                variant={game.activePlayerId === player.id ? "secondary" : "outline"}
                onClick={() => onSetActivePlayer(player.id)}
              >
                {player.name}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={onResetTimer}>
            Reset timer
          </Button>
        </div>
      </div>

      <details className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">TV URL</summary>
        <div className="mt-1 break-all font-mono text-xs text-foreground">{displayUrl}</div>
      </details>
      <details className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-semibold text-foreground">Tablet URL</summary>
        <div className="mt-1 break-all font-mono text-xs text-foreground">{tabletUrl}</div>
      </details>
    </div>
  );
}

function PlayerControl({
  player,
  players,
  onName,
  onImage,
  onManualImage,
  onLife,
  onPoison,
  onCommanderDamage,
  onCounter,
  onStatus,
  onCommanderName,
  onPartnerCommanderName,
  onRemove,
  canRemove
}: {
  player: CommanderPlayer;
  players: CommanderPlayer[];
  onName: (name: string) => void;
  onImage: (imageUrl: string, cardName: string) => void;
  onManualImage: (imageUrl: string) => void;
  onLife: (playerId: string, amount: number) => void;
  onPoison: (playerId: string, amount: number) => void;
  onCommanderDamage: (playerId: string, sourceId: string, amount: number) => void;
  onCounter: (playerId: string, key: "experience" | "energy" | "treasure", amount: number) => void;
  onStatus: (playerId: string, key: "isMonarch" | "hasInitiative" | "hasCityBlessing") => void;
  onCommanderName: (name: string) => void;
  onPartnerCommanderName: (name: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-1.5 rounded-md bg-card p-2">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5">
        <div
          className="h-9 w-9 shrink-0 rounded-md border border-border bg-muted bg-cover bg-center"
          style={{ backgroundImage: player.backgroundImage ? `url(${player.backgroundImage})` : undefined }}
        />
        <div className="min-w-0">
          <Input
            id={`${player.id}-name`}
            value={player.name}
            onChange={(event) => onName(event.target.value)}
            className="h-8 px-2 text-xs font-semibold"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove} disabled={!canRemove} aria-label="Remove player">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-[auto_1fr] items-center gap-1.5">
        <div className="min-w-14 text-center text-4xl font-black leading-none">{player.life}</div>
        <div className="grid grid-cols-3 gap-1">
          <Button size="sm" variant="destructive" className="h-7 px-1 text-xs" onClick={() => onLife(player.id, -10)}>-10</Button>
          <Button size="sm" variant="outline" className="h-7 px-1 text-xs" onClick={() => onLife(player.id, -5)}>-5</Button>
          <Button size="sm" variant="outline" className="h-7 px-1 text-xs" onClick={() => onLife(player.id, -1)}>-1</Button>
          <Button size="sm" variant="outline" className="h-7 px-1 text-xs" onClick={() => onLife(player.id, 1)}>+1</Button>
          <Button size="sm" variant="outline" className="h-7 px-1 text-xs" onClick={() => onLife(player.id, 5)}>+5</Button>
          <Button size="sm" className="h-7 px-1 text-xs" onClick={() => onLife(player.id, 10)}>+10</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1 rounded-md bg-muted/30 px-1 py-1">
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-xs" onClick={() => onPoison(player.id, -1)}>-</Button>
          <div className="flex items-center justify-center gap-1 text-xs font-black">
            <Skull className="h-3.5 w-3.5 text-emerald-300" />
            {player.poison}
          </div>
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-xs" onClick={() => onPoison(player.id, 1)}>+</Button>
        </div>
        <CompactCounter
          icon={<Trophy className="h-3.5 w-3.5 text-primary" />}
          value={player.experience}
          onMinus={() => onCounter(player.id, "experience", -1)}
          onPlus={() => onCounter(player.id, "experience", 1)}
        />
        <CompactCounter
          icon={<Sparkles className="h-3.5 w-3.5 text-sky-300" />}
          value={player.energy}
          onMinus={() => onCounter(player.id, "energy", -1)}
          onPlus={() => onCounter(player.id, "energy", 1)}
        />
        <CompactCounter
          icon={<Gem className="h-3.5 w-3.5 text-amber-300" />}
          value={player.treasure}
          onMinus={() => onCounter(player.id, "treasure", -1)}
          onPlus={() => onCounter(player.id, "treasure", 1)}
        />
      </div>

      <div className="grid grid-cols-3 gap-1">
        <Button size="sm" className="h-7 px-1 text-xs" variant={player.isMonarch ? "secondary" : "outline"} onClick={() => onStatus(player.id, "isMonarch")}>
          <Crown className="h-4 w-4" />
        </Button>
        <Button size="sm" className="h-7 px-1 text-xs" variant={player.hasInitiative ? "secondary" : "outline"} onClick={() => onStatus(player.id, "hasInitiative")}>
          Init
        </Button>
        <Button size="sm" className="h-7 px-1 text-xs" variant={player.hasCityBlessing ? "secondary" : "outline"} onClick={() => onStatus(player.id, "hasCityBlessing")}>
          City
        </Button>
      </div>

      <details className="rounded-md border border-border bg-muted/30 px-2 py-1">
        <summary className="cursor-pointer text-xs font-semibold">Commander cards</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`${player.id}-commander`}>Commander</Label>
            <Input
              id={`${player.id}-commander`}
              value={player.commanderName}
              onChange={(event) => onCommanderName(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${player.id}-partner`}>Partner/background</Label>
            <Input
              id={`${player.id}-partner`}
              value={player.partnerCommanderName}
              onChange={(event) => onPartnerCommanderName(event.target.value)}
            />
          </div>
        </div>
      </details>

      <details className="rounded-md border border-border bg-muted/30 px-2 py-1">
        <summary className="cursor-pointer text-xs font-semibold">Commander damage</summary>
        <div className="mt-2 grid gap-1">
          {players
            .filter((source) => source.id !== player.id)
            .map((source) => (
              <div key={source.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-1 rounded-md bg-muted/50 px-2 py-1">
                <span className="truncate text-xs">{source.name}</span>
                <span className="w-7 text-center text-sm font-black">{player.commanderDamage[source.id] ?? 0}</span>
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 px-2 text-xs" variant="outline" onClick={() => onCommanderDamage(player.id, source.id, -1)}>-</Button>
                  <Button size="sm" className="h-7 px-2 text-xs" variant="outline" onClick={() => onCommanderDamage(player.id, source.id, 1)}>+</Button>
                </div>
              </div>
            ))}
        </div>
      </details>

      <details className="rounded-md border border-border bg-muted/30 px-2 py-1">
        <summary className="cursor-pointer text-xs font-semibold">Background art</summary>
        <div className="mt-2 space-y-2">
          <Label htmlFor={`${player.id}-image`}>Background image URL</Label>
          <Input
            id={`${player.id}-image`}
            value={player.backgroundImage}
            onChange={(event) => onManualImage(event.target.value)}
            placeholder="https://..."
          />
          <ScryfallPicker onSelect={onImage} />
        </div>
      </details>
    </div>
  );
}

function CompactCounter({
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
    <div className="grid grid-cols-[auto_1fr_auto] items-center rounded-md bg-muted/30 px-1 py-1 text-xs">
      <button type="button" onClick={onMinus} className="rounded px-1 font-black">-</button>
      <span className="flex min-w-0 items-center justify-center gap-1 font-black">
        {icon}
        {value}
      </span>
      <button type="button" onClick={onPlus} className="rounded px-1 font-black">+</button>
    </div>
  );
}
