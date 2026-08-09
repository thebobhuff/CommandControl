import { createId, type CommanderGame, type HordeLogEntry, type HordeResolutionPhase, type VariantDeckCard } from "@/lib/commander";

export type ImportedHordeDeck = {
  name: string;
  cards: VariantDeckCard[];
  sourceUrl: string;
};

export function startHordeGame(game: CommanderGame, deck: ImportedHordeDeck): CommanderGame {
  const startingLife = Math.max(20, game.players.length * 20);
  return {
    ...game,
    hordeMode: true,
    hordeDeckName: deck.name,
    hordeSourceUrl: deck.sourceUrl,
    hordeDeck: shuffle(deck.cards),
    hordeDiscard: [],
    hordeBattlefield: [],
    hordeRevealQueue: [],
    hordeCurrentCard: null,
    hordeResolutionPhase: "setup",
    hordeTurn: 0,
    hordeSetupTurnsRemaining: 3,
    hordeSharedLife: startingLife,
    hordePendingChoice: null,
    hordeLastChoice: "",
    hordeLog: [makeLog(`Horde deck loaded: ${deck.name} (${deck.cards.length} cards). Survivors get three setup turns.`, "setup")],
    hordeStatus: "setup",
    winnerPlayerId: null
  };
}

export function advanceHordeTurn(game: CommanderGame): CommanderGame {
  if (!game.hordeMode || game.hordeStatus === "survivors_win" || game.hordeStatus === "horde_wins" || game.hordePendingChoice) {
    return game;
  }

  if (game.hordeSetupTurnsRemaining > 0) {
    const remaining = game.hordeSetupTurnsRemaining - 1;
    return {
      ...game,
      hordeSetupTurnsRemaining: remaining,
      hordeResolutionPhase: remaining > 0 ? "setup" : "ready",
      hordeStatus: remaining > 0 ? "setup" : "active",
      hordeLog: appendLog(game, `Survivor setup turn completed. ${remaining} setup turn${remaining === 1 ? "" : "s"} remaining.`, "setup")
    };
  }

  let next: CommanderGame = {
    ...game,
    hordeTurn: game.hordeTurn + 1,
    hordeResolutionPhase: "reveal",
    hordeCurrentCard: null,
    hordeRevealQueue: [],
    hordePendingChoice: null,
    hordeLastChoice: ""
  };

  const revealed: VariantDeckCard[] = [];
  let deck = [...next.hordeDeck];
  while (deck.length > 0) {
    const [card, ...rest] = deck;
    deck = rest;
    revealed.push(card);
    if (!card.isToken) {
      break;
    }
  }

  if (revealed.length === 0) {
    return evaluateHordeWin({ ...next, hordeDeck: deck, hordeResolutionPhase: "complete" });
  }

  const nonToken = revealed[revealed.length - 1]?.isToken ? null : revealed[revealed.length - 1];
  const tokens = nonToken ? revealed.slice(0, -1) : revealed;
  next = {
    ...next,
    hordeDeck: deck,
    hordeRevealQueue: revealed,
    hordeCurrentCard: nonToken,
    hordeResolutionPhase: tokens.length > 0 ? "tokens" : "spell",
    hordeLog: appendLog(next, `Horde turn ${next.hordeTurn}: revealed ${revealed.map((card) => card.name).join(", ")}.`, "reveal")
  };

  if (tokens.length > 0) {
    next = {
      ...next,
      hordeBattlefield: [...next.hordeBattlefield, ...tokens],
      hordeRevealQueue: revealed,
      hordeLog: appendLog(next, `Put ${tokens.length} token${tokens.length === 1 ? "" : "s"} onto the Horde battlefield.`, "tokens")
    };
  }

  if (nonToken) {
    next = resolveNonToken(next, nonToken);
  }

  if (next.hordePendingChoice) {
    return next;
  }

  return resolveHordeCombat(next);
}

export function resolveHordeChoice(game: CommanderGame): CommanderGame {
  const choice = game.hordePendingChoice;
  if (!choice) {
    return game;
  }
  const result = choice.options[Math.floor(Math.random() * choice.options.length)] ?? "No valid option";
  const next = {
    ...game,
    hordePendingChoice: null,
    hordeLastChoice: result,
    hordeResolutionPhase: "spell" as HordeResolutionPhase,
    hordeLog: appendLog(game, `Random determination: ${result}.`, "choice")
  };
  return resolveHordeCombat(next);
}

export function millHorde(game: CommanderGame, amount: number): CommanderGame {
  const count = Math.max(0, Math.min(amount, game.hordeDeck.length));
  if (count === 0) {
    return game;
  }
  const milled = game.hordeDeck.slice(0, count);
  const next = {
    ...game,
    hordeDeck: game.hordeDeck.slice(count),
    hordeDiscard: [...milled, ...game.hordeDiscard],
    hordeLog: appendLog(game, `Survivors dealt ${count} damage to the Horde and milled ${count} card${count === 1 ? "" : "s"}.`, "ready")
  };
  return evaluateHordeWin(next);
}

export function returnHordeCardToBattlefield(game: CommanderGame, cardId: string): CommanderGame {
  const card = game.hordeDiscard.find((candidate) => candidate.id === cardId);
  if (!card) {
    return game;
  }
  return {
    ...game,
    hordeDiscard: game.hordeDiscard.filter((candidate) => candidate.id !== cardId),
    hordeBattlefield: [...game.hordeBattlefield, card],
    hordeLog: appendLog(game, `${card.name} returned from the Horde graveyard to the battlefield.`, "spell")
  };
}

