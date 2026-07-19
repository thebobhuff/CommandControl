"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Crown,
  Copy,
  Dices,
  Gem,
  LogIn,
  Monitor,
  Moon,
  QrCode,
  RotateCcw,
  Save,
  ScrollText,
  ShieldAlert,
  Skull,
  Sparkles,
  Sun,
  Shuffle,
  Tablet,
  TabletSmartphone,
  Timer,
  Trash2,
  Trophy,
  UserPlus,
  Wrench
} from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { GlowingBorder } from "@/components/aceternity/glowing-border";
import { ScryfallPicker } from "@/components/scryfall-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  type CommanderPlayer,
  type VariantDeckCard
} from "@/lib/game-state";

type SavedPlayerProfile = {
  id: string;
  display_name: string;
  favorite_commander: string | null;
  background_image: string | null;
  moxfield_deck_url: string | null;
};

export default function ControlPage() {
  const [game, setGame] = useState<CommanderGame>(() => loadGame());
  const [serverStatus, setServerStatus] = useState("Local state loaded");
  const [savedGameId, setSavedGameId] = useState<string | null>(null);
  const [setupPlayerId, setSetupPlayerId] = useState<string | null>(null);
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayerProfile[]>([]);
  const [variantDeckStatus, setVariantDeckStatus] = useState("");
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

    void fetch("/api/players", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { players: [] }))
      .then((result: { players?: SavedPlayerProfile[] }) => {
        if (mounted) {
          setSavedPlayers(result.players ?? []);
        }
      })
      .catch(() => {
        if (mounted) {
          setSavedPlayers([]);
        }
      });

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

  function assignSavedPlayer(playerId: string, savedPlayerId: string) {
    const savedPlayer = savedPlayers.find((candidate) => candidate.id === savedPlayerId);
    if (!savedPlayer) {
      return;
    }

    patchPlayer(playerId, {
      name: savedPlayer.display_name,
      commanderName: savedPlayer.favorite_commander ?? "",
      backgroundImage: savedPlayer.background_image ?? "",
      backgroundCardName: savedPlayer.favorite_commander ?? "",
      moxfieldDeckUrl: savedPlayer.moxfield_deck_url ?? ""
    });
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
            backgroundImage: "",
            moxfieldDeckUrl: ""
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

  function setWinner(playerId: string) {
    commit({
      ...game,
      winnerPlayerId: game.winnerPlayerId === playerId ? null : playerId,
      timerStartedAt: null
    });
  }

  function setActivePlayer(playerId: string) {
    commit({
      ...game,
      activePlayerId: playerId,
      turnSeconds: 0,
      timerStartedAt: game.timerStartedAt ? Date.now() : null
    });
  }

  function toggleArchenemyMode() {
    commit({
      ...game,
      archenemyMode: !game.archenemyMode,
      archenemyPlayerId: !game.archenemyMode ? game.archenemyPlayerId ?? game.players[0]?.id ?? null : null,
      archenemyScheme: !game.archenemyMode ? game.archenemyScheme : "",
      archenemySchemeCount: !game.archenemyMode ? game.archenemySchemeCount : 0
    });
  }

  function setArchenemyPlayer(playerId: string) {
    commit({
      ...game,
      archenemyMode: true,
      archenemyPlayerId: playerId
    });
  }

  function setArchenemyScheme(archenemyScheme: string) {
    commit({
      ...game,
      archenemyMode: true,
      archenemyPlayerId: game.archenemyPlayerId ?? game.players[0]?.id ?? null,
      archenemyScheme
    });
  }

  function adjustArchenemySchemeCount(amount: number) {
    commit({
      ...game,
      archenemyMode: true,
      archenemyPlayerId: game.archenemyPlayerId ?? game.players[0]?.id ?? null,
      archenemySchemeCount: Math.max(0, game.archenemySchemeCount + amount)
    });
  }

  async function loadArchenemyDeck() {
    setVariantDeckStatus("Loading schemes from Scryfall...");
    try {
      const cards = shuffleDeck(await fetchVariantCards("type:scheme"));
      commit({
        ...game,
        archenemyMode: true,
        archenemyPlayerId: game.archenemyPlayerId ?? game.players[0]?.id ?? null,
        archenemyDeck: cards,
        archenemyDiscard: [],
        archenemyCurrentScheme: null,
        archenemyScheme: "",
        archenemySchemeCount: 0
      });
      setVariantDeckStatus(`Loaded ${cards.length} schemes`);
    } catch {
      setVariantDeckStatus("Unable to load schemes from Scryfall");
    }
  }

  function setSchemeInMotion() {
    const next = drawVariantCard(game.archenemyDeck, game.archenemyDiscard);
    if (!next.card) {
      setVariantDeckStatus("Load a scheme deck first");
      return;
    }

    commit({
      ...game,
      archenemyMode: true,
      archenemyPlayerId: game.archenemyPlayerId ?? game.players[0]?.id ?? null,
      archenemyDeck: next.deck,
      archenemyDiscard: game.archenemyCurrentScheme ? [game.archenemyCurrentScheme, ...next.discard] : next.discard,
      archenemyCurrentScheme: next.card,
      archenemyScheme: next.card.name,
      archenemySchemeCount: game.archenemySchemeCount + 1
    });
  }

  function abandonCurrentScheme() {
    if (!game.archenemyCurrentScheme) {
      return;
    }

    commit({
      ...game,
      archenemyCurrentScheme: null,
      archenemyScheme: "",
      archenemyDiscard: [game.archenemyCurrentScheme, ...game.archenemyDiscard]
    });
  }

  function reshuffleArchenemyDeck() {
    const cards = [
      ...game.archenemyDeck,
      ...game.archenemyDiscard,
      ...(game.archenemyCurrentScheme ? [game.archenemyCurrentScheme] : [])
    ];
    commit({
      ...game,
      archenemyDeck: shuffleDeck(cards),
      archenemyDiscard: [],
      archenemyCurrentScheme: null,
      archenemyScheme: ""
    });
  }

  function togglePlanechaseMode() {
    commit({
      ...game,
      planechaseMode: !game.planechaseMode,
      planarDieRoll: null
    });
  }

  async function loadPlanarDeck() {
    setVariantDeckStatus("Loading planes from Scryfall...");
    try {
      const cards = shuffleDeck(await fetchVariantCards("(type:plane OR type:phenomenon)"));
      commit({
        ...game,
        planechaseMode: true,
        planarDeck: cards,
        planarDiscard: [],
        currentPlane: null,
        planarDieRoll: null
      });
      setVariantDeckStatus(`Loaded ${cards.length} planar cards`);
    } catch {
      setVariantDeckStatus("Unable to load planar cards from Scryfall");
    }
  }

  function planeswalk(nextDieRoll: CommanderGame["planarDieRoll"] = null) {
    const next = drawVariantCard(game.planarDeck, game.planarDiscard);
    if (!next.card) {
      setVariantDeckStatus("Load a planar deck first");
      return;
    }

    commit({
      ...game,
      planechaseMode: true,
      planarDeck: next.deck,
      planarDiscard: game.currentPlane ? [game.currentPlane, ...next.discard] : next.discard,
      currentPlane: next.card,
      planarDieRoll: nextDieRoll
    });
  }

  function rollPlanarDie() {
    const roll = Math.floor(Math.random() * 6) + 1;
    if (roll === 1) {
      planeswalk("planeswalk");
      return;
    }

    commit({
      ...game,
      planechaseMode: true,
      planarDieRoll: roll === 6 ? "chaos" : "blank"
    });
  }

  function reshufflePlanarDeck() {
    const cards = [
      ...game.planarDeck,
      ...game.planarDiscard,
      ...(game.currentPlane ? [game.currentPlane] : [])
    ];
    commit({
      ...game,
      planarDeck: shuffleDeck(cards),
      planarDiscard: [],
      currentPlane: null,
      planarDieRoll: null
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
            variantDeckStatus={variantDeckStatus}
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
            onToggleDisplayQr={() => commit({ ...game, showDisplayQr: !game.showDisplayQr })}
            onToggleArchenemyMode={toggleArchenemyMode}
            onSetArchenemyPlayer={setArchenemyPlayer}
            onArchenemyScheme={setArchenemyScheme}
            onArchenemySchemeCount={adjustArchenemySchemeCount}
            onLoadArchenemyDeck={() => void loadArchenemyDeck()}
            onSetSchemeInMotion={setSchemeInMotion}
            onAbandonCurrentScheme={abandonCurrentScheme}
            onReshuffleArchenemyDeck={reshuffleArchenemyDeck}
            onTogglePlanechaseMode={togglePlanechaseMode}
            onLoadPlanarDeck={() => void loadPlanarDeck()}
            onPlaneswalk={() => planeswalk()}
            onRollPlanarDie={rollPlanarDie}
            onReshufflePlanarDeck={reshufflePlanarDeck}
          />
        </aside>

        <section className="grid min-w-0 flex-1 gap-2">
          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-4">
            {game.players.map((player) => (
              <GlowingBorder key={player.id} className="min-w-0 self-start">
                <PlayerControl
                  player={player}
                  players={game.players}
                  savedPlayers={savedPlayers}
                  isArchenemy={game.archenemyMode && game.archenemyPlayerId === player.id}
                  isWinner={game.winnerPlayerId === player.id}
                  setupOpen={setupPlayerId === player.id}
                  onToggleSetup={() => setSetupPlayerId((current) => (current === player.id ? null : player.id))}
                  onAssignSavedPlayer={(savedPlayerId) => assignSavedPlayer(player.id, savedPlayerId)}
                  onName={(name) => patchPlayer(player.id, { name })}
                  onCommanderName={(commanderName) => patchPlayer(player.id, { commanderName })}
                  onPartnerCommanderName={(partnerCommanderName) => patchPlayer(player.id, { partnerCommanderName })}
                  onMoxfieldDeckUrl={(moxfieldDeckUrl) => patchPlayer(player.id, { moxfieldDeckUrl })}
                  onBackgroundImage={(backgroundImage) => patchPlayer(player.id, { backgroundImage })}
                  onSelectCommanderArt={(imageUrl, cardName) =>
                    patchPlayer(player.id, {
                      backgroundImage: imageUrl,
                      backgroundCardName: cardName,
                      commanderName: player.commanderName || cardName
                    })
                  }
                  onClearCommanderArt={() => patchPlayer(player.id, { backgroundImage: "", backgroundCardName: "" })}
                  onLife={adjustLife}
                  onPoison={adjustPoison}
                  onCommanderDamage={adjustCommanderDamage}
                  onCounter={adjustPlayerCounter}
                  onStatus={togglePlayerStatus}
                  onWinner={() => setWinner(player.id)}
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
  variantDeckStatus,
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
  onResetTimer,
  onToggleDisplayQr,
  onToggleArchenemyMode,
  onSetArchenemyPlayer,
  onArchenemyScheme,
  onArchenemySchemeCount,
  onLoadArchenemyDeck,
  onSetSchemeInMotion,
  onAbandonCurrentScheme,
  onReshuffleArchenemyDeck,
  onTogglePlanechaseMode,
  onLoadPlanarDeck,
  onPlaneswalk,
  onRollPlanarDie,
  onReshufflePlanarDeck
}: {
  game: CommanderGame;
  serverStatus: string;
  variantDeckStatus: string;
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
  onToggleDisplayQr: () => void;
  onToggleArchenemyMode: () => void;
  onSetArchenemyPlayer: (playerId: string) => void;
  onArchenemyScheme: (scheme: string) => void;
  onArchenemySchemeCount: (amount: number) => void;
  onLoadArchenemyDeck: () => void;
  onSetSchemeInMotion: () => void;
  onAbandonCurrentScheme: () => void;
  onReshuffleArchenemyDeck: () => void;
  onTogglePlanechaseMode: () => void;
  onLoadPlanarDeck: () => void;
  onPlaneswalk: () => void;
  onRollPlanarDie: () => void;
  onReshufflePlanarDeck: () => void;
}) {
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  async function copyShareLink() {
    await navigator.clipboard.writeText(displayUrl);
    setCopiedShareLink(true);
    window.setTimeout(() => setCopiedShareLink(false), 1800);
  }

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
        <Button variant={game.archenemyMode ? "secondary" : "outline"} size="sm" onClick={onToggleArchenemyMode} className="justify-start">
          <ShieldAlert className="h-4 w-4" />
          Archenemy
        </Button>
        {game.archenemyMode ? (
          <>
            <div className="grid gap-1">
              <Label htmlFor="archenemy-player" className="text-xs">
                Archenemy player
              </Label>
              <select
                id="archenemy-player"
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={game.archenemyPlayerId ?? ""}
                onChange={(event) => onSetArchenemyPlayer(event.target.value)}
              >
                {game.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1">
              <Label htmlFor="archenemy-scheme" className="text-xs">
                Current scheme
              </Label>
              <Input
                id="archenemy-scheme"
                value={game.archenemyScheme}
                onChange={(event) => onArchenemyScheme(event.target.value)}
                className="h-8 px-2 text-xs"
                placeholder="Scheme set in motion"
              />
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1 rounded-md bg-background/60 p-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onArchenemySchemeCount(-1)}>
                -
              </Button>
              <div className="flex min-w-0 items-center justify-center gap-1 text-xs font-black">
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                Schemes {game.archenemySchemeCount}
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onArchenemySchemeCount(1)}>
                +
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onLoadArchenemyDeck}>
                <Shuffle className="h-3.5 w-3.5" />
                Load
              </Button>
              <Button size="sm" className="h-8 px-2 text-xs" onClick={onSetSchemeInMotion}>
                <ScrollText className="h-3.5 w-3.5" />
                New Scheme
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onAbandonCurrentScheme} disabled={!game.archenemyCurrentScheme}>
                Abandon
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onReshuffleArchenemyDeck} disabled={game.archenemyDeck.length + game.archenemyDiscard.length + (game.archenemyCurrentScheme ? 1 : 0) === 0}>
                Shuffle
              </Button>
            </div>
            <VariantCardPreview card={game.archenemyCurrentScheme} emptyLabel="No scheme in motion" tone="scheme" />
            <div className="text-[11px] font-semibold text-muted-foreground">
              Deck {game.archenemyDeck.length} / Discard {game.archenemyDiscard.length}
            </div>
          </>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-md border border-border bg-muted/30 p-2">
        <Button variant={game.planechaseMode ? "secondary" : "outline"} size="sm" onClick={onTogglePlanechaseMode} className="justify-start">
          <Sparkles className="h-4 w-4" />
          Planechase
        </Button>
        {game.planechaseMode ? (
          <>
            <div className="grid grid-cols-2 gap-1">
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onLoadPlanarDeck}>
                <Shuffle className="h-3.5 w-3.5" />
                Load
              </Button>
              <Button size="sm" className="h-8 px-2 text-xs" onClick={onPlaneswalk}>
                New Plane
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onRollPlanarDie}>
                Die {formatPlanarDie(game.planarDieRoll)}
              </Button>
              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onReshufflePlanarDeck} disabled={game.planarDeck.length + game.planarDiscard.length + (game.currentPlane ? 1 : 0) === 0}>
                Shuffle
              </Button>
            </div>
            <VariantCardPreview card={game.currentPlane} emptyLabel="No current plane" tone="plane" rotated />
            <div className="text-[11px] font-semibold text-muted-foreground">
              Deck {game.planarDeck.length} / Discard {game.planarDiscard.length}
            </div>
          </>
        ) : null}
      </div>

      {variantDeckStatus ? <div className="rounded-md border border-border bg-background/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">{variantDeckStatus}</div> : null}

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
          <Button variant={game.showDisplayQr ? "secondary" : "outline"} size="sm" onClick={onToggleDisplayQr}>
            <QrCode className="h-4 w-4" />
            TV QR
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
        <Button type="button" size="sm" variant="outline" className="mt-2 w-full" onClick={() => void copyShareLink()}>
          <Copy className="h-4 w-4" />
          {copiedShareLink ? "Copied view-only link" : "Copy view-only link"}
        </Button>
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
  savedPlayers,
  isArchenemy,
  isWinner,
  setupOpen,
  onToggleSetup,
  onAssignSavedPlayer,
  onName,
  onCommanderName,
  onPartnerCommanderName,
  onMoxfieldDeckUrl,
  onBackgroundImage,
  onSelectCommanderArt,
  onClearCommanderArt,
  onLife,
  onPoison,
  onCommanderDamage,
  onCounter,
  onStatus,
  onWinner,
  onRemove,
  canRemove
}: {
  player: CommanderPlayer;
  players: CommanderPlayer[];
  savedPlayers: SavedPlayerProfile[];
  isArchenemy: boolean;
  isWinner: boolean;
  setupOpen: boolean;
  onToggleSetup: () => void;
  onAssignSavedPlayer: (savedPlayerId: string) => void;
  onName: (name: string) => void;
  onCommanderName: (commanderName: string) => void;
  onPartnerCommanderName: (partnerCommanderName: string) => void;
  onMoxfieldDeckUrl: (moxfieldDeckUrl: string) => void;
  onBackgroundImage: (backgroundImage: string) => void;
  onSelectCommanderArt: (imageUrl: string, cardName: string) => void;
  onClearCommanderArt: () => void;
  onLife: (playerId: string, amount: number) => void;
  onPoison: (playerId: string, amount: number) => void;
  onCommanderDamage: (playerId: string, sourceId: string, amount: number) => void;
  onCounter: (playerId: string, key: "experience" | "energy" | "treasure", amount: number) => void;
  onStatus: (playerId: string, key: "isMonarch" | "hasInitiative" | "hasCityBlessing") => void;
  onWinner: () => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-1.5 rounded-md bg-card p-2">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1.5">
        <div
          className={cn("h-9 w-9 shrink-0 rounded-md border border-border bg-muted bg-cover bg-center", isArchenemy && "ring-2 ring-destructive")}
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
        <div className="flex gap-1">
          <Button
            variant={setupOpen ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={onToggleSetup}
            aria-label={`Setup ${player.name}`}
            aria-expanded={setupOpen}
          >
            <Wrench className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove} disabled={!canRemove} aria-label="Remove player">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {setupOpen ? (
        <div className="grid gap-2 rounded-md border border-border bg-muted/30 p-2">
          <div className="space-y-1">
            <Label htmlFor={`${player.id}-saved-player`} className="text-xs">
              Saved player
            </Label>
            <select
              id={`${player.id}-saved-player`}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue=""
              onChange={(event) => {
                if (event.target.value) {
                  onAssignSavedPlayer(event.target.value);
                  event.target.value = "";
                }
              }}
              disabled={savedPlayers.length === 0}
            >
              <option value="">
                {savedPlayers.length === 0 ? "Login and save profiles first" : "Assign saved profile..."}
              </option>
              {savedPlayers.map((savedPlayer) => (
                <option key={savedPlayer.id} value={savedPlayer.id}>
                  {savedPlayer.display_name}
                  {savedPlayer.favorite_commander ? ` - ${savedPlayer.favorite_commander}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`${player.id}-commander`} className="text-xs">
                Commander
              </Label>
              <Input
                id={`${player.id}-commander`}
                value={player.commanderName}
                onChange={(event) => onCommanderName(event.target.value)}
                className="h-8 px-2 text-xs"
                placeholder="Commander name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${player.id}-partner`} className="text-xs">
                Partner
              </Label>
              <Input
                id={`${player.id}-partner`}
                value={player.partnerCommanderName}
                onChange={(event) => onPartnerCommanderName(event.target.value)}
                className="h-8 px-2 text-xs"
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${player.id}-moxfield`} className="text-xs">
              Moxfield decklist
            </Label>
            <Input
              id={`${player.id}-moxfield`}
              value={player.moxfieldDeckUrl}
              onChange={(event) => onMoxfieldDeckUrl(event.target.value)}
              className="h-8 px-2 text-xs"
              placeholder="https://www.moxfield.com/decks/..."
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${player.id}-background-image`} className="text-xs">
              Commander card image
            </Label>
            <div className="grid grid-cols-[1fr_auto] gap-1">
              <Input
                id={`${player.id}-background-image`}
                value={player.backgroundImage}
                onChange={(event) => onBackgroundImage(event.target.value)}
                className="h-8 px-2 text-xs"
                placeholder="https://..."
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs"
                onClick={onClearCommanderArt}
                disabled={!player.backgroundImage}
              >
                Clear
              </Button>
            </div>
            {player.backgroundCardName ? (
              <p className="truncate text-[11px] font-semibold text-muted-foreground">
                Art: {player.backgroundCardName}
              </p>
            ) : null}
          </div>
          <ScryfallPicker onSelect={onSelectCommanderArt} />
        </div>
      ) : null}

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

      <div className="grid grid-cols-4 gap-1">
        {isArchenemy ? (
          <div className="col-span-4 flex items-center justify-center gap-1 rounded-md bg-destructive px-2 py-1 text-xs font-black uppercase text-destructive-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            Archenemy
          </div>
        ) : null}
        <Button size="sm" className="h-7 px-1 text-xs" variant={player.isMonarch ? "secondary" : "outline"} onClick={() => onStatus(player.id, "isMonarch")}>
          <Crown className="h-4 w-4" />
        </Button>
        <Button size="sm" className="h-7 px-1 text-xs" variant={player.hasInitiative ? "secondary" : "outline"} onClick={() => onStatus(player.id, "hasInitiative")}>
          Init
        </Button>
        <Button size="sm" className="h-7 px-1 text-xs" variant={player.hasCityBlessing ? "secondary" : "outline"} onClick={() => onStatus(player.id, "hasCityBlessing")}>
          City
        </Button>
        <Button size="sm" className="h-7 px-1 text-xs" variant={isWinner ? "secondary" : "outline"} onClick={onWinner}>
          <Trophy className="h-4 w-4" />
        </Button>
      </div>

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

function VariantCardPreview({
  card,
  emptyLabel,
  tone = "scheme",
  rotated = false
}: {
  card: VariantDeckCard | null;
  emptyLabel: string;
  tone?: "scheme" | "plane";
  rotated?: boolean;
}) {
  if (!card) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background/50 px-2 py-3 text-center text-[11px] font-semibold text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div key={card.id} className="variant-card-reveal grid gap-2 rounded-md border border-border bg-background/70 p-2">
      <div
        className={cn(
          "relative mx-auto flex items-center justify-center overflow-hidden rounded border border-border bg-muted",
          rotated ? "aspect-[7/5] h-32 max-h-[24vh] w-full max-w-52" : "aspect-[5/7] h-40 max-h-[28vh]",
          tone === "plane" && "plane-portal-frame",
          tone === "scheme" && "scheme-card-reveal"
        )}
      >
        {tone === "scheme" ? <div className="scheme-card-omen pointer-events-none absolute inset-0" /> : null}
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className={cn("relative z-10 max-h-full max-w-full object-contain", rotated && "rotate-90 scale-[1.38]", tone === "plane" && "plane-portal-card")}
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-black uppercase tracking-wider text-primary">Current card</div>
        <div className="truncate text-xs font-black">{card.name}</div>
      </div>
    </div>
  );
}

function formatPlanarDie(result: CommanderGame["planarDieRoll"]) {
  if (result === "planeswalk") {
    return "Planeswalk";
  }
  if (result === "chaos") {
    return "Chaos";
  }
  if (result === "blank") {
    return "Blank";
  }
  return "";
}

function drawVariantCard(deck: VariantDeckCard[], discard: VariantDeckCard[]) {
  const activeDeck = deck.length ? deck : shuffleDeck(discard);
  if (activeDeck.length === 0) {
    return { card: null, deck: [], discard: [] };
  }

  const [card, ...remaining] = activeDeck;
  return {
    card,
    deck: remaining,
    discard: deck.length ? discard : []
  };
}

function shuffleDeck<T>(cards: T[]) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

type ScryfallCard = {
  id: string;
  name: string;
  image_uris?: {
    normal?: string;
    large?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal?: string;
      large?: string;
    };
  }>;
};

type ScryfallSearchResult = {
  data?: ScryfallCard[];
  has_more?: boolean;
  next_page?: string;
};

async function fetchVariantCards(query: string) {
  const cards: VariantDeckCard[] = [];
  let nextUrl = `https://api.scryfall.com/cards/search?unique=cards&order=name&q=${encodeURIComponent(query)}`;

  while (nextUrl) {
    const response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error("Unable to load Scryfall cards");
    }

    const result = (await response.json()) as ScryfallSearchResult;
    for (const card of result.data ?? []) {
      cards.push({
        id: card.id,
        name: card.name,
        imageUrl: card.image_uris?.normal ?? card.image_uris?.large ?? card.card_faces?.[0]?.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.large ?? ""
      });
    }

    nextUrl = result.has_more && result.next_page ? result.next_page : "";
  }

  return cards;
}
