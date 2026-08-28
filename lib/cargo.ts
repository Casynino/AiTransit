import type { CargoCategory, Origin, PricingMethod } from "@prisma/client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

/**
 * Cargo classification rules.
 *
 * These are business rules, not rates: which airport a category flies from, and
 * which batches it may join. They live in code rather than the database on
 * purpose — a rate changes weekly, but "electronics fly out of Hong Kong" is
 * the shape of the operation. If it ever does change, it changes here, once.
 *
 * Rates are the opposite: they are entirely in the PricingRule table, editable
 * by the CEO, and nothing about them is hardcoded.
 */

/**
 * What the cargo is, in one line: the priced item first, then the desk's own
 * words in brackets — "Clothes (nguo)".
 *
 * The item is what Finance bills against and what everyone recognises at a
 * glance; the description is how the customer or the Guangzhou desk actually
 * named it, often in Chinese. Showing only the description meant a
 * list full of words that do not map to any price, and showing only the item
 * meant nine rows that all say "Clothes".
 *
 * Either half may be missing — cargo can be registered as "Not listed / mixed",
 * and imported cargo sometimes has no description at all.
 */
export function cargoLabel(
  itemName: string | null | undefined,
  description: string | null | undefined,
  locale: Locale = "en"
) {
  const item = itemName?.trim();
  const text = description?.trim();

  if (!item) return text || t(locale, "General cargo");
  if (!text) return item;
  // "Clothes (Clothes)" helps nobody.
  if (text.toLowerCase() === item.toLowerCase()) return item;
  // Descriptions off the China packing lists carry their own brackets —
  // "Accessories (配件)". Wrapping those again gives nested brackets nobody can
  // read, so those get a dash instead.
  if (text.includes("(")) return `${item} — ${text}`;
  return `${item} (${text})`;
}

/**
 * The three commercial buckets, in the words AITRANSIT prints on its rate card.
 *
 * LIQUID_SPECIAL's label is the one thing here that is not final — the
 * business is still deciding what to call the higher-rate bucket. Admin can
 * rename it under Company settings (`cargo.specialCategoryName`); this is the
 * fallback, and `specialCategoryLabel()` in lib/company-settings.ts is what the
 * screens should ask. The ENUM VALUE never moves, so a rename cannot orphan a
 * priced invoice.
 */
export const CATEGORY_LABELS: Record<CargoCategory, string> = {
  NORMAL_GOODS: "Normal goods",
  ELECTRONICS: "Electronics",
  LIQUID_SPECIAL: "Liquid & special goods",
  /* Retired — folded into normal goods. Kept so an old row still renders. */
  WIGS: "Normal goods",
};

export const CATEGORY_EXAMPLES: Record<CargoCategory, string> = {
  NORMAL_GOODS:
    "Clothing, shoes, bags, wigs and hair, home products, furniture, toys, general merchandise",
  ELECTRONICS:
    "Phones, laptops, tablets, smart watches, cameras, AirPods, LED displays, documents",
  LIQUID_SPECIAL:
    "Medicines, food products, liquids, oils, cosmetics, batteries, speakers, printers",
  WIGS: "Wigs, hair bundles, closures, frontals, braiding hair",
};

/**
 * The route each category flies. This is the whole point of the classification:
 * the operator picks what the cargo IS, never which airport it leaves from, so
 * a shipment cannot be sent to the wrong hub by mistake.
 *
 * AITRANSIT runs two loading batches. Guangzhou takes the ordinary trade —
 * clothing, shoes, bags, hair and general merchandise, which is the bulk of
 * what flies. Hong Kong takes the two categories that need the other route:
 * electronics, and the liquids and powered goods on the special rate. More
 * airlines out of Hong Kong will carry both.
 */
export const ROUTE_FOR_CATEGORY: Record<CargoCategory, Origin> = {
  NORMAL_GOODS: "GUANGZHOU",
  ELECTRONICS: "HONG_KONG",
  LIQUID_SPECIAL: "HONG_KONG",
  /* Retired, and it flew Guangzhou when it existed. */
  WIGS: "GUANGZHOU",
};

export const AIRPORT_LABELS: Record<Origin, string> = {
  GUANGZHOU: "Guangzhou Airport",
  HONG_KONG: "Hong Kong Airport",
};

/** Which categories are allowed on a batch departing from a given airport. */
export const CATEGORIES_FOR_ROUTE: Record<Origin, CargoCategory[]> = {
  GUANGZHOU: ["NORMAL_GOODS"],
  HONG_KONG: ["ELECTRONICS", "LIQUID_SPECIAL"],
};

export const METHOD_LABELS: Record<PricingMethod, string> = {
  WEIGHT_BASED: "Weight-based",
  FIXED_PER_ITEM: "Fixed price per item",
};

export function routeFor(category: CargoCategory): Origin {
  return ROUTE_FOR_CATEGORY[category];
}

/**
 * True when a shipment of this category may join a batch leaving from this
 * airport. Enforced server-side on every path that assigns cargo to a batch.
 */
