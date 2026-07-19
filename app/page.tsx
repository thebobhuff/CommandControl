import Link from "next/link";
import { BookOpenCheck, Mail, Monitor, PlayCircle, Tablet, TabletSmartphone } from "lucide-react";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { ActiveGamesList } from "@/components/active-games-list";
import { HomeNav } from "@/components/home-nav";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export default function Home() {
  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD"
    },
    featureList: [
      "Tablet controller for Magic: The Gathering Commander games",
      "TV display for life totals and commander damage",
      "Saved player profiles with Scryfall card art",
      "Archenemy mode with scheme tracking",
      "Commander damage, poison, monarch, initiative, city blessing, and token counters",
      "Shareable view-only game links"
    ]
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <BackgroundBeams />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-4 sm:px-6">
        <HomeNav />

        <div
          className="relative isolate flex min-h-[calc(100svh-8.5rem)] overflow-hidden rounded-lg border border-border bg-zinc-950 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(5,7,12,0.92) 0%, rgba(5,7,12,0.74) 38%, rgba(5,7,12,0.2) 100%), url('/hero-commander-display.png')"
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-20" />
          <div className="relative z-10 flex w-full flex-col justify-center gap-8 px-5 py-10 sm:px-8 lg:px-12">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black leading-tight text-foreground md:text-7xl">
                MTG Commander life tracker for tablet and TV.
              </h1>
              <p className="mt-5 max-w-2xl text-lg font-medium text-white/78">
                Run Magic: The Gathering Commander games from a tablet, show synchronized player boards on a TV, track commander damage, and save player profiles with Scryfall card art.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/tablet">
                  <Tablet className="h-5 w-5" />
                  Tablet Mode
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-black/45 backdrop-blur">
                <Link href="/control">
                  <TabletSmartphone className="h-5 w-5" />
                  Tablet Control
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/display">
                  <Monitor className="h-5 w-5" />
                  TV Display
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="bg-black/20 backdrop-blur">
                <a href="mailto:bob@thebobhuff.com">
                  <Mail className="h-5 w-5" />
                  Support
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="pb-8">
          <ActiveGamesList />
        </div>
        <section id="how-to" className="grid gap-4 pb-10">
          <div className="flex items-center gap-3 text-primary">
            <BookOpenCheck className="h-6 w-6" />
            <h2 className="text-2xl font-black text-foreground md:text-3xl">How to run a game</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <HowToStep
              step="1"
              title="Create your profiles"
              body="Log in, open Profiles, and save each regular player with a name, commander, and Scryfall profile image."
              href="/players"
              action="Profiles"
            />
            <HowToStep
              step="2"
              title="Start a game"
              body="Open Games and create a game so the table state can sync between the control screen, tablet mode, and TV display."
              href="/games"
              action="Games"
            />
            <HowToStep
              step="3"
              title="Assign players"
              body="Open Control, tap the wrench on each seat, then choose a saved profile from the Saved player dropdown."
              href="/control"
              action="Control"
            />
            <HowToStep
              step="4"
              title="Put the board on TV"
              body="Use the TV link from Control, or open TV Display directly, for a full-screen view of life totals and commander damage."
              href="/display"
              action="TV Display"
            />
            <HowToStep
              step="5"
              title="Run the table"
              body="Use Control for setup and detailed counters, or Tablet Mode for oversized tap targets during active play."
              href="/tablet"
              action="Tablet Mode"
            />
            <HowToStep
              step="6"
              title="Track Commander extras"
              body="Use poison, commander damage, experience, energy, treasure, monarch, initiative, city blessing, turn timer, d20, and random player tools as needed."
            />
            <HowToStep
              step="7"
              title="How to: Commander"
              body="Watch a Commander format walkthrough before starting a table, then use Control or Tablet Mode to run the game state."
              videoHref="https://www.youtube.com/watch?v=eaNjXcAqCAY"
              videoAction="Commander video"
            />
            <HowToStep
              step="8"
              title="How to: Planechase"
              body="Learn the planar deck and planar die flow, then load Planechase in Control to reveal full-card planes on the shared display."
              videoHref="https://www.youtube.com/watch?v=wC98RS2YvJk"
              videoAction="Planechase video"
            />
            <HowToStep
              step="9"
              title="How to: Archenemy"
              body="Learn the one-vs-many scheme deck flow, then load Archenemy in Control to set schemes in motion on the TV."
              videoHref="https://www.youtube.com/watch?v=HRT9PeDnX1E"
              videoAction="Archenemy video"
            />
          </div>
        </section>
      </section>
    </main>
  );
}

function HowToStep({
  step,
  title,
  body,
  href,
  action,
  videoHref,
  videoAction
}: {
  step: string;
  title: string;
  body: string;
  href?: string;
  action?: string;
  videoHref?: string;
  videoAction?: string;
}) {
  return (
    <article className="flex min-h-44 flex-col justify-between gap-4 rounded-lg border border-border bg-card/85 p-4 backdrop-blur">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-black text-primary-foreground">
            {step}
          </span>
          <h3 className="text-lg font-black">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {href && action ? (
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href={href}>{action}</Link>
          </Button>
        ) : null}
        {videoHref && videoAction ? (
          <Button asChild variant="secondary" size="sm" className="w-fit">
            <a href={videoHref} target="_blank" rel="noreferrer">
              <PlayCircle className="h-4 w-4" />
              {videoAction}
            </a>
          </Button>
        ) : null}
      </div>
    </article>
  );
}