export function moveHordeCardToGraveyard(game: CommanderGame, cardId: string): CommanderGame {
  const card = game.hordeBattlefield.find((candidate) => candidate.id === cardId);
  if (!card) {
    return game;
  }
  return {
    ...game,
    hordeBattlefield: game.hordeBattlefield.filter((candidate) => candidate.id !== cardId),
    hordeDiscard: [card, ...game.hordeDiscard],
    hordeLog: appendLog(game, `${card.name} moved from the battlefield to the Horde graveyard.`, "spell")
  };
}

function resolveNonToken(game: CommanderGame, card: VariantDeckCard): CommanderGame {
  const oracle = card.oracleText?.toLowerCase() ?? "";
  if (/choose|target|random/.test(oracle)) {
    return {
      ...game,
      hordeResolutionPhase: "choice",
      hordePendingChoice: {
        sourceCard: card,
        prompt: `The Horde needs a choice for ${card.name}. Randomly determine the target or mode.`,
        options: game.players.map((player) => player.name).concat("All survivors")
      },
      hordeLog: appendLog(game, `${card.name} is waiting for a random determination.`, "choice")
    };
  }

  const isCreature = card.typeLine?.toLowerCase().includes("creature");
  let next: CommanderGame = {
    ...game,
    hordeResolutionPhase: "spell",
    hordeBattlefield: isCreature ? [...game.hordeBattlefield, card] : game.hordeBattlefield,
    hordeDiscard: isCreature ? game.hordeDiscard : [card, ...game.hordeDiscard],
    hordeLog: appendLog(game, isCreature ? `${card.name} entered the Horde battlefield.` : `${card.name} resolved and went to the Horde graveyard.`, "spell")
  };
  next = resolveHordeCardText(next, card);
  return next;
}

function resolveHordeCardText(game: CommanderGame, card: VariantDeckCard): CommanderGame {
  const text = card.oracleText ?? "";
  const match = text.match(/(?:create|put)\s+(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen)\s+(?:\d+\/\d+\s+)?(?:black\s+)?zombie creature tokens?/i);
  if (!match) {
    return game;
  }
  const amount = parseTokenAmount(match[1]);
  if (amount <= 0) {
    return game;
  }
  const template = [...game.hordeDeck, ...game.hordeBattlefield, ...game.hordeDiscard].find((candidate) => candidate.isToken && /zombie/i.test(candidate.name))
    ?? [...game.hordeDeck, ...game.hordeBattlefield, ...game.hordeDiscard].find((candidate) => candidate.isToken);
  const tokens = Array.from({ length: amount }, (_, index) => ({
    ...(template ?? { imageUrl: "", oracleText: "", power: "2", toughness: "2" }),
    id: `${card.id}-created-token-${index}-${createId()}`,
    name: template?.name ?? "Zombie Token",
    typeLine: template?.typeLine || "Token Creature — Zombie",
    power: template?.power || "2",
    toughness: template?.toughness || "2",
    isToken: true
  }));
  return {
    ...game,
    hordeBattlefield: [...game.hordeBattlefield, ...tokens],
    hordeLog: appendLog(game, `${card.name}: created ${amount} Zombie token${amount === 1 ? "" : "s"}.`, "spell")
  };
}

function parseTokenAmount(value: string) {
  const words: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15 };
  return Number(value) || words[value.toLowerCase()] || 0;
}

function resolveHordeCombat(game: CommanderGame): CommanderGame {
  const attackers = game.hordeBattlefield.filter((card) => card.typeLine?.toLowerCase().includes("creature"));
  const damage = attackers.reduce((total, card) => total + parsePower(card.power), 0);
  const sharedLife = Math.max(0, game.hordeSharedLife - damage);
  const next = {
    ...game,
    hordeSharedLife: sharedLife,
    hordeResolutionPhase: "combat" as HordeResolutionPhase,
    hordeLog: appendLog(game, damage > 0 ? `Combat: ${attackers.length} Horde creature${attackers.length === 1 ? "" : "s"} attacked for ${damage}.` : "Combat: no Horde creatures were able to attack.", "combat"),
    hordeStatus: sharedLife === 0 ? "horde_wins" as const : game.hordeStatus
  };
  if (sharedLife === 0) {
    return { ...next, hordeResolutionPhase: "complete" };
  }
  return evaluateHordeWin({ ...next, hordeResolutionPhase: "ready" });
}

function evaluateHordeWin(game: CommanderGame): CommanderGame {
  if (game.hordeSharedLife <= 0) {
    return { ...game, hordeStatus: "horde_wins", hordeResolutionPhase: "complete" };
  }
  if (game.hordeDeck.length === 0 && game.hordeBattlefield.filter((card) => card.typeLine?.toLowerCase().includes("creature")).length === 0) {
    return { ...game, hordeStatus: "survivors_win", hordeResolutionPhase: "complete" };
  }
  return game;
}

function parsePower(power: string | undefined) {
  const value = Number.parseInt(power ?? "0", 10);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function appendLog(game: CommanderGame, message: string, phase: HordeResolutionPhase) {
  return [...game.hordeLog, makeLog(message, phase)].slice(-30);
}

function makeLog(message: string, phase: HordeResolutionPhase): HordeLogEntry {
  return { id: createId(), message, phase, createdAt: Date.now() };
}

function shuffle<T>(cards: T[]) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
