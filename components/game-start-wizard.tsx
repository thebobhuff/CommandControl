"use client";

import { useState } from "react";
import { Check, Monitor, ShieldAlert, Sparkles, Skull, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GameMode } from "@/lib/commander";
import { cn } from "@/lib/utils";

const modes: Array<{ id: GameMode; label: string; description: string; icon: typeof Monitor; accent: string }> = [
  { id: "commander", label: "Commander", description: "Track players, life, damage, and table status.", icon: Monitor, accent: "border-blue-400/40 bg-blue-400/10" },
  { id: "horde", label: "Horde", description: "Survivors face an automated deck-driven enemy.", icon: Skull, accent: "border-red-400/40 bg-red-400/10" },
  { id: "archenemy", label: "Archenemy", description: "One villain controls schemes against the table.", icon: ShieldAlert, accent: "border-amber-400/40 bg-amber-400/10" },
  { id: "planechase", label: "Planechase", description: "Add a planar deck and chaotic table events.", icon: Sparkles, accent: "border-violet-400/40 bg-violet-400/10" }
];

export function GameStartWizard({ open, initialName = "", busy = false, onCancel, onCreate }: { open: boolean; initialName?: string; busy?: boolean; onCancel: () => void; onCreate: (mode: GameMode, name: string) => void }) {
  const [mode, setMode] = useState<GameMode>("commander");
  const [name, setName] = useState(initialName);
  if (!open) {
    return null;
  }
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><section className="w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[0.22em] text-primary">New game</div><h2 className="mt-1 text-3xl font-black">Choose how this game will be played</h2><p className="mt-2 text-sm text-muted-foreground">This selection controls the rules, setup flow, control surface, and TV display.</p></div><Button variant="ghost" size="icon" onClick={onCancel} aria-label="Close"><X className="h-4 w-4" /></Button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{modes.map((item) => { const Icon = item.icon; const selected = mode === item.id; return <button key={item.id} type="button" onClick={() => setMode(item.id)} className={cn("rounded-xl border p-4 text-left transition", item.accent, selected ? "ring-2 ring-primary" : "opacity-75 hover:opacity-100")}><div className="flex items-center justify-between"><Icon className="h-6 w-6" /><span className={cn("grid h-5 w-5 place-items-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-white/20")}>{selected ? <Check className="h-3 w-3" /> : null}</span></div><div className="mt-4 text-lg font-black">{item.label}</div><div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div></button>; })}</div><div className="mt-5 grid gap-1"><Label htmlFor="new-game-name">Game name</Label><Input id="new-game-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Friday night Commander" /></div><div className="mt-5 flex justify-end gap-2"><Button variant="ghost" onClick={onCancel}>Cancel</Button><Button disabled={busy} onClick={() => onCreate(mode, name.trim() || `${modes.find((item) => item.id === mode)?.label ?? "Commander"} Game`)}>{busy ? "Starting…" : "Start game"}</Button></div></section></div>;
}
