import { NextResponse } from "next/server";
import { createDefaultGame, hydrateCommanderDamage, type CommanderGame } from "@/lib/commander";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

let gameState: CommanderGame = createDefaultGame();

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  if (user && gameId) {
    const { data, error } = await supabase
      .from("commander_games")
      .select("state")
      .eq("id", gameId)
      .eq("owner_id", user.id)
      .single();

    if (!error && data?.state) {
      return NextResponse.json(hydrateCommanderDamage(data.state as CommanderGame));
    }
  }

  return NextResponse.json(gameState);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  const incoming = (await request.json()) as CommanderGame;
  gameState = hydrateCommanderDamage({
    ...incoming,
    updatedAt: Date.now()
  });

  if (user && gameId) {
    const { error } = await supabase
      .from("commander_games")
      .update({
        state: gameState,
        name: gameState.players.map((player) => player.name).join(" vs ").slice(0, 80) || "Commander Game"
      })
      .eq("id", gameId)
      .eq("owner_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json(gameState);
}
