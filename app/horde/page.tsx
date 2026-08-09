"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, Bot, Dices, ExternalLink, Library, Monitor, Play, RefreshCw, Skull, Swords, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { advanceHordeTurn, millHorde, moveHordeCardToGraveyard, resolveHordeChoice, returnHordeCardToBattlefield, startHordeGame } from "@/lib/horde";
import { fetchServerGame, hydrateGameAccessFromUrl, loadGame, pushServerGame, saveGame, subscribeToGame, type CommanderGame, type VariantDeckCard } from "@/lib/game-state";
import { cn } from "@/lib/utils";

export default function HordePage() {
  const [game, setGame] = useState<CommanderGame>(() => loadGame());
  const [url, setUrl] = useState(() => game.hordeSourceUrl);
  const [decklist, setDecklist] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrateGameAccessFromUrl();
    void fetchServerGame().then((next) => { setGame(next); saveGame(next); setUrl(next.hordeSourceUrl); }).catch(() => undefined);
    return subscribeToGame((next) => { setGame(next); setUrl(next.hordeSourceUrl); });
  }, []);

  function commit(next: CommanderGame) {
    const stamped = { ...next, updatedAt: Date.now() };
    setGame(stamped);
    saveGame(stamped);
    void pushServerGame(stamped).then((saved) => { setGame(saved); saveGame(saved); }).catch(() => setStatus("Saved locally; server sync unavailable."));
  }

  async function importDeck() {
    setLoading(true);
    setStatus("Importing public Moxfield deck…");
    try {
      const response = await fetch("/api/horde/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, decklist }) });
      const result = (await response.json()) as { error?: string; name?: string; sourceUrl?: string; cards?: VariantDeckCard[] };
      if (!response.ok || !result.cards?.length) throw new Error(result.error ?? "No cards found.");
      commit(startHordeGame(game, { name: result.name ?? "Moxfield Horde", sourceUrl: result.sourceUrl ?? url, cards: result.cards }));
      setStatus(`Loaded ${result.cards.length} cards. Three setup turns are ready.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to import the deck.");
    } finally { setLoading(false); }
  }

  function runTurn() { commit(advanceHordeTurn(game)); }
  function randomChoice() { commit(resolveHordeChoice(game)); }
  function damageHorde() { commit(millHorde(game, 1)); }
  function returnFromGraveyard(cardId: string) { commit(returnHordeCardToBattlefield(game, cardId)); }
  function moveToGraveyard(cardId: string) { commit(moveHordeCardToGraveyard(game, cardId)); }

  const displayUrl = useMemo(() => typeof window === "undefined" ? "/display" : `${window.location.origin}/display`, []);
  const hordeCreatureCount = game.hordeBattlefield.filter((card) => card.typeLine?.toLowerCase().includes("creature")).length;
  const hordeTokenCount = game.hordeDeck.filter((card) => card.isToken).length + game.hordeBattlefield.filter((card) => card.isToken).length;

  return (
    <main className="min-h-screen bg-background px-3 py-3 text-foreground sm:px-5">
      <div className="mx-auto grid max-w-[112rem] gap-3">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/80 p-4">
          <div className="flex items-center gap-3"><Bot className="h-8 w-8 text-destructive" /><div><p className="text-xs font-black uppercase tracking-[0.2em] text-destructive">Commander Control</p><h1 className="text-2xl font-black uppercase tracking-tight">Horde Mode</h1></div></div>
          <div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link href="/control"><ArrowLeft className="h-4 w-4" />Control</Link></Button><Button asChild variant="outline" size="sm"><Link href={displayUrl} target="_blank"><Monitor className="h-4 w-4" />TV display</Link></Button><Button asChild variant="outline" size="sm"><Link href="/tablet"><Tablet className="h-4 w-4" />Tablet</Link></Button></div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]">
          <aside className="grid content-start gap-3 rounded-xl border border-border bg-card/80 p-4">
            <div><Label htmlFor="horde-url">Public Moxfield deck URL</Label><Input id="horde-url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.moxfield.com/decks/..." /></div>
            <div className="grid gap-1"><Label htmlFor="horde-decklist">Moxfield export fallback</Label><textarea id="horde-decklist" value={decklist} onChange={(event) => setDecklist(event.target.value)} className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Paste the copied Moxfield decklist here if the URL is blocked…" /></div>
            <Button onClick={() => void importDeck()} disabled={loading || (!url.trim() && !decklist.trim())}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />{loading ? "Importing…" : "Import and start Horde"}</Button>
            {game.hordeDeckName ? <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm"><div className="font-black">{game.hordeDeckName}</div><div className="mt-1 text-muted-foreground">{game.hordeDeck.length + game.hordeDiscard.length + game.hordeBattlefield.length} tracked cards · {game.hordeSourceUrl ? <a className="inline-flex items-center gap-1 text-primary" href={game.hordeSourceUrl} target="_blank" rel="noreferrer">Moxfield <ExternalLink className="h-3 w-3" /></a> : null}</div></div> : null}
            <div className="grid grid-cols-2 gap-2 text-center"><Stat icon={<Library className="h-4 w-4" />} label="Deck" value={game.hordeDeck.length} /><Stat icon={<Archive className="h-4 w-4" />} label="Grave" value={game.hordeDiscard.length} /><Stat icon={<Swords className="h-4 w-4" />} label="Creatures" value={hordeCreatureCount} /><Stat icon={<Bot className="h-4 w-4" />} label="Tokens left" value={hordeTokenCount} /><Stat icon={<Skull className="h-4 w-4" />} label="Life" value={game.hordeSharedLife} /></div>
            <div className="grid gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3"><div className="text-xs font-black uppercase tracking-widest text-destructive">{phaseLabel(game)}</div><div className="text-sm text-muted-foreground">{game.hordeStatus === "survivors_win" ? "The survivors defeated the Horde." : game.hordeStatus === "horde_wins" ? "The Horde overwhelmed the survivors." : game.hordeSetupTurnsRemaining ? `${game.hordeSetupTurnsRemaining} setup turns remain before activation.` : "The Horde is ready to resolve its next turn."}</div><Button onClick={runTurn} disabled={!game.hordeMode || Boolean(game.hordePendingChoice) || game.hordeStatus === "survivors_win" || game.hordeStatus === "horde_wins"}><Play className="h-4 w-4" />{game.hordeSetupTurnsRemaining ? "Complete setup turn" : "Resolve Horde turn"}</Button>{game.hordePendingChoice ? <Button variant="secondary" onClick={randomChoice}><Dices className="h-4 w-4" />Random determination</Button> : null}</div>
            <Button variant="outline" onClick={damageHorde} disabled={!game.hordeMode || game.hordeDeck.length === 0}><Skull className="h-4 w-4" />Mill 1 Horde card</Button>
            {status ? <p className="text-xs font-semibold text-muted-foreground">{status}</p> : null}
          </aside>

          <section className="grid min-w-0 gap-3">
            <div className="grid gap-3 rounded-xl border border-border bg-card/80 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Currently resolving</p><h2 className="text-xl font-black">{game.hordeCurrentCard?.name ?? (game.hordePendingChoice?.sourceCard.name ?? "No active card")}</h2></div><div className="rounded-full bg-muted px-3 py-1 text-xs font-black uppercase">Turn {game.hordeTurn}</div></div><div className="grid min-h-72 place-items-center rounded-lg bg-black/20 p-3">{game.hordePendingChoice ? <div className="max-w-md text-center"><Dices className="mx-auto h-12 w-12 text-primary" /><p className="mt-3 text-lg font-black">Random determination required</p><p className="mt-1 text-sm text-muted-foreground">{game.hordePendingChoice.prompt}</p></div> : game.hordeCurrentCard ? <CardArt card={game.hordeCurrentCard} large /> : <p className="text-sm text-muted-foreground">Import a Moxfield Horde deck to begin.</p>}</div></div>
            <Board title="Horde battlefield" cards={game.hordeBattlefield} empty="No Horde permanents on the battlefield." actionLabel="Move to graveyard" onAction={moveToGraveyard} />
            <Board title="Horde graveyard" cards={game.hordeDiscard} empty="The Horde graveyard is empty." actionLabel="Return to battlefield" onAction={returnFromGraveyard} />
            <div className="grid gap-2 rounded-xl border border-border bg-card/80 p-4"><div className="flex items-center justify-between"><h2 className="font-black uppercase tracking-wider">Reveal queue</h2><span className="text-xs font-bold text-muted-foreground">{game.hordeRevealQueue.length} cards</span></div><div className="flex gap-2 overflow-x-auto">{game.hordeRevealQueue.map((card) => <CardArt key={card.id} card={card} />)}</div></div>
            <div className="rounded-xl border border-border bg-card/80 p-4"><h2 className="font-black uppercase tracking-wider">Resolution log</h2><div className="mt-2 grid gap-1">{game.hordeLog.slice().reverse().map((entry) => <div key={entry.id} className="flex gap-2 text-sm"><span className="w-16 shrink-0 text-[10px] font-black uppercase text-muted-foreground">{entry.phase}</span><span>{entry.message}</span></div>)}</div></div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Board({ title, cards, empty, actionLabel, onAction }: { title: string; cards: VariantDeckCard[]; empty: string; actionLabel: string; onAction: (cardId: string) => void }) { return <div className="rounded-xl border border-border bg-card/80 p-4"><h2 className="font-black uppercase tracking-wider">{title} <span className="text-sm text-muted-foreground">({cards.length})</span></h2>{cards.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-6">{cards.map((card) => <div key={card.id} className="grid gap-2"><CardArt card={card} /><Button variant="outline" size="sm" className="text-[10px] uppercase" onClick={() => onAction(card.id)}>{actionLabel}</Button></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">{empty}</p>}</div>; }
function CardArt({ card, large = false }: { card: VariantDeckCard; large?: boolean }) { return <div className={cn("grid gap-1", large && "max-w-56")}><div className={cn("aspect-[5/7] overflow-hidden rounded-lg border border-white/10 bg-muted", large && "w-56")}>{card.imageUrl ? <img src={card.imageUrl} alt={card.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center p-2 text-center text-xs font-black">{card.name}</div>}</div><div className="truncate text-center text-xs font-bold">{card.name}</div></div>; }
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="grid place-items-center rounded-lg border border-border bg-background/60 p-2"><div className="flex items-center gap-1 text-xs font-black text-muted-foreground">{icon}{label}</div><div className="text-2xl font-black">{value}</div></div>; }
function phaseLabel(game: CommanderGame) { return game.hordePendingChoice ? "Choice pending" : game.hordeResolutionPhase.replace("_", " "); }
