import { NextResponse } from "next/server";
import { createDefaultGame, hydrateCommanderDamage, type CommanderGame } from "@/lib/commander";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

let gameState: CommanderGame = createDefaultGame();
type TokenGameRow = { state?: unknown } | null;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  const token = searchParams.get("token");

  if (user && gameId) {
    const { data, error } = await supabase
      .from("commander_games")
      .select("state")
      .eq("id", gameId)
      .eq("owner_id", user.id)
      .single();

    const tokenGame = data as TokenGameRow;
    if (!error && tokenGame?.state) {
      return NextResponse.json(hydrateCommanderDamage(tokenGame.state as CommanderGame));
    }
  }

  if (gameId && token) {
    const { data, error } = await supabase
      .rpc("get_commander_game_by_token", {
        requested_game_id: gameId,
        access_token: token
      })
      .single();

    const tokenGame = data as TokenGameRow;
    if (!error && tokenGame?.state) {
      return NextResponse.json(hydrateCommanderDamage(tokenGame.state as CommanderGame));
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
  const token = searchParams.get("token");
  const incoming = (await request.json()) as CommanderGame;
  gameState = hydrateCommanderDamage({
    ...incoming,
    updatedAt: Date.now()
  });

  if (user && gameId) {
    const { data, error } = await supabase
      .from("commander_games")
      .update({
        state: gameState,
        name: gameState.players.map((player) => player.name).join(" vs ").slice(0, 80) || "Commander Game"
      })
      .eq("id", gameId)
      .eq("owner_id", user.id)
      .select("state")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (data?.state) {
      return NextResponse.json(hydrateCommanderDamage(data.state as CommanderGame));
    }
  }

  if (gameId && token) {
    const name = gameState.players.map((player) => player.name).join(" vs ").slice(0, 80) || "Commander Game";
    const { data, error } = await supabase
      .rpc("update_commander_game_by_control_token", {
        requested_game_id: gameId,
        access_token: token,
        next_state: gameState,
        next_name: name
      })
      .single();

    const tokenGame = data as TokenGameRow;
    if (!error && tokenGame?.state) {
      return NextResponse.json(hydrateCommanderDamage(tokenGame.state as CommanderGame));
    }

    return NextResponse.json({ error: error?.message ?? "Invalid game token" }, { status: 403 });
  }

  return NextResponse.json(gameState);
}
