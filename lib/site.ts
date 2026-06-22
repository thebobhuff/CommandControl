export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.mtgcommandercontrol.com").replace(/\/$/, "");

export const siteConfig = {
  name: "Commander Control",
  shortName: "Commander",
  url: siteUrl,
  title: "Commander Control | MTG Commander Life Tracker for Tablet and TV",
  description:
    "Run Magic: The Gathering Commander games from a tablet, sync life totals to a TV display, track commander damage, and save player profiles with Scryfall art.",
  supportEmail: "bob@thebobhuff.com"
};
