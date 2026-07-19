import Link from "next/link";
import { BarChart3, CalendarDays, Eye, Globe2, Lock, MonitorSmartphone, MousePointerClick, RadioTower, UsersRound } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { InteriorNav } from "@/components/interior-nav";
import { Button } from "@/components/ui/button";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const ADMIN_EMAIL = "bob@thebobhuff.com";

type SiteVisit = {
  event_name: string | null;
  path: string;
  pathname: string | null;
  search: string | null;
  referrer: string | null;
  referrer_host: string | null;
  visitor_id: string | null;
  session_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  page_title: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  msclkid: string | null;
  screen_width: number | null;
  screen_height: number | null;
  viewport_width: number | null;
  viewport_height: number | null;
  device_pixel_ratio: number | null;
  language: string | null;
  timezone: string | null;
  platform: string | null;
  color_scheme: string | null;
  connection_effective_type: string | null;
  device_type: string | null;
  browser_name: string | null;
  os_name: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() ?? "";

  if (!user) {
    return <AdminShell title="Admin" message="Login as bob@thebobhuff.com to view visitor stats." actionHref="/login" actionLabel="Login" />;
  }

  if (email !== ADMIN_EMAIL) {
    return <AdminShell title="Admin locked" message="This dashboard is only available to bob@thebobhuff.com." />;
  }

  const admin = createAdminClient();
  if (!admin) {
    return (
      <AdminShell
        title="Admin setup needed"
        message="Set SUPABASE_SERVICE_ROLE_KEY in Vercel to read visitor stats."
      />
    );
  }

  const { count: totalVisits } = await admin
    .from("site_visits")
    .select("*", { count: "exact", head: true });

  const { data: visits, error } = await admin
    .from("site_visits")
    .select("event_name,path,pathname,search,referrer,referrer_host,visitor_id,session_id,ip_hash,user_agent,page_title,utm_source,utm_medium,utm_campaign,utm_term,utm_content,gclid,fbclid,msclkid,screen_width,screen_height,viewport_width,viewport_height,device_pixel_ratio,language,timezone,platform,color_scheme,connection_effective_type,device_type,browser_name,os_name,country,region,city,created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    return <AdminShell title="Visitor stats" message={error.message} />;
  }

  const stats = buildStats((visits ?? []) as SiteVisit[], totalVisits ?? 0);

  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5">
        <InteriorNav />
        <header className="rounded-lg border border-border bg-background/75 p-4 backdrop-blur">
          <div className="flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-black uppercase tracking-wider">Admin</span>
          </div>
          <h1 className="mt-2 text-3xl font-black">Visitor stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={<Eye className="h-5 w-5" />} label="Total visits" value={stats.totalVisits} />
          <StatTile icon={<CalendarDays className="h-5 w-5" />} label="Today" value={stats.todayVisits} />
          <StatTile icon={<MousePointerClick className="h-5 w-5" />} label="Last 7 days" value={stats.weekVisits} />
          <StatTile icon={<UsersRound className="h-5 w-5" />} label="Unique visitors" value={stats.uniqueVisitors} />
          <StatTile icon={<RadioTower className="h-5 w-5" />} label="Sessions" value={stats.sessions} />
          <StatTile icon={<Globe2 className="h-5 w-5" />} label="UTM visits" value={stats.utmVisits} />
          <StatTile icon={<MonitorSmartphone className="h-5 w-5" />} label="Mobile visits" value={stats.mobileVisits} />
          <StatTile icon={<BarChart3 className="h-5 w-5" />} label="Tracked rows" value={stats.loadedRows} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xl font-black">Top pages</h2>
            <div className="mt-3 space-y-2">
              {stats.topPages.length ? (
                stats.topPages.map((item) => <RankRow key={item.label} label={item.label} value={item.count} />)
              ) : (
                <p className="text-sm text-muted-foreground">No visits recorded yet.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-xl font-black">Referrers</h2>
            <div className="mt-3 space-y-2">
              {stats.topReferrers.length ? (
                stats.topReferrers.map((item) => <RankRow key={item.label} label={item.label} value={item.count} />)
              ) : (
                <p className="text-sm text-muted-foreground">No external referrers yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankSection title="UTM campaigns" rows={stats.topCampaigns} empty="No campaign traffic yet." />
          <RankSection title="UTM sources" rows={stats.topSources} empty="No UTM sources yet." />
          <RankSection title="UTM mediums" rows={stats.topMediums} empty="No UTM mediums yet." />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankSection title="Devices" rows={stats.devices} empty="No device telemetry yet." />
          <RankSection title="Browsers" rows={stats.browsers} empty="No browser telemetry yet." />
          <RankSection title="Operating systems" rows={stats.operatingSystems} empty="No OS telemetry yet." />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankSection title="Viewports" rows={stats.viewports} empty="No viewport data yet." />
          <RankSection title="Countries" rows={stats.countries} empty="No country data yet." />
          <RankSection title="Languages" rows={stats.languages} empty="No language data yet." />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankSection title="Time zones" rows={stats.timezones} empty="No timezone data yet." />
          <RankSection title="Color scheme" rows={stats.colorSchemes} empty="No color-scheme data yet." />
          <RankSection title="Connections" rows={stats.connections} empty="No connection data yet." />
        </div>

        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-xl font-black">Recent visits</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="border-b border-border py-2 pr-3">Time</th>
                  <th className="border-b border-border py-2 pr-3">Page</th>
                  <th className="border-b border-border py-2 pr-3">Referrer</th>
                  <th className="border-b border-border py-2 pr-3">UTM</th>
                  <th className="border-b border-border py-2 pr-3">Device</th>
                  <th className="border-b border-border py-2">Visitor</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentVisits.map((visit) => (
                  <tr key={`${visit.created_at}-${visit.path}`} className="border-b border-border/60">
                    <td className="whitespace-nowrap py-2 pr-3 text-muted-foreground">{formatDateTime(visit.created_at)}</td>
                    <td className="max-w-[260px] py-2 pr-3">
                      <div className="truncate font-semibold">{visit.pathname || cleanPath(visit.path)}</div>
                      {visit.search ? <div className="truncate text-xs text-muted-foreground">?{visit.search}</div> : null}
                    </td>
                    <td className="max-w-[180px] truncate py-2 pr-3 text-muted-foreground">{formatReferrer(visit)}</td>
                    <td className="max-w-[220px] py-2 pr-3 text-xs text-muted-foreground">{formatUtm(visit)}</td>
                    <td className="max-w-[180px] py-2 pr-3 text-xs text-muted-foreground">{formatDevice(visit)}</td>
                    <td className="whitespace-nowrap py-2 text-muted-foreground">{formatVisitor(visit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function AdminShell({
  title,
  message,
  actionHref,
  actionLabel
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <main className="safe-screen relative overflow-hidden bg-background">
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5">
        <InteriorNav />
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <Lock className="h-5 w-5" />
            <span className="text-sm font-black uppercase tracking-wider">Admin</span>
          </div>
          <h1 className="mt-2 text-3xl font-black">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          {actionHref && actionLabel ? (
            <Button asChild className="mt-4">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function buildStats(visits: SiteVisit[], totalVisits: number) {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const visitorKeys = new Set<string>();
  const sessionKeys = new Set<string>();

  for (const visit of visits) {
    const key = visit.visitor_id || visit.ip_hash;
    if (key) {
      visitorKeys.add(key);
    }
    if (visit.session_id) {
      sessionKeys.add(visit.session_id);
    }
  }

  return {
    totalVisits,
    loadedRows: visits.length,
    todayVisits: visits.filter((visit) => new Date(visit.created_at).getTime() >= startOfToday.getTime()).length,
    weekVisits: visits.filter((visit) => new Date(visit.created_at).getTime() >= weekAgo).length,
    uniqueVisitors: visitorKeys.size,
    sessions: sessionKeys.size,
    utmVisits: visits.filter(hasUtm).length,
    mobileVisits: visits.filter((visit) => visit.device_type === "mobile" || visit.device_type === "tablet").length,
    topPages: rankBy(visits.map((visit) => visit.pathname || cleanPath(visit.path))).slice(0, 8),
    topReferrers: rankBy(visits.map(formatReferrer).filter((referrer) => referrer !== "Direct")).slice(0, 8),
    topCampaigns: rankBy(visits.map((visit) => visit.utm_campaign || "").filter(Boolean)).slice(0, 8),
    topSources: rankBy(visits.map((visit) => visit.utm_source || "").filter(Boolean)).slice(0, 8),
    topMediums: rankBy(visits.map((visit) => visit.utm_medium || "").filter(Boolean)).slice(0, 8),
    devices: rankBy(visits.map((visit) => visit.device_type || "Unknown")).slice(0, 8),
    browsers: rankBy(visits.map((visit) => visit.browser_name || "Unknown")).slice(0, 8),
    operatingSystems: rankBy(visits.map((visit) => visit.os_name || "Unknown")).slice(0, 8),
    viewports: rankBy(visits.map(formatViewport).filter(Boolean)).slice(0, 8),
    countries: rankBy(visits.map((visit) => visit.country || "").filter(Boolean)).slice(0, 8),
    languages: rankBy(visits.map((visit) => visit.language || "").filter(Boolean)).slice(0, 8),
    timezones: rankBy(visits.map((visit) => visit.timezone || "").filter(Boolean)).slice(0, 8),
    colorSchemes: rankBy(visits.map((visit) => visit.color_scheme || "").filter(Boolean)).slice(0, 8),
    connections: rankBy(visits.map((visit) => visit.connection_effective_type || "").filter(Boolean)).slice(0, 8),
    recentVisits: visits.slice(0, 25)
  };
}

function rankBy(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function cleanPath(path: string) {
  return path.split("?")[0] || "/";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function hasUtm(visit: SiteVisit) {
  return Boolean(visit.utm_source || visit.utm_medium || visit.utm_campaign || visit.utm_term || visit.utm_content || visit.gclid || visit.fbclid || visit.msclkid);
}

function formatReferrer(visit: SiteVisit) {
  if (visit.referrer_host) {
    return visit.referrer_host;
  }

  if (!visit.referrer) {
    return "Direct";
  }

  try {
    const url = new URL(visit.referrer);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return visit.referrer;
  }
}

function formatUtm(visit: SiteVisit) {
  const values = [
    visit.utm_source ? `src:${visit.utm_source}` : "",
    visit.utm_medium ? `med:${visit.utm_medium}` : "",
    visit.utm_campaign ? `camp:${visit.utm_campaign}` : "",
    visit.utm_term ? `term:${visit.utm_term}` : "",
    visit.utm_content ? `content:${visit.utm_content}` : "",
    visit.gclid ? "gclid" : "",
    visit.fbclid ? "fbclid" : "",
    visit.msclkid ? "msclkid" : ""
  ].filter(Boolean);

  return values.length ? values.join(" / ") : "None";
}

function formatDevice(visit: SiteVisit) {
  const viewport = formatViewport(visit);
  return [
    visit.device_type || "Unknown",
    visit.browser_name || "",
    visit.os_name || "",
    viewport
  ].filter(Boolean).join(" / ");
}

function formatViewport(visit: SiteVisit) {
  if (!visit.viewport_width || !visit.viewport_height) {
    return "";
  }

  return `${visit.viewport_width}x${visit.viewport_height}`;
}

function formatVisitor(visit: SiteVisit) {
  const value = visit.visitor_id || visit.ip_hash || "";
  return value ? value.slice(0, 8) : "Unknown";
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <span className="text-xs font-black uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 text-3xl font-black">{value.toLocaleString()}</div>
    </div>
  );
}

function RankRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-muted/35 px-3 py-2">
      <span className="truncate text-sm font-semibold">{label}</span>
      <span className="text-sm font-black text-primary">{value.toLocaleString()}</span>
    </div>
  );
}

function RankSection({ title, rows, empty }: { title: string; rows: Array<{ label: string; count: number }>; empty: string }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-3 space-y-2">
        {rows.length ? (
          rows.map((item) => <RankRow key={item.label} label={item.label} value={item.count} />)
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </section>
  );
}
