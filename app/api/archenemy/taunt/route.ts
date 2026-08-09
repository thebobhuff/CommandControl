import { NextResponse } from "next/server";
import { generateSchemeTaunt } from "@/lib/archenemy-ai";
import { hydrateCommanderDamage, type CommanderGame, type VariantDeckCard } from "@/lib/commander";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { game?: CommanderGame; scheme?: VariantDeckCard };
  if (!body.game || !body.scheme) {
    return NextResponse.json({ error: "Game and scheme are required" }, { status: 400 });
  }
  const game = hydrateCommanderDamage(body.game);
  if (!game.archenemyMode) {
    return NextResponse.json({ error: "Archenemy mode is not enabled" }, { status: 400 });
  }
  return NextResponse.json({ taunt: await generateSchemeTaunt(game, body.scheme) });
}
