import "server-only";

import { cache } from "react";

import { prisma } from "@/lib/prisma";

/**
 * The China markets directory, as the public site reads it.
 *
 * Comes out of ChinaMarket — the same table the support desk reads and Admin
 * edits — so a market corrected internally is corrected on the website with no
 * second copy to update. The written seed in lib/markets.ts fills the table on
 * a fresh install and is not consulted afterwards.
 *
 * Deduplicated per request, because a page that shows the directory and a
 * filter built from it would otherwise ask twice.
 */
export const publicMarkets = cache(async () => {
  return prisma.chinaMarket.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
});

export const publicMarketBySlug = cache(async (slug: string) => {
  return prisma.chinaMarket.findFirst({ where: { slug, active: true } });
});

/**
 * The product categories present across the directory, for the filter.
 *
 * Derived rather than listed: a market added with a new product category shows
 * up in the filter automatically, and a category nothing sells any more
 * disappears from it. A hand-kept list would need editing twice for every
 * change and would eventually offer a filter that returns nothing.
 *
 * Normalised to sentence case on the first word so "Toys and games" and "toys
 * and games" do not both appear.
 */
export async function marketCategories() {
  const markets = await publicMarkets();
  const seen = new Map<string, string>();
  for (const market of markets) {
    for (const product of market.products) {
      const key = product.trim().toLowerCase();
      if (!key) continue;
      if (!seen.has(key)) seen.set(key, product.trim());
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
