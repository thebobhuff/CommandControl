"use client";

import { createAccessToken, createDefaultGame, createId, hydrateCommanderDamage, type CommanderGame } from "@/lib/commander";

export { createAccessToken, createDefaultGame, createId };
export type { CommanderGame, CommanderPlayer } from "@/lib/commander";

const STORAGE_KEY = "commander-tv-game";
const GAME_ID_KEY = "commander-tv-game-id";
const DISPLAY_TOKEN_KEY = "commander-tv-display-token";
const CONTROL_TOKEN_KEY = "commander-tv-control-token";
const CHANNEL_NAME = "commander-tv-sync";
let channel: BroadcastChannel | null = null;

export type SavedGameSummary = {
  id: string;
  name: string;
  is_active: boolean;
  display_token: string;
  control_token: string;
  created_at: string;
  updated_at: string;
};

export type GameAccess = {
  gameId: string | null;
  displayToken: string | null;
  controlToken: string | null;
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

export function getCurrentGameAccess(): GameAccess {
  if (typeof window === "undefined") {
    return { gameId: null, displayToken: null, controlToken: null };
  }

  return {
    gameId: window.localStorage.getItem(GAME_ID_KEY),
    displayToken: window.localStorage.getItem(DISPLAY_TOKEN_KEY),
    controlToken: window.localStorage.getItem(CONTROL_TOKEN_KEY)
  };
}

export function setCurrentGameId(gameId: string | null) {
  setCurrentGameAccess({ gameId, displayToken: null, controlToken: null });
}

export function setCurrentGameAccess(access: Partial<GameAccess>) {
  if (typeof window === "undefined") {
    return;
  }

  if (access.gameId) {
    window.localStorage.setItem(GAME_ID_KEY, access.gameId);
  } else {
    window.localStorage.removeItem(GAME_ID_KEY);
  }

  if (access.displayToken) {
    window.localStorage.setItem(DISPLAY_TOKEN_KEY, access.displayToken);
  } else if ("displayToken" in access) {
    window.localStorage.removeItem(DISPLAY_TOKEN_KEY);
  }

  if (access.controlToken) {
    window.localStorage.setItem(CONTROL_TOKEN_KEY, access.controlToken);
  } else if ("controlToken" in access) {
    window.localStorage.removeItem(CONTROL_TOKEN_KEY);
  }
}

export function hydrateGameAccessFromUrl() {
  if (typeof window === "undefined") {
    return getCurrentGameAccess();
  }

  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("gameId") ?? params.get("game");
  const token = params.get("token");

  if (gameId) {
    const current = getCurrentGameAccess();
    const sameGame = current.gameId === gameId;
    const isDisplayRoute = window.location.pathname.startsWith("/display");
    const isControlRoute = window.location.pathname.startsWith("/control") || window.location.pathname.startsWith("/tablet");

    setCurrentGameAccess({
      gameId,
      displayToken: token && isDisplayRoute ? token : sameGame ? current.displayToken : null,
      controlToken: token && isControlRoute ? token : sameGame ? current.controlToken : null
    });
  }

  return getCurrentGameAccess();
}

export async function fetchServerGame() {
  const response = await fetch(`/api/game${buildGameQuery(false)}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load game state");
  }
  return (await response.json()) as CommanderGame;
}

export async function pushServerGame(game: CommanderGame) {
  const response = await fetch(`/api/game${buildGameQuery(true)}`, {
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

  const result = (await response.json()) as { id: string; state: CommanderGame; display_token?: string; control_token?: string };
  setCurrentGameAccess({
    gameId: result.id,
    displayToken: result.display_token ?? null,
    controlToken: result.control_token ?? null
  });
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

function buildGameQuery(write: boolean) {
  const access = getCurrentGameAccess();
  const params = new URLSearchParams();

  if (access.gameId) {
    params.set("gameId", access.gameId);
  }

  const token = write ? access.controlToken : access.displayToken ?? access.controlToken;
  if (token) {
    params.set("token", token);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
