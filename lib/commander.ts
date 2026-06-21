export type CommanderPlayer = {
  id: string;
  name: string;
  commanderName: string;
  partnerCommanderName: string;
  life: number;
  commanderDamage: Record<string, number>;
  poison: number;
  experience: number;
  energy: number;
  treasure: number;
  isMonarch: boolean;
  hasInitiative: boolean;
  hasCityBlessing: boolean;
  backgroundImage: string;
  backgroundCardName?: string;
};

export type DayNight = "day" | "night" | null;

export type CommanderGame = {
  startingLife: number;
  players: CommanderPlayer[];
  dayNight: DayNight;
  activePlayerId: string | null;
  turnSeconds: number;
  timerStartedAt: number | null;
  randomPlayerId: string | null;
  diceRoll: number | null;
  updatedAt: number;
};

const defaultNames = ["Player One", "Player Two", "Player Three", "Player Four"];

export function createId() {
  const browserCrypto = globalThis.crypto;

  if (typeof browserCrypto?.randomUUID === "function") {
    return browserCrypto.randomUUID();
  }

  if (typeof browserCrypto?.getRandomValues === "function") {
    const bytes = browserCrypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createDefaultGame(): CommanderGame {
  const players = defaultNames.map((name) => ({
    id: createId(),
    name,
    commanderName: "",
    partnerCommanderName: "",
    life: 40,
    poison: 0,
    experience: 0,
    energy: 0,
    treasure: 0,
    isMonarch: false,
    hasInitiative: false,
    hasCityBlessing: false,
    commanderDamage: {},
    backgroundImage: ""
  }));

  return hydrateCommanderDamage({
    startingLife: 40,
    players,
    dayNight: null,
    activePlayerId: players[0]?.id ?? null,
    turnSeconds: 0,
    timerStartedAt: null,
    randomPlayerId: null,
    diceRoll: null,
    updatedAt: Date.now()
  });
}

export function hydrateCommanderDamage(game: CommanderGame): CommanderGame {
  const ids = game.players.map((player) => player.id);
  const activePlayerId = game.activePlayerId && ids.includes(game.activePlayerId) ? game.activePlayerId : ids[0] ?? null;
  const randomPlayerId = game.randomPlayerId && ids.includes(game.randomPlayerId) ? game.randomPlayerId : null;

  return {
    ...game,
    dayNight: game.dayNight ?? null,
    activePlayerId,
    turnSeconds: game.turnSeconds ?? 0,
    timerStartedAt: game.timerStartedAt ?? null,
    randomPlayerId,
    diceRoll: game.diceRoll ?? null,
    players: game.players.map((player) => ({
      ...player,
      commanderName: player.commanderName ?? "",
      partnerCommanderName: player.partnerCommanderName ?? "",
      poison: player.poison ?? 0,
      experience: player.experience ?? 0,
      energy: player.energy ?? 0,
      treasure: player.treasure ?? 0,
      isMonarch: player.isMonarch ?? false,
      hasInitiative: player.hasInitiative ?? false,
      hasCityBlessing: player.hasCityBlessing ?? false,
      backgroundImage: player.backgroundImage ?? "",
      commanderDamage: ids.reduce<Record<string, number>>((acc, id) => {
        if (id !== player.id) {
          acc[id] = player.commanderDamage?.[id] ?? 0;
        }
        return acc;
      }, {})
    }))
  };
}
