import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

/**
 * The public map of the site.
 *
 * Only pages a stranger should land on. Everything under /app is staff-only
 * and everything under /track?q= is one customer's cargo — neither belongs in
 * an index, and listing them would invite crawlers to enumerate them.
 *
 * Priorities are relative, not absolute: booking and tracking are what the
 * business needs found, the guides are what brings strangers in, and the rest
 * supports both.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  /*
    Only pages a stranger should land on, and only pages that still exist.

    Target Express's public site carried guides, a China-markets directory, a
    flight timetable and a warehouses page. Those were its content strategy, not
    AITRANSIT's, and they were removed with the rest of its public interface —
    leaving them listed here would have published a sitemap full of 404s, which
    is worse for search than not having them at all.
  */
  const pages: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, frequency: "weekly" },
    { path: "/track", priority: 0.9, frequency: "daily" },
    { path: "/calculator", priority: 0.9, frequency: "weekly" },
    { path: "/services", priority: 0.8, frequency: "monthly" },
    { path: "/exchange", priority: 0.8, frequency: "daily" },
    { path: "/book", priority: 0.8, frequency: "monthly" },
    { path: "/china", priority: 0.7, frequency: "monthly" },
    { path: "/pickup", priority: 0.7, frequency: "monthly" },
    { path: "/register", priority: 0.6, frequency: "monthly" },
    { path: "/contact", priority: 0.6, frequency: "monthly" },
  ];

  return [
    ...pages.map((page) => ({
      url: `${base}${page.path}`,
      lastModified: now,
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
  ];
}
