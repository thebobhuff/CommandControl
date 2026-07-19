import type { Metadata } from "next";
import { SeoLandingPage } from "@/app/seo-pages";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "MTG Archenemy App with Scheme Deck",
  description:
    "Run Archenemy Commander with a Scryfall-backed scheme deck, archenemy assignment, scheme reveal controls, ongoing scheme display, and TV card art.",
  alternates: {
    canonical: "/archenemy"
  },
  keywords: [
    "Archenemy app",
    "MTG Archenemy",
    "scheme deck",
    "Archenemy Commander",
    "MTG scheme cards"
  ],
  openGraph: {
    title: "MTG Archenemy App with Scheme Deck",
    description:
      "Load, shuffle, reveal, and display Archenemy schemes for Commander games with tablet controls and a TV-ready shared screen.",
    url: `${siteConfig.url}/archenemy`
  }
};

export default function ArchenemyPage() {
  return (
    <SeoLandingPage
      eyebrow="Archenemy Scheme Deck"
      title="Run the Archenemy scheme deck on-screen."
      description="Commander Control can assign the archenemy, load a Scryfall-backed scheme deck, set schemes in motion, abandon ongoing schemes, and display the active scheme as full card art on the shared game screen."
      primaryCta="Open Archenemy"
      video={{ label: "Archenemy guide", href: "https://www.youtube.com/watch?v=HRT9PeDnX1E" }}
      features={[
        {
          title: "Scheme deck controls",
          body: "Load, shuffle, draw, abandon, and reshuffle scheme zones from the Commander control rail."
        },
        {
          title: "Archenemy assignment",
          body: "Mark one player as the archenemy and keep that role visible across Control, Tablet, and TV Display."
        },
        {
          title: "Animated scheme reveals",
          body: "New schemes reveal with full card art and an ominous red animation so the table sees the moment clearly."
        }
      ]}
      useCases={[
        "One-vs-many Commander games",
        "Duskmourn-style Archenemy Commander nights",
        "Pods that want scheme cards without passing oversized cards around",
        "Tables that need the current ongoing scheme visible to everyone"
      ]}
    />
  );
}
