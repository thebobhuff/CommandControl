import { NextResponse } from "next/server";
import { createAccessToken, createDefaultGame } from "@/lib/commander";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ games: [] }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("commander_games")
    .select("id,name,is_active,display_token,control_token,created_at,updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ games: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const state = body.state ?? createDefaultGame();
  const name = body.name ?? "Commander Game";
  const displayToken = createAccessToken();
  const controlToken = createAccessToken();

  const { data, error } = await supabase
    .from("commander_games")
    .insert({
      owner_id: user.id,
      name,
      state,
      display_token: displayToken,
      control_token: controlToken
    })
    .select("id,name,state,display_token,control_token,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
