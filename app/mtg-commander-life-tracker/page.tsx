import type { Metadata } from "next";
import { SeoLandingPage } from "@/app/seo-pages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "MTG Commander Life Tracker for Tablet and TV",
  description:
    "A free MTG Commander life tracker for tablet and TV play with synced life totals, Commander damage, poison, counters, player profiles, and Scryfall art.",
  alternates: {
    canonical: "/mtg-commander-life-tracker"
  },
  keywords: [
    "MTG Commander life tracker",
    "Commander life counter",
    "EDH life tracker",
    "Magic Commander app",
    "MTG life counter for TV"
  ],
  openGraph: {
    title: "MTG Commander Life Tracker for Tablet and TV",
    description:
      "Run Commander pods with synced tablet controls, TV display mode, Commander damage, poison, counters, and Scryfall card art.",
    url: `${siteConfig.url}/mtg-commander-life-tracker`
  }
};

export default function CommanderLifeTrackerPage() {
  return (
    <SeoLandingPage
      eyebrow="MTG Commander Life Tracker"
      title="A Commander life tracker built for tablet control and TV display."
      description="Commander Control keeps the whole pod readable: life totals, poison, Commander damage, turn state, counters, player profiles, and card-art backgrounds all stay synced between the control surface and the shared display."
      primaryCta="Open Life Tracker"
      video={{ label: "Commander guide", href: "https://www.youtube.com/watch?v=eaNjXcAqCAY" }}
      features={[
        {
          title: "Tablet-first controls",
          body: "Use a tablet or laptop as the table control surface, with fast life adjustments and compact player tools."
        },
        {
          title: "TV display mode",
          body: "Put readable player boards on a living-room TV, monitor, or browser display for everyone at the table."
        },
        {
          title: "Commander-ready counters",
          body: "Track poison, experience, energy, treasure, monarch, initiative, city blessing, turn timer, d20 rolls, and random player picks."
        }
      ]}
      useCases={[
        "Four-player Commander pods that need a shared display",
        "Event tables where one player manages life totals from a tablet",
        "Commander nights with recurring player profiles",
        "Pods that want Scryfall art instead of plain counter boxes"
      ]}
    />
  );
}
