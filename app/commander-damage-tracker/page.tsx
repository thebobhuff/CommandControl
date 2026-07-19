import type { Metadata } from "next";
import { SeoLandingPage } from "@/app/seo-pages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Commander Damage Tracker for MTG and EDH",
  description:
    "Track Commander damage by opponent with life totals, poison, counters, tablet controls, and TV display mode for MTG Commander pods.",
  alternates: {
    canonical: "/commander-damage-tracker"
  },
  keywords: [
    "Commander damage tracker",
    "MTG commander damage",
    "EDH commander damage tracker",
    "Commander life counter damage",
    "partner commander damage tracker"
  ],
  openGraph: {
    title: "Commander Damage Tracker for MTG and EDH",
    description:
      "Track Commander damage from each opponent alongside life totals, poison, counters, and table state.",
    url: `${siteConfig.url}/commander-damage-tracker`
  }
};

export default function CommanderDamageTrackerPage() {
  return (
    <SeoLandingPage
      eyebrow="Commander Damage Tracker"
      title="Track Commander damage without losing the table state."
      description="Commander Control keeps per-opponent Commander damage visible next to life totals and player status, so lethal commander damage does not get buried under dice, paper notes, or memory checks."
      primaryCta="Track Damage"
      features={[
        {
          title: "Per-opponent damage",
          body: "Each player card tracks Commander damage taken from every other player in the pod."
        },
        {
          title: "Lethal thresholds",
          body: "The TV display highlights danger as Commander damage rises toward the 21-damage elimination point."
        },
        {
          title: "Works with the full game",
          body: "Commander damage sits alongside life totals, poison, counters, active turn, winner state, and saved game sync."
        }
      ]}
      useCases={[
        "Pods with voltron decks and commander combat kills",
        "Partner-heavy games where damage sources matter",
        "TV table displays where every opponent can read lethal threats",
        "Commander events where clean damage tracking prevents disputes"
      ]}
    />
  );
}
