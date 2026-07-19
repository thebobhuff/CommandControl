import { NextResponse } from "next/server";
import { decideArchenemyAction } from "@/lib/archenemy-ai";
import { hydrateCommanderDamage, type CommanderGame } from "@/lib/commander";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { game?: CommanderGame };
  if (!body.game) {
    return NextResponse.json({ error: "Game state is required" }, { status: 400 });
  }

  const game = hydrateCommanderDamage(body.game);
  if (!game.archenemyMode) {
    return NextResponse.json({ error: "Archenemy mode is not enabled" }, { status: 400 });
  }

  const decision = await decideArchenemyAction(game);
  return NextResponse.json(decision);
}
