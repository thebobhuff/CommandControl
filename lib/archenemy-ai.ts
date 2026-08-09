import type { ArchenemyAiAction, CommanderGame, CommanderPlayer } from "@/lib/commander";

export type ArchenemyAiDecision = {
  action: ArchenemyAiAction;
  taunt: string;
  plan: string;
  targetPlayerId: string | null;
};

export async function generateSchemeTaunt(game: CommanderGame, scheme: { name: string; oracleText?: string }) {
  const fallback = `${scheme.name} is in motion. Read it carefully, heroes; I want you to understand exactly how you lose.`;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": APP_URL,
        "X-OpenRouter-Title": "Commander Control",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a theatrical Magic: The Gathering Archenemy. Write one sharp, intimidating table taunt about the newly revealed scheme. Do not explain rules. Keep it under 180 characters, avoid profanity, and return only the taunt text."
          },
          {
            role: "user",
            content: JSON.stringify({ aiName: game.archenemyAiName, persona: game.archenemyAiPersona, schemeName: scheme.name, schemeText: scheme.oracleText ?? "" })
          }
        ]
      })
    });
    if (!response.ok) {
      return fallback;
    }
    const result = (await response.json()) as ChatCompletionResponse;
    const taunt = result.choices?.[0]?.message?.content?.trim().replace(/^['"]|['"]$/g, "").slice(0, 180);
    return taunt || fallback;
  } catch {
    return fallback;
  }
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENROUTER_MODEL ?? "openrouter/auto";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mtgcommandercontrol.com";

export async function decideArchenemyAction(game: CommanderGame): Promise<ArchenemyAiDecision> {
  const fallback = createFallbackDecision(game);
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": APP_URL,
        "X-OpenRouter-Title": "Commander Control",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are the AI Archenemy Director for a Magic: The Gathering Commander game. You do not resolve card rules. You choose a dramatic, table-useful archenemy action and speak in a concise villain voice. Return only valid JSON with action, taunt, plan, and targetPlayerId. Valid actions: reveal_scheme, taunt, pressure_leader, recover, wait."
          },
          {
            role: "user",
            content: JSON.stringify(createAiPromptPayload(game))
          }
        ]
      })
    });

    if (!response.ok) {
      return fallback;
    }

    const result = (await response.json()) as ChatCompletionResponse;
    const raw = result.choices?.[0]?.message?.content;
    if (!raw) {
      return fallback;
    }

    return normalizeDecision(JSON.parse(raw), game, fallback);
  } catch {
    return fallback;
  }
}

function createAiPromptPayload(game: CommanderGame) {
  const archenemy = game.players.find((player) => player.id === game.archenemyPlayerId) ?? game.players[0] ?? null;
  const heroes = game.players.filter((player) => player.id !== archenemy?.id);

  return {
    aiName: game.archenemyAiName,
    persona: game.archenemyAiPersona,
    deckName: game.archenemyDeckName,
    deckPresetId: game.archenemyDeckPresetId,
    schemeCount: game.archenemySchemeCount,
    currentScheme: game.archenemyCurrentScheme?.name ?? (game.archenemyScheme || null),
    schemeDeckRemaining: game.archenemyDeck.length,
    schemeDiscardCount: game.archenemyDiscard.length,
    archenemy: archenemy ? summarizePlayer(archenemy) : null,
    heroes: heroes.map(summarizePlayer),
    activePlayerId: game.activePlayerId,
    turnSeconds: game.turnSeconds,
    instruction:
      "Prefer reveal_scheme when there is no current scheme and the scheme deck has cards. Prefer pressure_leader against the healthiest or most threatening hero. Prefer recover when the archenemy is behind on life. Keep taunt under 140 characters and plan under 180 characters."
  };
}

function summarizePlayer(player: CommanderPlayer) {
  return {
    id: player.id,
    name: player.name,
    commander: player.commanderName || player.backgroundCardName || null,
    life: player.life,
    poison: player.poison,
    experience: player.experience,
    energy: player.energy,
    treasure: player.treasure,
    isMonarch: player.isMonarch,
    hasInitiative: player.hasInitiative,
    hasCityBlessing: player.hasCityBlessing,
    commanderDamageTaken: player.commanderDamage
  };
}

function createFallbackDecision(game: CommanderGame): ArchenemyAiDecision {
  const archenemy = game.players.find((player) => player.id === game.archenemyPlayerId) ?? game.players[0] ?? null;
  const heroes = game.players.filter((player) => player.id !== archenemy?.id);
  const target = [...heroes].sort((left, right) => right.life - left.life)[0] ?? null;

  if (!game.archenemyCurrentScheme && game.archenemyDeck.length + game.archenemyDiscard.length > 0) {
    return {
      action: "reveal_scheme",
      taunt: "The next phase of my design begins. Look upon it and despair.",
      plan: "Set a new scheme in motion, then pressure the healthiest hero before the team stabilizes.",
      targetPlayerId: target?.id ?? null
    };
  }

  if (archenemy && heroes.length > 0 && archenemy.life <= Math.max(...heroes.map((player) => player.life))) {
    return {
      action: "recover",
      taunt: "You mistake a wounded tyrant for a defeated one.",
      plan: "Play defensively, preserve the archenemy life total, and let the current scheme pull the heroes off balance.",
      targetPlayerId: target?.id ?? null
    };
  }

  return {
    action: "pressure_leader",
    taunt: target ? `${target.name}, your optimism is becoming a liability.` : "Continue. It makes the collapse more satisfying.",
    plan: target ? `Focus attacks and scheme pressure on ${target.name}, the hero best positioned to rally the table.` : "Keep the scheme visible and force the heroes to answer it.",
    targetPlayerId: target?.id ?? null
  };
}

function normalizeDecision(value: unknown, game: CommanderGame, fallback: ArchenemyAiDecision): ArchenemyAiDecision {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const action = readAction(record.action) ?? fallback.action;
  const targetPlayerId = typeof record.targetPlayerId === "string" && game.players.some((player) => player.id === record.targetPlayerId) ? record.targetPlayerId : fallback.targetPlayerId;

  return {
    action,
    taunt: readText(record.taunt, 180) || fallback.taunt,
    plan: readText(record.plan, 240) || fallback.plan,
    targetPlayerId
  };
}

function readAction(value: unknown): ArchenemyAiAction | null {
  if (value === "reveal_scheme" || value === "taunt" || value === "pressure_leader" || value === "recover" || value === "wait") {
    return value;
  }
  return null;
}

function readText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.slice(0, maxLength).trim() : "";
}
