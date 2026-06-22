import { NextResponse } from "next/server";
import { createAccessToken, createDefaultGame } from "@/lib/commander";
import { createAdminClient } from "@/utils/supabase/admin";
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

  const admin = createAdminClient();
  if (admin && user.email) {
    await admin
      .from("commander_game_invites")
      .update({ invited_user_id: user.id, status: "added" })
      .eq("invitee_email", user.email.trim().toLowerCase())
      .eq("status", "pending");
  }

  const { data, error } = await supabase
    .from("commander_games")
    .select("id,name,is_active,display_token,control_token,created_at,updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  if (error && isMissingTokenColumnError(error.message)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("commander_games")
      .select("id,name,is_active,created_at,updated_at")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    if (legacyError) {
      return NextResponse.json({ error: legacyError.message }, { status: 500 });
    }

    return NextResponse.json({
      games: (legacyData ?? []).map((game) => ({
        ...game,
        display_token: null,
        control_token: null
      }))
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ownedGames = (data ?? []).map((game) => ({ ...game, access_role: "owner" }));
  const invitedGames = admin && user.email ? await fetchInvitedGames(admin, user.id, user.email) : [];

  return NextResponse.json({ games: mergeGames(ownedGames, invitedGames) });
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

  if (error && isMissingTokenColumnError(error.message)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("commander_games")
      .insert({
        owner_id: user.id,
        name,
        state
      })
      .select("id,name,state,created_at,updated_at")
      .single();

    if (legacyError) {
      return NextResponse.json({ error: legacyError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...legacyData,
      display_token: null,
      control_token: null
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return NextResponse.json({ error: "Game id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("commander_games")
    .update({
      is_active: Boolean(body.is_active)
    })
    .eq("id", body.id)
    .eq("owner_id", user.id)
    .select("id,name,is_active,display_token,control_token,created_at,updated_at")
    .single();

  if (error && isMissingTokenColumnError(error.message)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("commander_games")
      .update({
        is_active: Boolean(body.is_active)
      })
      .eq("id", body.id)
      .eq("owner_id", user.id)
      .select("id,name,is_active,created_at,updated_at")
      .single();

    if (legacyError) {
      return NextResponse.json({ error: legacyError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...legacyData,
      display_token: null,
      control_token: null
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

function isMissingTokenColumnError(message: string) {
  return message.includes("display_token") || message.includes("control_token");
}

async function fetchInvitedGames(admin: NonNullable<ReturnType<typeof createAdminClient>>, userId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const { data: invites } = await admin
    .from("commander_game_invites")
    .select("game_id")
    .eq("status", "added")
    .or(`invited_user_id.eq.${userId},invitee_email.eq.${normalizedEmail}`);

  const gameIds = [...new Set((invites ?? []).map((invite) => invite.game_id).filter(Boolean))];
  if (gameIds.length === 0) {
    return [];
  }

  const { data } = await admin
    .from("commander_games")
    .select("id,name,is_active,display_token,control_token,created_at,updated_at")
    .in("id", gameIds)
    .order("updated_at", { ascending: false });

  return (data ?? []).map((game) => ({ ...game, access_role: "invited" }));
}

function mergeGames<T extends { id: string }>(ownedGames: T[], invitedGames: T[]) {
  const seen = new Set<string>();
  return [...ownedGames, ...invitedGames].filter((game) => {
    if (seen.has(game.id)) {
      return false;
    }
    seen.add(game.id);
    return true;
  });
}
