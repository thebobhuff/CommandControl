import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const appOrigin = configuredSiteUrl ?? new URL(request.url).origin;
  const redirectTo = `${appOrigin}/reset-password`;
  let appEmailError: Error | null = null;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: {
        redirectTo
      }
    });

    if (error) {
      if (error.message.toLowerCase().includes("user")) {
        return NextResponse.json({ ok: true });
      }

      appEmailError = error;
    } else {
      const actionLink = data.properties?.action_link;
      if (!actionLink) {
        appEmailError = new Error("Unable to generate password reset link.");
      } else {
        try {
          const result = await sendEmail({
            to: normalizedEmail,
            subject: "Reset your Commander Control password",
            html: buildResetEmailHtml(actionLink),
            text: buildResetEmailText(actionLink)
          });

          return NextResponse.json({ ok: true, provider: result.provider });
        } catch (sendError) {
          appEmailError = sendError instanceof Error ? sendError : new Error("Unable to send password reset email.");
        }
      }
    }
  }

  const supabaseResult = await sendWithSupabaseAuth(normalizedEmail, redirectTo);
  if (!supabaseResult.ok) {
    const detail = appEmailError ? ` App email failed first: ${appEmailError.message}` : "";
    return NextResponse.json(
      { error: `${supabaseResult.error}${detail}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, provider: "supabase" });
}

async function sendWithSupabaseAuth(email: string, redirectTo: string) {
  if (!supabaseUrl || !supabasePublishableKey) {
    return {
      ok: false,
      error: "Supabase email fallback requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    };
  }

  const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

function buildResetEmailHtml(actionLink: string) {
  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h1 style="font-size: 24px; margin: 0 0 12px;">Reset your password</h1>
      <p>Use the button below to choose a new password for Commander Control.</p>
      <p style="margin: 24px 0;">
        <a href="${actionLink}" style="background: #f4b840; color: #111827; padding: 12px 18px; border-radius: 8px; display: inline-block; font-weight: 700; text-decoration: none;">
          Reset password
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;"><a href="${actionLink}">${actionLink}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;
}

function buildResetEmailText(actionLink: string) {
  return [
    "Reset your Commander Control password",
    "",
    "Use this link to choose a new password:",
    actionLink,
    "",
    "If you did not request this, you can ignore this email."
  ].join("\n");
}
