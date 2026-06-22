import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ invites: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");
  let query = supabase
    .from("commander_game_invites")
    .select("id,game_id,owner_id,invitee_email,invited_user_id,status,created_at,updated_at")
    .eq("owner_id", user.id)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (gameId) {
    query = query.eq("game_id", gameId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invites: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { gameId?: string; email?: string };
  const gameId = body.gameId?.trim();
  const inviteeEmail = normalizeEmail(body.email);

  if (!gameId) {
    return NextResponse.json({ error: "Game id is required" }, { status: 400 });
  }

  if (!inviteeEmail) {
    return NextResponse.json({ error: "Invitee email is required" }, { status: 400 });
  }

  if (inviteeEmail === normalizeEmail(user.email)) {
    return NextResponse.json({ error: "You already own this account session." }, { status: 400 });
  }

  const { data: game, error: gameError } = await supabase
    .from("commander_games")
    .select("id,name,owner_id")
    .eq("id", gameId)
    .eq("owner_id", user.id)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: gameError?.message ?? "Game not found" }, { status: 404 });
  }

  const admin = createAdminClient();
  const platformUser = admin ? await findPlatformUserByEmail(admin, inviteeEmail) : null;
  const status = platformUser ? "added" : "pending";

  const { data: invite, error: inviteError } = await supabase
    .from("commander_game_invites")
    .upsert(
      {
        game_id: gameId,
        owner_id: user.id,
        invitee_email: inviteeEmail,
        invited_user_id: platformUser?.id ?? null,
        status
      },
      { onConflict: "game_id,invitee_email" }
    )
    .select("id,game_id,owner_id,invitee_email,invited_user_id,status,created_at,updated_at")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: inviteError?.message ?? "Unable to save invite" }, { status: 500 });
  }

  if (platformUser) {
    return NextResponse.json({ invite, deliveryProvider: "platform" });
  }

  const appOrigin = configuredSiteUrl ?? new URL(request.url).origin;
  const acceptLink = `${appOrigin}/login?email=${encodeURIComponent(inviteeEmail)}`;
  let appEmailError: Error | null = null;

  try {
    const result = await sendEmail({
      to: inviteeEmail,
      subject: `You're invited to ${game.name} on Commander Control`,
      html: buildInviteEmailHtml(game.name, acceptLink),
      text: buildInviteEmailText(game.name, acceptLink)
    });

    return NextResponse.json({ invite, deliveryProvider: result.provider });
  } catch (error) {
    appEmailError = error instanceof Error ? error : new Error("Unable to send invite email.");
  }

  if (admin) {
    const { error: supabaseInviteError } = await admin.auth.admin.inviteUserByEmail(inviteeEmail, {
      redirectTo: `${appOrigin}/games`
    });

    if (!supabaseInviteError) {
      return NextResponse.json({ invite, deliveryProvider: "supabase" });
    }

    return NextResponse.json(
      {
        error: `Invite saved, but email delivery failed. App email: ${appEmailError.message}. Supabase fallback: ${supabaseInviteError.message}`,
        invite
      },
      { status: 502 }
    );
  }

  return NextResponse.json(
    {
      error: `Invite saved, but email delivery failed: ${appEmailError.message}`,
      invite
    },
    { status: 502 }
  );
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Invite id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("commander_game_invites")
    .update({ status: "revoked" })
    .eq("id", body.id)
    .eq("owner_id", user.id)
    .select("id,game_id,owner_id,invitee_email,invited_user_id,status,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

function normalizeEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase();
  return normalized && normalized.includes("@") ? normalized : "";
}

async function findPlatformUserByEmail(admin: NonNullable<ReturnType<typeof createAdminClient>>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      return null;
    }

    const match = data.users.find((candidate) => normalizeEmail(candidate.email) === email);
    if (match) {
      return match;
    }

    if (data.users.length < 1000) {
      return null;
    }
  }

  return null;
}

function buildInviteEmailHtml(gameName: string, acceptLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin: 0 0 12px;">You are invited to a Commander game</h1>
      <p>You have been invited to join <strong>${escapeHtml(gameName)}</strong> on Commander Control.</p>
      <p style="margin: 24px 0;">
        <a href="${acceptLink}" style="background: #f4b840; color: #111827; padding: 12px 18px; border-radius: 8px; display: inline-block; font-weight: 700; text-decoration: none;">
          Join the game
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><a href="${acceptLink}">${acceptLink}</a></p>
    </div>
  `;
}

function buildInviteEmailText(gameName: string, acceptLink: string) {
  return [
    "You are invited to a Commander game",
    "",
    `You have been invited to join ${gameName} on Commander Control.`,
    acceptLink
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
