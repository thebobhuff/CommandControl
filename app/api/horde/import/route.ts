import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type RawCard = {
  name?: unknown;
  quantity?: unknown;
  count?: unknown;
  boardType?: unknown;
  card?: RawCard;
  type_line?: unknown;
  typeLine?: unknown;
  oracle_text?: unknown;
  oracleText?: unknown;
  image_uris?: { normal?: unknown };
  imageUris?: { normal?: unknown };
  power?: unknown;
  toughness?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { url?: string; decklist?: string };
  const sourceUrl = body.url?.trim() ?? "";
  if (body.decklist?.trim()) {
    const cards = await hydrateCardNames(parseDecklist(body.decklist));
    if (cards.length > 0) {
      return NextResponse.json({ name: "Pasted Moxfield Horde", sourceUrl, cards });
    }
    return NextResponse.json({ error: "No card lines were found in the pasted decklist." }, { status: 422 });
  }
  const deckId = sourceUrl.match(/moxfield\.com\/decks\/([^/?#]+)/i)?.[1] ?? sourceUrl.match(/^([A-Za-z0-9_-]{8,})$/)?.[1];
  if (!deckId) {
    return NextResponse.json({ error: "Enter a public Moxfield deck URL." }, { status: 400 });
  }

  const candidates = [
    `https://api2.moxfield.com/v2/decks/all/${encodeURIComponent(deckId)}`,
    `https://api.moxfield.com/v2/decks/all/${encodeURIComponent(deckId)}`,
    `https://www.moxfield.com/decks/${encodeURIComponent(deckId)}`
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json,text/html", "User-Agent": "Commander-Control-Horde/1.0" }, cache: "no-store" });
      if (!response.ok) {
        continue;
      }
      const text = await response.text();
      const parsed = parsePayload(text, response.headers.get("content-type") ?? "");
      const cards = await hydrateCardNames(toNameQuantities(extractCards(parsed)));
      if (cards.length > 0) {
        const payloadName = parsed && typeof parsed === "object" && "name" in parsed ? (parsed as { name?: unknown }).name : "";
        return NextResponse.json({ name: readString(payloadName) || `Moxfield Horde ${deckId}`, sourceUrl, cards });
      }
    } catch {
      // Try the next Moxfield endpoint or return a useful import error below.
    }
  }

  // Some deployments block direct server-to-Moxfield requests but allow a public
  // read-only proxy to retrieve the same endpoint. This is a fallback only.
  try {
    const proxyTarget = `https://api2.moxfield.com/v3/decks/all/${encodeURIComponent(deckId)}`;
    const proxyResponse = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(proxyTarget)}`, { cache: "no-store" });
    if (proxyResponse.ok) {
      const cards = await hydrateCardNames(toNameQuantities(extractCards(await proxyResponse.json().catch(() => null))));
      if (cards.length > 0) {
        return NextResponse.json({ name: `Moxfield Horde ${deckId}`, sourceUrl, cards });
      }
    }
  } catch {
    // Fall through to the actionable import error below.
  }

  return NextResponse.json({ error: "Moxfield is blocking automated server access to this public deck. Use Moxfield's Copy/Export decklist action and paste the list into the fallback box; the URL will still be stored with the game." }, { status: 422 });
}

function parseDecklist(decklist: string) {
  const cards: Array<{ name: string; quantity: number; isTokenHint?: boolean }> = [];
  let section = "mainboard";
  for (const rawLine of decklist.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const sectionMatch = line.match(/^\[?\s*(commander|mainboard|sideboard|maybeboard|tokens?)\s*\]?\s*:?$/i);
    if (sectionMatch) {
      section = sectionMatch[1].toLowerCase();
      continue;
    }
    if (section === "maybeboard") {
      continue;
    }
    const match = line.match(/^(\d+)\s*x?\s+(.+?)\s*$/i);
    if (!match) {
      continue;
    }
    const setMatch = match[2].match(/\s+\(([A-Za-z0-9]{2,8})\)\s+[A-Za-z0-9-]+(?:\s+\*F\*)?\s*$/i);
    const name = match[2]
      .replace(/\s+\([A-Za-z0-9]{2,8}\)\s+[A-Za-z0-9-]+(?:\s+\*F\*)?\s*$/i, "")
      .replace(/\s+\[[A-Za-z0-9]{2,8}\]\s+[A-Za-z0-9-]+(?:\s+\*F\*)?\s*$/i, "")
      .replace(/\s+\[[A-Za-z0-9]{2,8}\]$/, "")
      .replace(/\s+\*F\*\s*$/i, "")
      .replace(/\s+\/\s+/g, " // ")
      .trim();
    if (name) {
      cards.push({ name, quantity: Math.max(1, Number(match[1])), isTokenHint: Boolean(setMatch?.[1].toUpperCase().startsWith("T")) });
    }
  }
  return cards;
}

function toNameQuantities(cards: Array<{ name: string; isTokenHint?: boolean }>) {
  const quantities = new Map<string, { name: string; quantity: number; isTokenHint?: boolean }>();
  for (const card of cards) {
    const existing = quantities.get(card.name.toLowerCase());
    if (existing) {
      existing.quantity += 1;
      existing.isTokenHint = existing.isTokenHint || card.isTokenHint;
    } else {
      quantities.set(card.name.toLowerCase(), { name: card.name, quantity: 1 });
    }
  }
  return Array.from(quantities.values());
}

async function hydrateCardNames(input: Array<{ name: string; quantity: number; isTokenHint?: boolean }>) {
  const unique = Array.from(new Map(input.map((card) => [card.name.toLowerCase(), card])).values()).slice(0, 150);
  const enriched: Array<{ id: string; name: string; imageUrl: string; typeLine: string; oracleText: string; power: string; toughness: string; isToken: boolean }> = [];
  for (let index = 0; index < unique.length; index += 8) {
    const batch = unique.slice(index, index + 8);
    const results = await Promise.all(batch.map(async (card) => {
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}`, { headers: { Accept: "application/json", "User-Agent": "Commander-Control-Horde/1.0" }, cache: "force-cache" });
        if (!response.ok) {
          return { card, data: null };
        }
        return { card, data: (await response.json()) as { id?: string; name?: string; image_uris?: { normal?: string }; card_faces?: Array<{ image_uris?: { normal?: string } }>; type_line?: string; oracle_text?: string; power?: string; toughness?: string } };
      } catch {
        return { card, data: null };
      }
    }));
    for (const result of results) {
      const data = result.data;
      for (let copy = 0; copy < result.card.quantity; copy += 1) {
        const name = data?.name ?? result.card.name;
        enriched.push({ id: `${data?.id ?? name}-${copy}-${enriched.length}`, name, imageUrl: data?.image_uris?.normal ?? data?.card_faces?.[0]?.image_uris?.normal ?? "", typeLine: data?.type_line ?? "", oracleText: data?.oracle_text ?? "", power: data?.power ?? "", toughness: data?.toughness ?? "", isToken: Boolean(result.card.isTokenHint) || /token/i.test(data?.type_line ?? "") || /^\d+\/\d+\s+/i.test(name) });
      }
    }
  }
  return enriched;
}

