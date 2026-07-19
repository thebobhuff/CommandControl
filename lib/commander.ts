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
  moxfieldDeckUrl: string;
};

export type DayNight = "day" | "night" | null;

export type VariantDeckCard = {
  id: string;
  name: string;
  imageUrl: string;
};

export type CommanderGame = {
  startingLife: number;
  players: CommanderPlayer[];
  archenemyMode: boolean;
  archenemyPlayerId: string | null;
  archenemyScheme: string;
  archenemySchemeCount: number;
  archenemyDeck: VariantDeckCard[];
  archenemyDiscard: VariantDeckCard[];
  archenemyCurrentScheme: VariantDeckCard | null;
  planechaseMode: boolean;
  planarDeck: VariantDeckCard[];
  planarDiscard: VariantDeckCard[];
  currentPlane: VariantDeckCard | null;
  planarDieRoll: "planeswalk" | "chaos" | "blank" | null;
  dayNight: DayNight;
  activePlayerId: string | null;
  turnSeconds: number;
  timerStartedAt: number | null;
  randomPlayerId: string | null;
  winnerPlayerId: string | null;
  showDisplayQr: boolean;
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

export function createAccessToken() {
  const browserCrypto = globalThis.crypto;
  const bytes =
    typeof browserCrypto?.getRandomValues === "function"
      ? browserCrypto.getRandomValues(new Uint8Array(24))
      : Uint8Array.from({ length: 24 }, () => Math.floor(Math.random() * 256));

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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
    backgroundImage: "",
    moxfieldDeckUrl: ""
  }));

  return hydrateCommanderDamage({
    startingLife: 40,
    players,
    archenemyMode: false,
    archenemyPlayerId: null,
    archenemyScheme: "",
    archenemySchemeCount: 0,
    archenemyDeck: [],
    archenemyDiscard: [],
    archenemyCurrentScheme: null,
    planechaseMode: false,
    planarDeck: [],
    planarDiscard: [],
    currentPlane: null,
    planarDieRoll: null,
    dayNight: null,
    activePlayerId: players[0]?.id ?? null,
    turnSeconds: 0,
    timerStartedAt: null,
    randomPlayerId: null,
    winnerPlayerId: null,
    showDisplayQr: false,
    diceRoll: null,
    updatedAt: Date.now()
  });
}

export function hydrateCommanderDamage(game: CommanderGame): CommanderGame {
  const ids = game.players.map((player) => player.id);
  const activePlayerId = game.activePlayerId && ids.includes(game.activePlayerId) ? game.activePlayerId : ids[0] ?? null;
  const randomPlayerId = game.randomPlayerId && ids.includes(game.randomPlayerId) ? game.randomPlayerId : null;
  const winnerPlayerId = game.winnerPlayerId && ids.includes(game.winnerPlayerId) ? game.winnerPlayerId : null;
  const archenemyPlayerId = game.archenemyPlayerId && ids.includes(game.archenemyPlayerId) ? game.archenemyPlayerId : ids[0] ?? null;
  const archenemyMode = Boolean(game.archenemyMode);

  return {
    ...game,
    archenemyMode,
    archenemyPlayerId: archenemyMode ? archenemyPlayerId : null,
    archenemyScheme: game.archenemyScheme ?? "",
    archenemySchemeCount: Math.max(0, game.archenemySchemeCount ?? 0),
    archenemyDeck: hydrateDeck(game.archenemyDeck),
    archenemyDiscard: hydrateDeck(game.archenemyDiscard),
    archenemyCurrentScheme: hydrateDeckCard(game.archenemyCurrentScheme),
    planechaseMode: Boolean(game.planechaseMode),
    planarDeck: hydrateDeck(game.planarDeck),
    planarDiscard: hydrateDeck(game.planarDiscard),
    currentPlane: hydrateDeckCard(game.currentPlane),
    planarDieRoll: game.planarDieRoll === "planeswalk" || game.planarDieRoll === "chaos" || game.planarDieRoll === "blank" ? game.planarDieRoll : null,
    dayNight: game.dayNight ?? null,
    activePlayerId,
    turnSeconds: game.turnSeconds ?? 0,
    timerStartedAt: game.timerStartedAt ?? null,
    randomPlayerId,
    winnerPlayerId,
    showDisplayQr: game.showDisplayQr ?? false,
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
      moxfieldDeckUrl: player.moxfieldDeckUrl ?? "",
      commanderDamage: ids.reduce<Record<string, number>>((acc, id) => {
        if (id !== player.id) {
          acc[id] = player.commanderDamage?.[id] ?? 0;
        }
        return acc;
      }, {})
    }))
  };
}

function hydrateDeck(deck: VariantDeckCard[] | undefined) {
  if (!Array.isArray(deck)) {
    return [];
  }

  return deck.map(hydrateDeckCard).filter((card): card is VariantDeckCard => Boolean(card));
}

function hydrateDeckCard(card: VariantDeckCard | null | undefined) {
  if (!card || typeof card.id !== "string" || typeof card.name !== "string") {
    return null;
  }

  return {
    id: card.id,
    name: card.name,
    imageUrl: typeof card.imageUrl === "string" ? card.imageUrl : ""
  };
}
