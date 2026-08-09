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
  typeLine?: string;
  oracleText?: string;
  power?: string;
  toughness?: string;
  isToken?: boolean;
};

export type HordeResolutionPhase = "setup" | "ready" | "reveal" | "tokens" | "spell" | "combat" | "choice" | "complete";

export type HordePendingChoice = {
  sourceCard: VariantDeckCard;
  prompt: string;
  options: string[];
};

export type HordeLogEntry = {
  id: string;
  message: string;
  phase: HordeResolutionPhase;
  createdAt: number;
};

export type ArchenemyAiAction = "reveal_scheme" | "taunt" | "pressure_leader" | "recover" | "wait";
export type GameMode = "commander" | "horde" | "archenemy" | "planechase";
export type SetupStatus = "draft" | "ready" | "active" | "complete";

export type CommanderGame = {
  mode: GameMode;
  setupStatus: SetupStatus;
  startingLife: number;
  players: CommanderPlayer[];
  archenemyMode: boolean;
  archenemyPlayerId: string | null;
  archenemyAiEnabled: boolean;
  archenemyAiName: string;
  archenemyAiPersona: string;
  archenemyAiAvatar: string;
  archenemyAiAccent: "gold" | "red" | "violet" | "green";
  archenemyDeckPresetId: string;
  archenemyDeckName: string;
  archenemyAiTaunt: string;
  archenemyAiPlan: string;
  archenemyAiLastAction: ArchenemyAiAction | null;
  archenemyScheme: string;
  archenemySchemeCount: number;
  archenemyDeck: VariantDeckCard[];
  archenemyDiscard: VariantDeckCard[];
  archenemyCurrentScheme: VariantDeckCard | null;
  hordeMode: boolean;
  hordeDeckName: string;
  hordeSourceUrl: string;
  hordeDeck: VariantDeckCard[];
  hordeDiscard: VariantDeckCard[];
  hordeBattlefield: VariantDeckCard[];
  hordeRevealQueue: VariantDeckCard[];
  hordeCurrentCard: VariantDeckCard | null;
  hordeResolutionPhase: HordeResolutionPhase;
  hordeTurn: number;
  hordeSetupTurnsRemaining: number;
  hordeSharedLife: number;
  hordePendingChoice: HordePendingChoice | null;
  hordeLastChoice: string;
  hordeLog: HordeLogEntry[];
  hordeStatus: "setup" | "active" | "survivors_win" | "horde_wins";
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
    mode: "commander",
    setupStatus: "draft",
    startingLife: 40,
    players,
    archenemyMode: false,
    archenemyPlayerId: null,
    archenemyAiEnabled: false,
    archenemyAiName: "The Archenemy",
    archenemyAiPersona: "A theatrical villain who enjoys schemes, table politics, and making the heroes feel surrounded.",
    archenemyAiAvatar: "crown",
    archenemyAiAccent: "gold",
    archenemyDeckPresetId: "all-schemes",
    archenemyDeckName: "All Scheme Cards",
    archenemyAiTaunt: "",
    archenemyAiPlan: "",
    archenemyAiLastAction: null,
    archenemyScheme: "",
    archenemySchemeCount: 0,
    archenemyDeck: [],
    archenemyDiscard: [],
    archenemyCurrentScheme: null,
    hordeMode: false,
    hordeDeckName: "",
    hordeSourceUrl: "",
    hordeDeck: [],
    hordeDiscard: [],
    hordeBattlefield: [],
    hordeRevealQueue: [],
    hordeCurrentCard: null,
    hordeResolutionPhase: "ready",
    hordeTurn: 0,
    hordeSetupTurnsRemaining: 0,
    hordeSharedLife: 0,
    hordePendingChoice: null,
    hordeLastChoice: "",
    hordeLog: [],
    hordeStatus: "setup",
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
  const mode = hydrateGameMode(game.mode, game.hordeMode, archenemyMode, game.planechaseMode);

  return {
    ...game,
    mode,
    setupStatus: hydrateSetupStatus(game.setupStatus),
    archenemyMode,
    archenemyPlayerId: archenemyMode ? archenemyPlayerId : null,
    archenemyAiEnabled: Boolean(game.archenemyAiEnabled),
    archenemyAiName: game.archenemyAiName ?? "The Archenemy",
    archenemyAiPersona: game.archenemyAiPersona ?? "A theatrical villain who enjoys schemes, table politics, and making the heroes feel surrounded.",
    archenemyAiAvatar: game.archenemyAiAvatar ?? "crown",
    archenemyAiAccent: game.archenemyAiAccent === "red" || game.archenemyAiAccent === "violet" || game.archenemyAiAccent === "green" || game.archenemyAiAccent === "gold" ? game.archenemyAiAccent : "gold",
    archenemyDeckPresetId: game.archenemyDeckPresetId ?? "all-schemes",
    archenemyDeckName: game.archenemyDeckName ?? "All Scheme Cards",
    archenemyAiTaunt: game.archenemyAiTaunt ?? "",
    archenemyAiPlan: game.archenemyAiPlan ?? "",
    archenemyAiLastAction: hydrateArchenemyAiAction(game.archenemyAiLastAction),
    archenemyScheme: game.archenemyScheme ?? "",
    archenemySchemeCount: Math.max(0, game.archenemySchemeCount ?? 0),
    archenemyDeck: hydrateDeck(game.archenemyDeck),
    archenemyDiscard: hydrateDeck(game.archenemyDiscard),
    archenemyCurrentScheme: hydrateDeckCard(game.archenemyCurrentScheme),
    hordeMode: Boolean(game.hordeMode),
    hordeDeckName: game.hordeDeckName ?? "",
    hordeSourceUrl: game.hordeSourceUrl ?? "",
    hordeDeck: hydrateDeck(game.hordeDeck),
    hordeDiscard: hydrateDeck(game.hordeDiscard),
    hordeBattlefield: hydrateDeck(game.hordeBattlefield),
    hordeRevealQueue: hydrateDeck(game.hordeRevealQueue),
    hordeCurrentCard: hydrateDeckCard(game.hordeCurrentCard),
    hordeResolutionPhase: hydrateHordePhase(game.hordeResolutionPhase),
    hordeTurn: Math.max(0, game.hordeTurn ?? 0),
    hordeSetupTurnsRemaining: Math.max(0, game.hordeSetupTurnsRemaining ?? 0),
    hordeSharedLife: Math.max(0, game.hordeSharedLife ?? 0),
    hordePendingChoice: hydrateHordeChoice(game.hordePendingChoice),
    hordeLastChoice: game.hordeLastChoice ?? "",
    hordeLog: Array.isArray(game.hordeLog) ? game.hordeLog.filter((entry) => entry && typeof entry.id === "string" && typeof entry.message === "string") : [],
    hordeStatus: hydrateHordeStatus(game.hordeStatus),
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

function hydrateArchenemyAiAction(action: ArchenemyAiAction | null | undefined) {
  if (action === "reveal_scheme" || action === "taunt" || action === "pressure_leader" || action === "recover" || action === "wait") {
    return action;
  }
  return null;
}

function hydrateDeck(deck: VariantDeckCard[] | undefined) {
  if (!Array.isArray(deck)) {
    return [];
  }

  return deck.flatMap((card) => {
    const hydrated = hydrateDeckCard(card);
    return hydrated ? [hydrated] : [];
  });
}

function hydrateDeckCard(card: VariantDeckCard | null | undefined) {
  if (!card || typeof card.id !== "string" || typeof card.name !== "string") {
    return null;
  }

  return {
    id: card.id,
    name: card.name,
    imageUrl: typeof card.imageUrl === "string" ? card.imageUrl : "",
    typeLine: typeof card.typeLine === "string" ? card.typeLine : "",
    oracleText: typeof card.oracleText === "string" ? card.oracleText : "",
    power: typeof card.power === "string" ? card.power : "",
    toughness: typeof card.toughness === "string" ? card.toughness : "",
    isToken: Boolean(card.isToken)
  };
}

function hydrateHordePhase(phase: HordeResolutionPhase | undefined): HordeResolutionPhase {
  return phase === "setup" || phase === "ready" || phase === "reveal" || phase === "tokens" || phase === "spell" || phase === "combat" || phase === "choice" || phase === "complete" ? phase : "ready";
}

function hydrateHordeStatus(status: CommanderGame["hordeStatus"] | undefined): CommanderGame["hordeStatus"] {
  return status === "setup" || status === "active" || status === "survivors_win" || status === "horde_wins" ? status : "setup";
}

function hydrateGameMode(mode: GameMode | undefined, hordeMode: boolean | undefined, archenemyMode: boolean, planechaseMode: boolean | undefined): GameMode {
  if (hordeMode) {
    return "horde";
  }
  if (archenemyMode) {
    return "archenemy";
  }
  if (planechaseMode) {
    return "planechase";
  }
  if (mode === "commander" || mode === "horde" || mode === "archenemy" || mode === "planechase") {
    return mode;
  }
  return "commander";
}

function hydrateSetupStatus(status: SetupStatus | undefined): SetupStatus {
  return status === "draft" || status === "ready" || status === "active" || status === "complete" ? status : "draft";
}

function hydrateHordeChoice(choice: HordePendingChoice | null | undefined) {
  if (!choice || !choice.sourceCard || typeof choice.prompt !== "string" || !Array.isArray(choice.options)) {
    return null;
  }
  const sourceCard = hydrateDeckCard(choice.sourceCard);
  return sourceCard ? { sourceCard, prompt: choice.prompt, options: choice.options.filter((option): option is string => typeof option === "string") } : null;
}