function parsePayload(text: string, contentType: string) {
  if (contentType.includes("json")) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return null;
    }
  }
  const nextData = text.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) {
    try {
      return JSON.parse(nextData) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

function extractCards(payload: unknown) {
  const result: Array<{ id: string; name: string; imageUrl: string; typeLine: string; oracleText: string; power: string; toughness: string; isToken: boolean }> = [];
  const seen = new Set<string>();

  function visit(value: unknown) {
    if (!value || typeof value !== "object") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const item = value as RawCard;
    const card = item.card && typeof item.card === "object" ? item.card : item;
    const name = readString(card.name);
    if (name && (card.quantity !== undefined || item.quantity !== undefined || card.count !== undefined || item.count !== undefined)) {
      const quantity = Math.max(1, Math.min(1000, Number(card.quantity ?? card.count ?? item.quantity ?? item.count ?? 1)) || 1);
      const typeLine = readString(card.type_line ?? card.typeLine);
      const oracleText = readString(card.oracle_text ?? card.oracleText);
      const imageUrl = readString(card.image_uris?.normal ?? card.imageUris?.normal);
      const id = `${name.toLowerCase()}-${result.length}`;
      for (let index = 0; index < quantity; index += 1) {
        const copyId = `${id}-${index}`;
        if (!seen.has(copyId)) {
          seen.add(copyId);
          result.push({ id: copyId, name, imageUrl, typeLine, oracleText, power: readString(card.power), toughness: readString(card.toughness), isToken: /token/i.test(typeLine) || /^\d+\/\d+\s+/i.test(name) });
        }
      }
    }
    Object.values(item).forEach(visit);
  }

  visit(payload);
  return result;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}
