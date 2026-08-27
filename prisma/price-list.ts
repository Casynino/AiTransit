/**
 * AITRANSIT's published price list, as data.
 *
 * Extracted so that seeding and the catalogue clean-up read the same list. Two
 * copies of "what products exist" is how the old catalogue ended up holding
 * both "Clothes" and "Clothing".
 *
 * ---------------------------------------------------------------------------
 * THE MINIMUM BILLABLE WEIGHT, AND WHY THE FIRST TIER HAS NO LOWER BOUND
 * ---------------------------------------------------------------------------
 * The rule the business publishes is "1 to 10 kg" and "10 kg and above", plus:
 * anything under 1 kg is billed as 1 kg.
 *
 * Those are two different rules and they must be expressed in two different
 * columns. Writing the first tier as minWeightKg = 1 would read correctly and
 * behave disastrously: `resolveRule` in lib/pricing.ts matches a tier on the
 * cargo's ACTUAL weight, so a 0.4 kg parcel would fall below every tier, match
 * no rule at all, and come back "no active rate covers that cargo" — the one
 * kind of cargo the minimum-weight rule exists to price.
 *
 * So the first tier is unbounded below (`minWeightKg: null`, i.e. "up to
 * 10 kg") and the floor lives in `minChargeableKg: 1`, which is the column the
 * engine applies AFTER a rule is found. A 0.4 kg parcel matches the first tier
 * and is billed for 1 kg. A 10 kg parcel falls into the second tier, because
 * the bounds are half-open [min, max) and the customer wants the cheaper side.
 *
 * The public rate card prints "1 - 10 kg" for that first tier by reading
 * `minChargeableKg` back — see tierLabel in lib/rate-card.ts. The words on the
 * website and the arithmetic on the invoice come from the same row.
 */
import type { CargoCategory, Origin, PricingMethod } from "@prisma/client";

export const USD = "USD";

/**
 * Opening USD → ZMW rate, for a fresh database.
 *
 * A starting figure so nothing divides by a missing rate on day one, not a
 * quoted rate. Admin publishes the real one on the pricing screen, and every
 * invoice freezes whatever was in force when it was raised.
 */
export const OPENING_ZMW_RATE = 27;

/*
  Anything below this is billed as this. The company's own rule.

  Re-exported from lib/billing-policy.ts rather than declared here, so the
  public calculator can state the policy without importing this seed script and
  its whole product catalogue.
*/
export { MIN_BILLABLE_KG } from "../lib/billing-policy";

export type Product = {
  name: string;
  category: CargoCategory;
  method: PricingMethod;
  /** Per kg for WEIGHT_BASED, per piece for FIXED_PER_ITEM. */
  price?: number;
  route: Origin;
  keywords?: string;
};

/**
 * The category rates, exactly as printed on the AITRANSIT flyer.
 *
 * Category-wide rules — `cargoTypeId: null` — so every product in a category is
 * priced by them unless somebody publishes a more specific rule for one
 * product. That is the resolution order lib/pricing.ts already implements, and
 * it is what lets Finance price one awkward item without touching the card.
 *
 * All rates include freight AND duty to the Lusaka warehouse. Nothing is added
 * at the counter, which is why the invoice has no duty line.
 */
export type CategoryRate = {
  category: CargoCategory;
  /** Inclusive lower bound in kg; null means unbounded below. */
  minWeightKg: number | null;
  /** Exclusive upper bound in kg; null means unbounded above. */
  maxWeightKg: number | null;
  pricePerKg: number;
};

export const CATEGORY_RATES: CategoryRate[] = [
  // Wigs — Guangzhou route.
  { category: "WIGS", minWeightKg: null, maxWeightKg: 10, pricePerKg: 14.4 },
  { category: "WIGS", minWeightKg: 10, maxWeightKg: null, pricePerKg: 14.0 },
  // Normal goods — Guangzhou route. The bulk of the trade.
  { category: "NORMAL_GOODS", minWeightKg: null, maxWeightKg: 10, pricePerKg: 13.5 },
  { category: "NORMAL_GOODS", minWeightKg: 10, maxWeightKg: null, pricePerKg: 13.0 },
  // Special category — Hong Kong route.
  { category: "SPECIAL_CATEGORY", minWeightKg: null, maxWeightKg: 10, pricePerKg: 16.3 },
  { category: "SPECIAL_CATEGORY", minWeightKg: 10, maxWeightKg: null, pricePerKg: 15.3 },
];

