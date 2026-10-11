import Link from "next/link";
import { ArrowRight, Monitor, PlayCircle, ScrollText, ShieldAlert, Sparkles, TabletSmartphone } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { HomeNav } from "@/components/home-nav";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
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
    <main id="main-content" className="relative min-h-screen overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6">
        <HomeNav />

        <section className="grid min-h-[58vh] items-center gap-8 py-6 md:grid-cols-[1.1fr_0.9fr] md:py-12">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <TabletSmartphone className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wider">{eyebrow}</span>
            </div>
            <h1 className="mt-4 font-display text-5xl font-medium leading-tight md:text-6xl">{title}</h1>
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
          <figure className="hero-art"><img src="/hero-commander-display.png" alt="Commander Control shared game display" width="2048" height="1263" /><figcaption className="hero-art-caption"><Monitor className="size-4 text-primary" />Life totals and card art, together.</figcaption></figure>
        </section>

        <BentoGrid className="md:auto-rows-auto">
          {features.map((feature) => (
            <BentoGridItem key={feature.title} title={feature.title} description={feature.body} className="min-h-40" />
          ))}
        </BentoGrid>

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
