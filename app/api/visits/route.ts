import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

type VisitBody = {
  eventName?: unknown;
  path?: unknown;
  pathname?: unknown;
  search?: unknown;
  visitorId?: unknown;
  sessionId?: unknown;
  referrer?: unknown;
  title?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmTerm?: unknown;
  utmContent?: unknown;
  gclid?: unknown;
  fbclid?: unknown;
  msclkid?: unknown;
  screenWidth?: unknown;
  screenHeight?: unknown;
  viewportWidth?: unknown;
  viewportHeight?: unknown;
  devicePixelRatio?: unknown;
  language?: unknown;
  timezone?: unknown;
  platform?: unknown;
  colorScheme?: unknown;
  connectionEffectiveType?: unknown;
};

function readHeaderIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip") ?? "";
}

function hashText(value: string) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(value).digest("hex");
}

function readString(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.slice(0, maxLength);
}

function readNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readInt(value: unknown) {
  const parsed = readNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

function readReferrerHost(referrer: string) {
  if (!referrer) {
    return "";
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, "").slice(0, 255);
  } catch {
    return "";
  }
}

function detectDeviceType(userAgent: string) {
  const value = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(value)) {
    return "tablet";
  }
  if (/mobi|iphone|android/.test(value)) {
    return "mobile";
  }
  if (/bot|crawl|spider|slurp|bingpreview/.test(value)) {
    return "bot";
  }
  return "desktop";
}

function detectBrowser(userAgent: string) {
  if (/edg\//i.test(userAgent)) {
    return "Edge";
  }
  if (/opr\//i.test(userAgent)) {
    return "Opera";
  }
  if (/firefox\//i.test(userAgent)) {
    return "Firefox";
  }
  if (/chrome\//i.test(userAgent) || /crios\//i.test(userAgent)) {
    return "Chrome";
  }
  if (/safari\//i.test(userAgent)) {
    return "Safari";
  }
  if (/bot|crawl|spider/i.test(userAgent)) {
    return "Bot";
  }
  return "Other";
}

function detectOs(userAgent: string) {
  if (/windows/i.test(userAgent)) {
    return "Windows";
  }
  if (/iphone|ipad|ios/i.test(userAgent)) {
    return "iOS";
  }
  if (/android/i.test(userAgent)) {
    return "Android";
  }
  if (/mac os|macintosh/i.test(userAgent)) {
    return "macOS";
  }
  if (/linux/i.test(userAgent)) {
    return "Linux";
  }
  return "Other";
}

export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin) {
    return new NextResponse(null, { status: 204 });
  }

  const body = (await request.json().catch(() => ({}))) as VisitBody;
  const path = readString(body.path, 500);
  const pathname = readString(body.pathname, 500) || path.split("?")[0];
  const search = readString(body.search, 1000);

  if (!path || path.startsWith("/api") || path.startsWith("/admin")) {
    return new NextResponse(null, { status: 204 });
  }

  const userAgent = readString(request.headers.get("user-agent") ?? "", 500);
  const eventName = readString(body.eventName, 80) || "page_view";
  const visitorId = readString(body.visitorId, 100);
  const sessionId = readString(body.sessionId, 100);
  const referrer = readString(body.referrer, 500);
  const ipHash = hashText(readHeaderIp(request));

  await admin.from("site_visits").insert({
    event_name: eventName,
    path,
    pathname,
    search: search || null,
    referrer: referrer || null,
    referrer_host: readReferrerHost(referrer) || null,
    visitor_id: visitorId || null,
    session_id: sessionId || null,
    ip_hash: ipHash,
    user_agent: userAgent || null,
    page_title: readString(body.title, 255) || null,
    utm_source: readString(body.utmSource, 255) || null,
    utm_medium: readString(body.utmMedium, 255) || null,
    utm_campaign: readString(body.utmCampaign, 255) || null,
    utm_term: readString(body.utmTerm, 255) || null,
    utm_content: readString(body.utmContent, 255) || null,
    gclid: readString(body.gclid, 255) || null,
    fbclid: readString(body.fbclid, 255) || null,
    msclkid: readString(body.msclkid, 255) || null,
    screen_width: readInt(body.screenWidth),
    screen_height: readInt(body.screenHeight),
    viewport_width: readInt(body.viewportWidth),
    viewport_height: readInt(body.viewportHeight),
    device_pixel_ratio: readNumber(body.devicePixelRatio),
    language: readString(body.language, 80) || null,
    timezone: readString(body.timezone, 120) || null,
    platform: readString(body.platform, 120) || null,
    color_scheme: readString(body.colorScheme, 20) || null,
    connection_effective_type: readString(body.connectionEffectiveType, 40) || null,
    device_type: detectDeviceType(userAgent),
    browser_name: detectBrowser(userAgent),
    os_name: detectOs(userAgent),
    country: readString(request.headers.get("x-vercel-ip-country") ?? "", 80) || null,
    region: readString(request.headers.get("x-vercel-ip-country-region") ?? "", 120) || null,
    city: readString(request.headers.get("x-vercel-ip-city") ?? "", 120) || null
  });

  return new NextResponse(null, { status: 204 });
}
