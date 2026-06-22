import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ players: [] }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("commander_players")
    .select("id,display_name,favorite_commander,background_image,moxfield_deck_url,created_at,updated_at")
    .eq("owner_id", user.id)
    .order("display_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ players: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from("commander_players")
    .insert({
      owner_id: user.id,
      display_name: body.display_name,
      favorite_commander: body.favorite_commander ?? null,
      background_image: body.background_image ?? null,
      moxfield_deck_url: body.moxfield_deck_url ?? null
    })
    .select("id,display_name,favorite_commander,background_image,moxfield_deck_url,created_at,updated_at")
    .single();

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

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "Player id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("commander_players")
    .update({
      display_name: body.display_name,
      favorite_commander: body.favorite_commander ?? null,
      background_image: body.background_image ?? null,
      moxfield_deck_url: body.moxfield_deck_url ?? null
    })
    .eq("id", body.id)
    .eq("owner_id", user.id)
    .select("id,display_name,favorite_commander,background_image,moxfield_deck_url,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
