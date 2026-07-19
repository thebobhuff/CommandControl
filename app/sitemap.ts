import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const seoPages = [
    "/mtg-commander-life-tracker",
    "/commander-damage-tracker",
    "/planechase",
    "/archenemy"
  ];

  return [
    {
      url: siteConfig.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    ...seoPages.map((path) => ({
      url: `${siteConfig.url}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "/mtg-commander-life-tracker" ? 0.9 : 0.85
    }))
  ];
}
