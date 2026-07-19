import Link from "next/link";
import { ArrowRight, Monitor, PlayCircle, ScrollText, ShieldAlert, Sparkles, TabletSmartphone } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export type SeoFeature = {
  title: string;
  body: string;
};

export type SeoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: string;
  features: SeoFeature[];
  useCases: string[];
  video?: {
    label: string;
    href: string;
  };
  jsonLdType?: "SoftwareApplication" | "WebApplication";
};

export function SeoLandingPage({
  eyebrow,
  title,
  description,
  primaryCta,
  features,
  useCases,
  video,
  jsonLdType = "SoftwareApplication"
}: SeoPageProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": jsonLdType,
    name: title,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: features.map((feature) => feature.title)
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6">
        <nav className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm font-black uppercase tracking-wider text-primary">
            Commander Control
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/mtg-commander-life-tracker">Life Tracker</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/commander-damage-tracker">Damage</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/planechase">Planechase</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link href="/archenemy">Archenemy</Link>
            </Button>
          </div>
        </nav>

        <section className="grid min-h-[58vh] items-center gap-8 rounded-lg border border-border bg-card/80 p-5 backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <TabletSmartphone className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wider">{eyebrow}</span>
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/control">
                  {primaryCta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/display">
                  <Monitor className="h-5 w-5" />
                  TV Display
                </Link>
              </Button>
              {video ? (
                <Button asChild size="lg" variant="secondary">
                  <a href={video.href} target="_blank" rel="noreferrer">
                    <PlayCircle className="h-5 w-5" />
                    {video.label}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3">
            <PreviewPanel title="Shared game screen" icon={<Monitor className="h-5 w-5" />} />
            <PreviewPanel title="Variant deck runner" icon={<ScrollText className="h-5 w-5" />} />
            <PreviewPanel title="Table control surface" icon={<ShieldAlert className="h-5 w-5" />} />
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-lg font-black">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-2xl font-black text-foreground">Good for</h2>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {useCases.map((item) => (
              <div key={item} className="rounded-md bg-muted/40 px-3 py-2 text-sm font-semibold text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function PreviewPanel({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex min-h-28 items-center gap-4 rounded-lg border border-border bg-background/70 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        {icon}
      </span>
      <div>
        <div className="text-sm font-black uppercase tracking-wider">{title}</div>
        <div className="mt-1 text-xs leading-5 text-muted-foreground">Built for repeated table use on phones, tablets, and living-room displays.</div>
      </div>
    </div>
  );
}