export function categoryFitsRoute(category: CargoCategory, route: Origin) {
  return ROUTE_FOR_CATEGORY[category] === route;
}

/** Batch number prefix per loading location: GZ-0028, HK-0013. */
export function batchPrefix(route: Origin) {
  return route === "GUANGZHOU" ? "GZ" : "HK";
}

/**
 * The shape of every batch number: GZ-0028, HK-0013.
 *
 * Where it loaded, then its place in that location's own run. The two runs are
 * independent — Hong Kong's fourteenth batch is HK-0014 whether Guangzhou has
 * sent four or four hundred — because they are two warehouses packing two sets
 * of cargo, and a shared counter would make each one's numbers jump for
 * reasons the other warehouse could not see.
 *
 * The run does not restart in January. A batch number is how the office refers
 * to a load for years afterwards, on paperwork that outlives the year it was
 * printed in, so GZ-0028 stays the only GZ-0028 there will ever be.
 *
 * Four digits so a column of them reads straight down, and more than four once
 * a location passes 9999 rather than rolling over onto a number already used.
 */
export const BATCH_NUMBER = /^(GZ|HK)-(\d{4,})$/;

/**
 * The notation the office wrote before this one: GZ/26-28.
 *
 * Recognised only so those batches keep their place in the run when they are
 * renumbered — the 28th Guangzhou load of 2026 becomes GZ-0028, not whatever
 * number happened to be free on the day the scheme changed.
 */
export const LEGACY_BATCH_NUMBER = /^(GZ|HK)\/(\d{2})-(\d{1,})$/;

/** A batch number, assembled. */
export function batchNumberFor(route: Origin, sequence: number) {
  return `${batchPrefix(route)}-${String(sequence).padStart(4, "0")}`;
}

/**
 * Which loading location a batch number says it came from.
 *
 * The prefix is not decoration — it is the location, written down. Reading it
 * back is what lets every path that mints or imports a batch check the number
 * against the location instead of trusting them to agree. Returns null for
 * anything that is not a batch number, which includes the two permanent
 * loading tables (GZ-LOADING, HK-LOADING).
 */
export function originFromBatchNumber(batchNumber: string): Origin | null {
  const clean = batchNumber.trim().toUpperCase();
  const match = BATCH_NUMBER.exec(clean) ?? LEGACY_BATCH_NUMBER.exec(clean);
  if (!match) return null;
  return match[1] === "HK" ? "HONG_KONG" : "GUANGZHOU";
}

/** Its place in that location's run, or null if it is not a batch number. */
export function sequenceFromBatchNumber(batchNumber: string): number | null {
  const clean = batchNumber.trim().toUpperCase();
  const current = BATCH_NUMBER.exec(clean);
  if (current) return Number(current[2]);
  const legacy = LEGACY_BATCH_NUMBER.exec(clean);
  return legacy ? Number(legacy[3]) : null;
}

/**
 * Best-effort category from free-text cargo description, for importing packing
 * lists. Only ever a starting point: the operator confirms it, because getting
 * this wrong changes both the airport and the price.
 */
const CATEGORY_KEYWORDS: [RegExp, CargoCategory][] = [
  /* Wigs first. Hair is a category of its own for AITRANSIT and several of its
     words ("bundles", "closure") would otherwise be read as general trade. */
  [
    /\u5047\u53D1|wig|hairpiece|hair piece|human hair|\u4EBA\u53D1|closure|frontal|bundle|weave|braid|\u8FAB\u53D1|\u53D1\u5305|lace front|ponytail|extension/i,
    "ELECTRONICS",
  ],
  /* Then everything on the higher rate and the Hong Kong route: electronics,
     batteries and liquids together, because they share a rate and an airport. */
  [
    /\u624B\u673A|phone|ipad|\u5E73\u677F|tablet|laptop|\u7B14\u8BB0\u672C|\u7535\u8111|computer|\u76F8\u673A|camera|\u8033\u673A|earphone|airpod|\u624B\u8868|watch|\u97F3\u7BB1|speaker|\u7535\u6C60|battery|\u5145\u7535\u5668|charger|\u6253\u5370\u673A|printer|\u663E\u793A\u5668|monitor|led|playstation|\u6E38\u620F\u673A|console|\u82AF\u7247|chip|usb|\u8DEF\u7531\u5668|router|\u7535\u5B50|electronic|\u9006\u53D8\u5668|inverter|\u9EA6\u514B\u98CE|microphone|lcd|\u84DD\u7259|bluetooth|solar|\u592A\u9633\u80FD|\u836F|medicine|\u4FDD\u5065\u54C1|health product|\u9999\u6C34|perfume|\u5316\u5986\u54C1|cosmetic|\u80A5\u7682|soap|\u6CB9|oil|\u6DB2\u4F53|liquid|\u98DF\u54C1|food|gel|\u51DD\u80F6|cream|lotion|aerosol|spray/i,
    "LIQUID_SPECIAL",
  ],
];

export function guessCategory(text: string): CargoCategory {
  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return "NORMAL_GOODS";
}