/**
 * NORMAL GOODS — the ordinary trade, out of Guangzhou.
 *
 * "Others" is deliberately present in every category and is deliberately last
 * (see othersLast in lib/cargo-types.ts). A desk with a box that fits nothing
 * on the list needs somewhere honest to put it; without one they pick the
 * nearest wrong thing, and the nearest wrong thing changes the price.
 */
export const NORMAL_GOODS: Product[] = [
  "Clothes",
  "Shoes",
  "Bags & luggage",
  "Household items",
  "Kitchenware",
  "Toys",
  "Furniture & fittings",
  "Stationery",
  "Jewellery (without stones)",
  "General merchandise",
  "Others",
].map((name) => ({
  name,
  category: "NORMAL_GOODS" as const,
  method: "WEIGHT_BASED" as const,
  route: "GUANGZHOU" as const,
}));

export const NORMAL_GOODS_KEYWORDS: Record<string, string> = {
  Clothes: "clothes,clothing,衣服,garment,帽子,hat,袜,sock,裤",
  Shoes: "shoes,鞋子,皮鞋,footwear,鞋带,鞋垫,sneaker,boot",
  "Bags & luggage": "bag,bags,箱包,包包,suitcase,luggage,backpack",
  "Household items": "household,home,家居,家用,日用品",
  Kitchenware: "kitchen,厨房,厨具,cookware,utensil",
  Toys: "toy,toys,玩具",
  "Furniture & fittings": "furniture,家具,fitting,fixture",
  Stationery: "stationery,文具,pen,paper,notebook",
  "Jewellery (without stones)": "earring,耳环,chain,项链,ring,戒指,jewellery,jewelry",
  "General merchandise": "general,assorted,配件,accessories,杂货",
  Others: "other,misc",
};

/**
 * WIGS — a category of its own, and the reason AITRANSIT's card has three rows
 * where most forwarders have two. Hair is a large enough share of the Zambian
 * trade to be priced separately, and it flies Guangzhou like normal goods.
 */
export const WIGS: Product[] = [
  { name: "Wigs", keywords: "wig,wigs,假发,lace front,ponytail" },
  { name: "Hair bundles", keywords: "bundle,bundles,weave,人发,发包,human hair" },
  { name: "Closures & frontals", keywords: "closure,frontal,lace closure" },
  { name: "Braiding hair", keywords: "braid,braiding,辫发,crochet" },
  { name: "Hair products", keywords: "hair product,hair care,护发,shampoo,relaxer" },
  { name: "Others", keywords: "other,misc" },
].map((item) => ({
  ...item,
  category: "WIGS" as const,
  method: "WEIGHT_BASED" as const,
  route: "GUANGZHOU" as const,
}));

/**
 * SPECIAL CATEGORY — the higher rate and the Hong Kong route.
 *
 * Electronics, batteries, liquids and cosmetics together, because they share a
 * price and an airport. The customer-facing NAME of this category is editable
 * in Admin settings — the business is still deciding what to call it — but the
 * enum value and therefore every priced invoice is unaffected by a rename.
 */
export const SPECIAL_CATEGORY: Product[] = [
  { name: "Electronics", keywords: "electronic,电子,gadget" },
  { name: "Phones & accessories", keywords: "phone,手机,smartphone,charger,充电器,cable,case" },
  { name: "Laptops & computers", keywords: "laptop,notebook,笔记本,电脑,computer,tablet,ipad,平板" },
  { name: "Cameras & audio", keywords: "camera,相机,speaker,音箱,earphone,airpods,microphone" },
  { name: "Batteries & power", keywords: "battery,电池,power bank,inverter,逆变器,solar,太阳能" },
  { name: "LED & displays", keywords: "led,display,monitor,显示器,lcd,屏" },
  { name: "Cosmetics & perfume", keywords: "cosmetic,化妆品,perfume,香水,cream,lotion" },
  { name: "Medicines & food", keywords: "medicine,药,food,食品,保健品,capsule,supplement" },
  { name: "Liquids & oils", keywords: "liquid,液体,oil,油,gel,凝胶,aerosol,spray" },
  { name: "Machinery & spares", keywords: "machine,机器,motor,电机,bearing,轴承,spare,tool" },
  { name: "Others", keywords: "other,misc" },
].map((item) => ({
  ...item,
  category: "SPECIAL_CATEGORY" as const,
  method: "WEIGHT_BASED" as const,
  route: "HONG_KONG" as const,
}));

/** Every product AITRANSIT's catalogue ships with. */
export const ALL_PRODUCTS: Product[] = [
  ...NORMAL_GOODS,
  ...WIGS,
  ...SPECIAL_CATEGORY,
];
