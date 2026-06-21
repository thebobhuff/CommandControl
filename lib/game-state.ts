"use client";

import { createDefaultGame, createId, hydrateCommanderDamage, type CommanderGame } from "@/lib/commander";

export { createDefaultGame, createId };
export type { CommanderGame, CommanderPlayer } from "@/lib/commander";

const STORAGE_KEY = "commander-tv-game";
const GAME_ID_KEY = "commander-tv-game-id";
const CHANNEL_NAME = "commander-tv-sync";
let channel: BroadcastChannel | null = null;

export type SavedGameSummary = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function loadGame(): CommanderGame {
  if (typeof window === "undefined") {
    return createDefaultGame();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return createDefaultGame();
  }

  try {
    return hydrateCommanderDamage(JSON.parse(raw) as CommanderGame);
  } catch {
    return createDefaultGame();
  }
}

export function saveGame(game: CommanderGame) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  getChannel()?.postMessage(game);
}

export function getCurrentGameId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(GAME_ID_KEY);
}

export function setCurrentGameId(gameId: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (gameId) {
    window.localStorage.setItem(GAME_ID_KEY, gameId);
  } else {
    window.localStorage.removeItem(GAME_ID_KEY);
  }
}

export async function fetchServerGame() {
  const gameId = getCurrentGameId();
  const response = await fetch(`/api/game${gameId ? `?gameId=${gameId}` : ""}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load game state");
  }
  return (await response.json()) as CommanderGame;
}

export async function pushServerGame(game: CommanderGame) {
  const gameId = getCurrentGameId();
  const response = await fetch(`/api/game${gameId ? `?gameId=${gameId}` : ""}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(game)
  });

  if (!response.ok) {
    throw new Error("Unable to save game state");
  }

  return (await response.json()) as CommanderGame;
}

export async function fetchSavedGames() {
  const response = await fetch("/api/games", { cache: "no-store" });
  if (!response.ok) {
    return [] as SavedGameSummary[];
  }

  const result = (await response.json()) as { games: SavedGameSummary[] };
  return result.games ?? [];
}

export async function createSavedGame(game: CommanderGame, name = "Commander Game") {
  const response = await fetch("/api/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, state: game })
  });

  if (!response.ok) {
    throw new Error("Unable to create saved game");
  }

  const result = (await response.json()) as { id: string; state: CommanderGame };
  setCurrentGameId(result.id);
  return result;
}

export function subscribeToGame(callback: (game: CommanderGame) => void) {
  const channel = getChannel();
  if (!channel) {
    return () => {};
  }

  const handler = (event: MessageEvent<CommanderGame>) => callback(event.data);
  channel.addEventListener("message", handler);

  return () => channel.removeEventListener("message", handler);
}

export function updateGame(
  game: CommanderGame,
  updater: (draft: CommanderGame) => CommanderGame
) {
  return hydrateCommanderDamage(updater({ ...game, players: game.players.map((player) => ({ ...player })) }));
}

function getChannel() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }

  channel ??= new BroadcastChannel(CHANNEL_NAME);
  return channel;
}
