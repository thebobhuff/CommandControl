import type { Metadata } from "next";
import { SeoLandingPage } from "@/app/seo-pages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "MTG Planechase App with Planar Deck and Planar Die",
  description:
    "Run Planechase games with a Scryfall-backed planar deck, planar die, rotated plane card display, tablet controls, and TV-ready card art.",
  alternates: {
    canonical: "/planechase"
  },
  keywords: [
    "Planechase app",
    "MTG Planechase",
    "planar deck",
    "planar die",
    "Planechase Commander"
  ],
  openGraph: {
    title: "MTG Planechase App with Planar Deck and Planar Die",
    description:
      "Load a Planechase planar deck, reveal planes and phenomena, roll the planar die, and show the active plane on a shared display.",
    url: `${siteConfig.url}/planechase`
  }
};

export default function PlanechasePage() {
  return (
    <SeoLandingPage
      eyebrow="Planechase Deck Runner"
      title="Run Planechase from the same screen as your Commander game."
      description="Commander Control can load a Scryfall-backed planar deck, reveal the active plane, rotate Planechase card art for landscape display, roll the planar die, and show the current plane on tablet and TV."
      primaryCta="Open Planechase"
      video={{ label: "Planechase guide", href: "https://www.youtube.com/watch?v=wC98RS2YvJk" }}
      features={[
        {
          title: "Planar deck runner",
          body: "Load and shuffle planes and phenomena, then reveal a new plane with one button."
        },
        {
          title: "Planar die support",
          body: "Roll blank, chaos, or planeswalker results, with planeswalk results moving to a new active plane."
        },
        {
          title: "Rotated card display",
          body: "Planechase cards show as real card art and rotate 90 degrees for a landscape table display."
        }
      ]}
      useCases={[
        "Commander Planechase nights without a physical planar deck",
        "Shared planar deck games on a TV",
        "Pods that want the active plane readable from across the table",
        "Casual MTG nights that need a fast planar die and plane reveal flow"
      ]}
    />
  );
}
