"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Crown, Dices, ExternalLink, Gem, MessageCircle, Moon, ScrollText, ShieldAlert, Skull, Slash, Sparkles, Star, Sun, TabletSmartphone, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchServerGame,
  hydrateGameAccessFromUrl,
  loadGame,
  saveGame,
  subscribeToGame,
  type CommanderGame,
  type CommanderPlayer,
  type VariantDeckCard
} from "@/lib/game-state";
import { cn } from "@/lib/utils";

export default function DisplayPage() {
  const [game, setGame] = useState<CommanderGame>(() => loadGame());
  const [connected, setConnected] = useState(false);
  const [displayQrUrl, setDisplayQrUrl] = useState("");
  const [, setClockTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    hydrateGameAccessFromUrl();
    setDisplayQrUrl(window.location.href);

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

  if (game.mode === "horde") {
    return <HordeDisplay game={game} connected={connected} />;
  }

  const activePlayer = game.players.find((player) => player.id === game.activePlayerId);
  const randomPlayer = game.players.find((player) => player.id === game.randomPlayerId);
  const winner = game.players.find((player) => player.id === game.winnerPlayerId);
  const timerSeconds = game.turnSeconds + (game.timerStartedAt ? Math.max(0, Math.floor((Date.now() - game.timerStartedAt) / 1000)) : 0);
  const activeVariantCards: VariantStageCard[] = [];
  if (game.archenemyMode && game.archenemyCurrentScheme) {
    activeVariantCards.push({
      label: "Scheme",
      count: game.archenemySchemeCount,
      card: game.archenemyCurrentScheme,
      tone: "destructive"
    });
  }
  if (game.planechaseMode && game.currentPlane) {
    activeVariantCards.push({
      label: "Planechase",
      count: null,
      card: game.currentPlane,
      tone: "primary",
      rotated: true
    });
  }

  return (
    <main className="fixed-screen flex flex-col overflow-hidden bg-black text-foreground">
      <GameStatusBar
        game={game}
        connected={connected}
        activePlayer={activePlayer}
        randomPlayer={randomPlayer}
        winner={winner}
        timerSeconds={timerSeconds}
        displayQrUrl={displayQrUrl}
      />
      <ArchenemyChatBubble game={game} />
      <div className={cn("grid min-h-0 flex-1 gap-1 p-1", activeVariantCards.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24vw)]")}>
        <div className={cn("grid min-h-0 auto-rows-fr gap-1", gridClass)}>
          {game.players.map((player) => (
            <PlayerDisplay
              key={player.id}
              player={player}
              players={game.players}
              compact={game.players.length >= 4}
              isActive={game.activePlayerId === player.id}
              isRandom={game.randomPlayerId === player.id}
              isWinner={game.winnerPlayerId === player.id}
              isArchenemy={game.archenemyMode && game.archenemyPlayerId === player.id}
            />
          ))}
        </div>
        {activeVariantCards.length > 0 ? <VariantDeckStage cards={activeVariantCards} /> : null}
      </div>
    </main>
  );
}

function HordeDisplay({ game, connected }: { game: CommanderGame; connected: boolean }) {
  const previousBattlefieldIds = useRef<Set<string>>(new Set());
  const observedTurn = useRef(game.hordeTurn);
  const [dialogTurn, setDialogTurn] = useState<number | null>(null);
  const battlefieldIds = new Set(game.hordeBattlefield.map((card) => card.id));
  const enteringBattlefieldIds = new Set([...battlefieldIds].filter((id) => !previousBattlefieldIds.current.has(id)));
  useEffect(() => {
    previousBattlefieldIds.current = battlefieldIds;
  }, [game.hordeBattlefield]);
  useEffect(() => {
    if (game.hordeTurn > observedTurn.current && game.hordeRevealQueue.length > 0) {
      setDialogTurn(game.hordeTurn);
      const timeout = window.setTimeout(() => setDialogTurn(null), 4200);
      observedTurn.current = game.hordeTurn;
      return () => window.clearTimeout(timeout);
    }
    observedTurn.current = game.hordeTurn;
  }, [game.hordeRevealQueue.length, game.hordeTurn]);
  const creatures = game.hordeBattlefield.filter((card) => card.typeLine?.toLowerCase().includes("creature"));
  const queueCards = game.hordeRevealQueue.filter((card) => card.id !== game.hordeCurrentCard?.id);
  return (
    <main className="fixed-screen flex flex-col overflow-hidden bg-zinc-950 text-white">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-black/80 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><Bot className="h-7 w-7 text-red-400" /><div><div className="text-[10px] font-black uppercase tracking-[0.22em] text-red-300">Commander Control · Horde Mode</div><div className="text-xl font-black uppercase">{game.hordeDeckName || "The Horde"}</div></div></div>
        <div className="flex items-center gap-2 text-xs font-black uppercase"><span className={cn("h-2.5 w-2.5 rounded-full", connected ? "bg-emerald-400" : "bg-red-400")} />{phaseLabel(game)} · Turn {game.hordeTurn}</div>
      </header>
      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden p-2 lg:grid-cols-[minmax(0,1fr)_minmax(21rem,30vw)]">
        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-2">
          <div className="grid grid-cols-3 gap-2"><DisplayStat label="Survivor life" value={game.hordeSharedLife} tone="text-emerald-300" /><DisplayStat label="Horde deck" value={game.hordeDeck.length} /><DisplayStat label="Horde graveyard" value={game.hordeDiscard.length} /></div>
          <section className="min-h-0 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-wider text-white/70">Horde battlefield</h2><span className="text-xs font-bold text-white/45">{creatures.length} creatures · {game.hordeBattlefield.length} permanents</span></div>{game.hordeBattlefield.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">{game.hordeBattlefield.map((card) => <DisplayHordeCard key={card.id} card={card} animate={enteringBattlefieldIds.has(card.id)} />)}</div> : <div className="grid h-full place-items-center text-white/35">The battlefield is empty.</div>}</section>
        </section>
        <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(9rem,20vh)_auto] gap-2"><section className="min-h-0 overflow-auto rounded-lg border border-red-300/25 bg-red-950/20 p-3"><div className="mb-2 flex items-center justify-between"><span className="rounded bg-red-500 px-2 py-1 text-[10px] font-black uppercase">Currently resolving</span><span className="text-xs font-bold text-white/45">{game.hordeResolutionPhase}</span></div>{game.hordePendingChoice ? <div className="grid h-full place-items-center p-4 text-center"><Dices className="h-14 w-14 text-primary" /><div className="mt-3 text-xl font-black">Random determination required</div><div className="mt-2 text-sm text-white/60">{game.hordePendingChoice.prompt}</div></div> : game.hordeCurrentCard ? <div className="grid content-center justify-items-center gap-3"><DisplayHordeCard key={`${game.hordeTurn}-${game.hordeCurrentCard.id}`} card={game.hordeCurrentCard} large animate /><div className="text-center text-lg font-black">{game.hordeCurrentCard.name}</div><DisplayOracleText text={game.hordeCurrentCard.oracleText} /></div> : <div className="grid h-full place-items-center text-white/35">Waiting for the next Horde action.</div>}</section><section className="min-h-0 overflow-hidden rounded-lg border border-amber-300/25 bg-amber-950/15 p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-amber-200">Reveal queue</span><span className="text-xs font-bold text-white/45">{queueCards.length} token{queueCards.length === 1 ? "" : "s"}</span></div><div className="flex h-[calc(100%-1.5rem)] gap-2 overflow-x-auto pb-1">{queueCards.length ? queueCards.map((card) => <DisplayHordeCard key={card.id} card={card} compact animate />) : <span className="self-center text-sm text-white/35">No additional cards revealed.</span>}</div></section><section className="max-h-44 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3"><div className="mb-2 text-xs font-black uppercase tracking-wider text-white/50">Resolution log</div>{game.hordeLog.slice().reverse().map((entry) => <div key={entry.id} className="mb-1 text-xs"><span className="mr-2 font-black uppercase text-red-300">{entry.phase}</span>{entry.message}</div>)}</section></aside>
      </div>
      {dialogTurn === game.hordeTurn && game.hordeRevealQueue.length > 0 ? <HordeResolutionDialog game={game} /> : null}
    </main>
  );
}

function HordeResolutionDialog({ game }: { game: CommanderGame }) {
  const resolvingCard = game.hordeCurrentCard ?? game.hordeRevealQueue[game.hordeRevealQueue.length - 1];
  return <div className="horde-resolution-dialog fixed inset-0 z-50 grid place-items-center bg-black/80 p-6 backdrop-blur-sm"><div className="w-full max-w-6xl rounded-2xl border border-red-300/40 bg-zinc-950/95 p-5 text-white shadow-[0_0_100px_rgba(248,113,113,0.28)]"><div className="flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[0.24em] text-red-300">Horde turn {game.hordeTurn}</div><h2 className="mt-1 text-3xl font-black uppercase">{game.hordePendingChoice ? "Choice required" : "Horde reveal"}</h2></div><div className="rounded-full border border-white/15 px-3 py-1 text-xs font-black uppercase text-white/60">{game.hordeRevealQueue.length} cards</div></div><div className="mt-5 grid gap-6 lg:grid-cols-[auto_minmax(20rem,1fr)] lg:items-center"><div className="flex flex-wrap items-end justify-center gap-4">{game.hordeRevealQueue.map((card) => <DisplayHordeCard key={card.id} card={card} large animate />)}</div><div className="grid gap-3">{resolvingCard ? <><div className="text-xl font-black uppercase text-amber-200">{resolvingCard.name}</div><DisplayOracleText text={resolvingCard.oracleText} /></> : null}<p className="text-sm font-bold uppercase tracking-wider text-white/55">Tokens enter the battlefield before the resolving card.</p></div></div></div></div>;
}

function DisplayHordeCard({ card, compact = false, large = false, animate = false }: { card: VariantDeckCard; compact?: boolean; large?: boolean; animate?: boolean }) { return <div className={cn("shrink-0", animate && "horde-card-reveal", compact ? "w-16" : large ? "w-64" : "w-full")}><div className={cn("aspect-[5/7] overflow-hidden rounded border border-white/15 bg-zinc-900", large && "shadow-[0_0_40px_rgba(248,113,113,0.25)]")}>{card.imageUrl ? <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-2 text-center text-[10px] font-black">{card.name}</div>}</div>{!compact ? <div className="mt-1 truncate text-center text-xs font-bold">{card.name}</div> : null}</div>; }
function DisplayStat({ label, value, tone = "text-white" }: { label: string; value: number; tone?: string }) { return <div className="rounded-lg border border-white/10 bg-black/35 p-2"><div className="text-[10px] font-black uppercase tracking-wider text-white/45">{label}</div><div className={cn("text-3xl font-black", tone)}>{value}</div></div>; }
function DisplayOracleText({ text }: { text?: string }) { return text ? <div className="w-full max-w-md rounded-lg border border-white/15 bg-black/50 p-3 text-left text-sm font-semibold leading-5 text-white/85"><div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Card text</div><div className="whitespace-pre-line">{text}</div></div> : null; }
function phaseLabel(game: CommanderGame) { return game.hordePendingChoice ? "Choice pending" : game.hordeResolutionPhase.replace("_", " "); }

function ArchenemyChatBubble({ game }: { game: CommanderGame }) {
  if (!game.archenemyMode || !game.archenemyAiEnabled || !game.archenemyAiTaunt) {
    return null;
  }

  return (
    <aside className="pointer-events-none absolute left-3 top-20 z-50 hidden max-w-[min(30rem,52vw)] gap-3 rounded-lg border border-white/10 bg-zinc-950/92 p-3 text-white shadow-2xl backdrop-blur screen-text-shadow md:flex">
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-md ring-1", archenemyAccentClasses(game.archenemyAiAccent))}>
        {archenemyAvatarIcon(game.archenemyAiAvatar)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary">
          <MessageCircle className="h-3.5 w-3.5" />
          {game.archenemyAiName || "The Archenemy"}
        </div>
        <div className="mt-1 text-sm font-black leading-5 lg:text-base">"{game.archenemyAiTaunt}"</div>
        {game.archenemyAiPlan ? <div className="mt-1 line-clamp-2 text-xs font-semibold text-white/58">{game.archenemyAiPlan}</div> : null}
      </div>
    </aside>
  );
}

type VariantStageCard = {
  label: string;
  count: number | null;
  card: VariantDeckCard;
  tone: "primary" | "destructive";
  rotated?: boolean;
};

function VariantDeckStage({ cards }: { cards: VariantStageCard[] }) {
  return (
    <aside className="grid min-h-0 gap-1 lg:auto-rows-fr">
      {cards.map((item) => (
        <section
          key={`${item.label}-${item.card.id}`}
          className={cn(
            "variant-card-reveal relative isolate min-h-0 overflow-hidden rounded-md border border-white/10 bg-zinc-950 p-2 screen-text-shadow sm:p-3",
            item.tone === "destructive" && "scheme-card-reveal"
          )}
        >
          <div
            className="absolute inset-0 opacity-25 blur-2xl"
            style={{ backgroundImage: item.card.imageUrl ? `url(${item.card.imageUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="relative z-10 flex h-full min-h-0 flex-col gap-2">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <div className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-xs font-black uppercase tracking-wider", item.tone === "destructive" ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground")}>
                {item.tone === "destructive" ? <ShieldAlert className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {item.label}
              </div>
              {item.count !== null ? <div className="rounded-md bg-black/55 px-2 py-1 text-xs font-black text-white/80">#{item.count}</div> : null}
            </div>
            <div className={cn("relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg", item.rotated && "plane-portal-frame")}>
              {item.tone === "destructive" ? <div className="scheme-card-omen pointer-events-none absolute inset-0 z-20" /> : null}
              {item.card.imageUrl ? (
                <img
                  src={item.card.imageUrl}
                  alt={item.card.name}
                  className={cn(
                    "relative z-10 max-h-full max-w-full rounded-lg object-contain shadow-[0_16px_40px_rgba(0,0,0,0.65)]",
                    item.rotated && "rotate-90 scale-[1.38] plane-portal-card"
                  )}
                />
              ) : (
                <div className="flex aspect-[5/7] max-h-full w-full max-w-64 items-center justify-center rounded-lg border border-white/10 bg-black/55 p-4 text-center text-xl font-black">
                  {item.card.name}
                </div>
              )}
            </div>
            <h2 className="shrink-0 text-center text-sm font-black uppercase tracking-wider text-white sm:text-base lg:text-lg">{item.card.name}</h2>
          </div>
        </section>
      ))}
    </aside>
  );
}

function GameStatusBar({
  game,
  connected,
  activePlayer,
  randomPlayer,
  winner,
  timerSeconds,
  displayQrUrl
}: {
  game: CommanderGame;
  connected: boolean;
  activePlayer?: CommanderPlayer;
  randomPlayer?: CommanderPlayer;
  winner?: CommanderPlayer;
  timerSeconds: number;
  displayQrUrl: string;
}) {
  const monarch = game.players.find((player) => player.isMonarch);
  const initiative = game.players.find((player) => player.hasInitiative);
  const cityBlessed = game.players.filter((player) => player.hasCityBlessing);
  const archenemy = game.players.find((player) => player.id === game.archenemyPlayerId);
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
        {game.archenemyMode && archenemy ? <StatusItem label="Archenemy" value={archenemy.name} icon={<ShieldAlert className="h-4 w-4" />} /> : null}
        {game.archenemyMode && game.archenemyAiEnabled && game.archenemyAiTaunt ? <StatusItem label={game.archenemyAiName || "AI Archenemy"} value={game.archenemyAiTaunt} icon={<Bot className="h-4 w-4" />} /> : null}
        {game.archenemyMode ? <StatusItem label="Schemes" value={game.archenemySchemeCount.toString()} icon={<ScrollText className="h-4 w-4" />} /> : null}
        {game.archenemyMode && (game.archenemyCurrentScheme || game.archenemyScheme) ? (
          <StatusItem label="Current Scheme" value={game.archenemyCurrentScheme?.name ?? game.archenemyScheme} icon={<ScrollText className="h-4 w-4" />} />
        ) : null}
        {game.planechaseMode && game.currentPlane ? <StatusItem label="Current Plane" value={game.currentPlane.name} icon={<Sparkles className="h-4 w-4" />} /> : null}
        {game.planechaseMode && game.planarDieRoll ? <StatusItem label="Planar Die" value={formatPlanarDie(game.planarDieRoll)} icon={<Dices className="h-4 w-4" />} /> : null}
        {randomPlayer ? <StatusItem label="Pick" value={randomPlayer.name} /> : null}
        {winner ? <StatusItem label="Winner" value={winner.name} icon={<Trophy className="h-4 w-4" />} /> : null}
        {game.diceRoll ? <StatusItem label="d20" value={game.diceRoll.toString()} icon={<Dices className="h-4 w-4" />} /> : null}
        {monarch ? <StatusItem label="Monarch" value={monarch.name} icon={<Crown className="h-4 w-4" />} /> : null}
        {initiative ? <StatusItem label="Initiative" value={initiative.name} icon={<Sparkles className="h-4 w-4" />} /> : null}
        {cityLabel ? <StatusItem label="City Blessing" value={cityLabel} icon={<Trophy className="h-4 w-4" />} /> : null}
      </div>

      {game.showDisplayQr && displayQrUrl ? <DisplayQrBarItem url={displayQrUrl} /> : null}

      <Button asChild size="icon" variant="ghost" className="h-11 w-11 shrink-0 bg-white/5 text-white hover:bg-white/10 sm:h-12 sm:w-12">
        <Link href="/control" aria-label="Open tablet controls">
          <TabletSmartphone className="h-5 w-5" />
        </Link>
      </Button>
    </header>
  );
}

function DisplayQrBarItem({ url }: { url: string }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=96x96&margin=6&data=${encodeURIComponent(url)}`;

  return (
    <div className="hidden h-14 shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/[0.07] px-2 backdrop-blur sm:flex">
      <img src={qrSrc} alt="View-only game QR code" className="h-11 w-11 rounded bg-white p-1" />
      <div className="hidden min-w-0 lg:block">
        <p className="text-[10px] font-black uppercase tracking-wider text-primary">Scan TV</p>
        <p className="max-w-28 truncate text-[10px] font-semibold text-white/55">View-only link</p>
      </div>
    </div>
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
  isRandom,
  isWinner,
  isArchenemy
}: {
  player: CommanderPlayer;
  players: CommanderPlayer[];
  compact: boolean;
  isActive: boolean;
  isRandom: boolean;
  isWinner: boolean;
  isArchenemy: boolean;
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
        poisonBurst && "poison-pulse",
        isWinner && "winner-celebration",
        isArchenemy && "ring-2 ring-destructive"
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
      {isWinner ? (
        <>
          <div className="winner-rays pointer-events-none absolute inset-0 z-20" />
          <div className="winner-sparkles pointer-events-none absolute inset-0 z-30" />
        </>
      ) : null}
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
            {player.moxfieldDeckUrl ? (
              <a
                href={player.moxfieldDeckUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white/80 ring-1 ring-white/10 transition hover:text-primary lg:text-xs"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">Moxfield decklist</span>
              </a>
            ) : null}
          </div>
          <div className="flex max-w-[45%] flex-wrap justify-end gap-1">
            {isActive ? <DisplayBadge>Turn</DisplayBadge> : null}
            {isArchenemy ? <DisplayBadge danger>Archenemy</DisplayBadge> : null}
            {isWinner ? <DisplayBadge>Winner</DisplayBadge> : null}
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

function formatPlanarDie(result: CommanderGame["planarDieRoll"]) {
  if (result === "planeswalk") {
    return "Planeswalk";
  }
  if (result === "chaos") {
    return "Chaos";
  }
  return "Blank";
}

function archenemyAvatarIcon(avatar: string) {
  if (avatar === "skull") {
    return <Skull className="h-6 w-6" />;
  }
  if (avatar === "dragon") {
    return <ShieldAlert className="h-6 w-6" />;
  }
  if (avatar === "house") {
    return <Bot className="h-6 w-6" />;
  }
  return <Crown className="h-6 w-6" />;
}

function archenemyAccentClasses(accent: CommanderGame["archenemyAiAccent"]) {
  if (accent === "red") {
    return "bg-destructive text-destructive-foreground ring-red-300/35";
  }
  if (accent === "violet") {
    return "bg-violet-500/25 text-violet-100 ring-violet-300/35";
  }
  if (accent === "green") {
    return "bg-emerald-500/20 text-emerald-100 ring-emerald-300/35";
  }
  return "bg-primary text-primary-foreground ring-amber-200/45";
}
