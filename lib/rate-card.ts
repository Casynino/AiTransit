import "server-only";

import { cache } from "react";
import type { CargoCategory } from "@prisma/client";

import { AIRPORT_LABELS, CATEGORY_EXAMPLES, CATEGORY_LABELS, ROUTE_FOR_CATEGORY } from "@/lib/cargo";
import { toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

/**
 * The rate card, as a customer reads it.
 *
 * READS THE SAME TABLE THE INVOICE IS PRICED FROM. This is the whole point of
 * the module: the public page could trivially hardcode "Wigs, 1-10 kg, $14.40"
 * off the flyer, and then a rate change by Finance would leave the website
 * quoting a price the business no longer charges. Every figure below comes out
 * of PricingRule, which is what lib/pricing.ts resolves an invoice against.
 *
 * What it does NOT do is quote. Quoting is lib/pricing.ts — it resolves the
 * most specific rule, applies minimum billable weight and minimum charge, and
 * returns the working. This only lists the published tiers so a customer can
 * see the shape of the price before they type anything.
 */

export type RateTier = {
  /** "1 - 10 kg", "10 kg and above". */
  label: string;
  /** "USD 14.40". Formatted here so three surfaces cannot format it three ways. */
  price: string;
  priceValue: number;
  minKg: number | null;
  maxKg: number | null;
};

export type RateCardCategory = {
  category: CargoCategory;
  label: string;
  examples: string;
  /** "Guangzhou Airport" / "Hong Kong Airport". */
  route: string;
  tiers: RateTier[];
};

/**
 * How a weight tier reads on a price list.
 *
 * The stored bounds are [min, max) — the same half-open interval the pricing
 * engine resolves on — and this turns them into the sentence a customer
 * expects. A tier of [1, 10) is "1 - 10 kg" and not "1 to 9.999 kg", because
 * the exclusive upper bound exists so that exactly 10 kg falls into the NEXT
 * tier, which is where the cheaper rate is and where the customer wants it.
 */
/**
 * How a weight tier reads on a price list.
 *
 * `floorKg` is the rule's minimum BILLABLE weight, and it is why the first tier
 * reads "1 - 10 kg" rather than "Up to 10 kg". That tier is stored with no
 * lower bound on purpose — a 400 g parcel has to match a tier or it cannot be
 * priced at all (see the note in prisma/price-list.ts) — but the price a
 * customer is actually charged starts at 1 kg, so 1 kg is the honest bottom of
 * the range to print. Reading it back from `minChargeableKg` means the words on
 * the website and the arithmetic on the invoice come from one row.
 */
function tierLabel(
  minKg: number | null,
  maxKg: number | null,
  floorKg: number | null
): string {
  const low = minKg ?? floorKg;
  if (low !== null && maxKg !== null) return `${low} - ${maxKg} kg`;
  if (maxKg !== null) return `Up to ${maxKg} kg`;
  if (low !== null) return `${low} kg and above`;
  return "Any weight";
}

/**
 * The published card, grouped by category and ordered by weight.
 *
 * Only WEIGHT_BASED, category-wide rules appear. A rule naming one cargo type
 * ("AirPods, USD 10 each") is a real rate and prices real invoices, but it is
 * not a headline a customer can compare — putting eighty per-item rows on the
 * home page would bury the three numbers the flyer leads with. The full book,
 * per-item rules included, is on /pricing.
 */
export const publicRateCard = cache(async (): Promise<RateCardCategory[]> => {
  const rules = await prisma.pricingRule.findMany({
    where: { active: true, cargoTypeId: null, method: "WEIGHT_BASED" },
    orderBy: [{ effectiveFrom: "desc" }],
  });

  const byCategory = new Map<CargoCategory, RateTier[]>();
  /* Latest effective rule per (category, tier) wins — the same
     most-recent-first resolution lib/pricing.ts uses, so the page can never
     advertise a superseded rate that is still marked active. */
  const claimed = new Set<string>();

  for (const rule of rules) {
    const minKg = rule.minWeightKg === null ? null : toNumber(rule.minWeightKg);
    const maxKg = rule.maxWeightKg === null ? null : toNumber(rule.maxWeightKg);
    const key = `${rule.category}:${minKg}:${maxKg}`;
    if (claimed.has(key)) continue;
    claimed.add(key);

    const floorKg =
      rule.minChargeableKg === null ? null : toNumber(rule.minChargeableKg);
    const price = toNumber(rule.price);
    const tiers = byCategory.get(rule.category) ?? [];
    tiers.push({
      label: tierLabel(minKg, maxKg, floorKg),
      price: `${rule.currency} ${price.toFixed(2)}`,
      priceValue: price,
      minKg,
      maxKg,
    });
    byCategory.set(rule.category, tiers);
  }

  /* Fixed order, not database order. Normal goods is the bulk of the trade and
     leads on the flyer; the special category is last because it is the
     exception. A card whose columns move between page loads is unreadable. */
  const ORDER: CargoCategory[] = ["NORMAL_GOODS", "ELECTRONICS", "LIQUID_SPECIAL"];

  return ORDER.filter((category) => byCategory.has(category)).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    examples: CATEGORY_EXAMPLES[category],
    route: AIRPORT_LABELS[ROUTE_FOR_CATEGORY[category]],
    tiers: (byCategory.get(category) ?? []).sort(
      (a, b) => (a.minKg ?? 0) - (b.minKg ?? 0)
    ),
  }));
});
