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

/*
  THESE ARE THE SOURCE SYSTEM'S NUMBERS, copied deliberately as a starting
  point for the owner to edit — not AITRANSIT's own card.

  Currency is USD, as it is upstream. What changed on the way over is the LOCAL
  currency the books convert into: kwacha, not shilling. Nothing here is in
  ZMW; ZMW is what a USD figure is displayed as, at the rate on the invoice.

  Wigs has no counterpart upstream — there it is one ITEM inside normal goods,
  not a category — so it takes the normal-goods rate. That is the closest thing
  to a faithful copy, and it is the row most likely to want changing first.
*/
export const CATEGORY_RATES: CategoryRate[] = [
  // Wigs — Guangzhou route. Priced as normal goods; see the note above.
  { category: "WIGS", minWeightKg: null, maxWeightKg: 10, pricePerKg: 13.5 },
  { category: "WIGS", minWeightKg: 10, maxWeightKg: null, pricePerKg: 12.5 },
  // Normal goods — Guangzhou route. The bulk of the trade.
  { category: "NORMAL_GOODS", minWeightKg: null, maxWeightKg: 10, pricePerKg: 13.5 },
  { category: "NORMAL_GOODS", minWeightKg: 10, maxWeightKg: null, pricePerKg: 12.5 },
  /*
    Special category — Hong Kong route. ONE rate at every weight upstream,
    where normal goods has two tiers. Expressed here as a single unbounded
    band rather than two identical ones, so the card reads honestly.
  */
  { category: "SPECIAL_CATEGORY", minWeightKg: null, maxWeightKg: null, pricePerKg: 13.5 },
];

/*
  PER-PIECE ITEMS — the mechanism, not just the numbers.

  Upstream, a laptop costs USD 45 whether it weighs two kilos or five, because
  what the customer is buying is carriage of a laptop. Nine items work that
  way and everything else in the category falls back to the per-kg rate above.

  A product-specific rule beats a category-wide one in lib/pricing.ts, which is
  what makes this work without any special case in the engine.
*/
export const PER_PIECE_USD: Record<string, number> = {
  "Smart Phone (Full Box)": 25,
  "Smart Phone (Unboxed)": 20,
  Laptop: 45,
  Tablet: 25,
  "Kids Tablet": 15,
  "Smart Watch": 10,
  Camera: 45,
  Documents: 40,
  AirPods: 10,
};

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
  "Bags",
  "Hats",
  "Fabrics",
  "Earrings",
  "Chains",
  "Bracelets",
  "Rings (without stones)",
  "LCD",
  "Flash & Memory Cards",
  "Car Accessories",
  "Camera (no battery)",
  "Household items",
  "Kitchenware",
  "Toys",
  "Furniture & fittings",
  "Stationery",
  "General Merchandise",
  "Others",
].map((name) => ({
  name,
  category: "NORMAL_GOODS" as const,
  method: "WEIGHT_BASED" as const,
  route: "GUANGZHOU" as const,
}));

export const NORMAL_GOODS_KEYWORDS: Record<string, string> = {
  Clothes: "clothes,clothing,衣服,garment,袜,sock,裤,shirt,dress",
  Shoes: "shoes,鞋子,皮鞋,footwear,鞋带,鞋垫,sneaker,boot,sandal",
  Bags: "bag,bags,箱包,包包,suitcase,luggage,backpack,handbag",
  Hats: "hat,hats,帽子,cap",
  Fabrics: "fabric,fabrics,布,布料,textile,cloth,roll",
  Earrings: "earring,earrings,耳环",
  Chains: "chain,chains,项链,necklace",
  Bracelets: "bracelet,bracelets,手链,bangle",
  "Rings (without stones)": "ring,rings,戒指",
  LCD: "lcd,液晶,显示屏,panel",
  "Flash & Memory Cards": "memory card,flash,u盘,u disk,内存卡,sd card,usb",
  "Car Accessories":
    "car,auto,仪表盘,dashboard,活塞,piston,格栅,grille,减震器,shock absorber,spare",
  "Camera (no battery)": "camera,相机,摄像头,no battery,不带电池",
  "Household items": "household,home,家居,家用,日用品",
  Kitchenware: "kitchen,厨房,厨具,cookware,utensil",
  Toys: "toy,toys,玩具",
  "Furniture & fittings": "furniture,家具,fitting,fixture,hinge,handle",
  Stationery: "stationery,文具,pen,paper,notebook,exercise book",
  "General Merchandise": "general,assorted,配件,accessories,杂货,mixed",
  Others: "other,misc",
};

/**
 * WIGS — a category of its own, and the reason AITRANSIT's card has three rows
 * where the source system has two. Hair is a large enough share of the Zambian
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
 * ITEMISED, not grouped. These used to be eleven umbrella names — "Phones &
 * accessories", "Cameras & audio" — which is tidier to read and worse to use:
 * a clerk holding a PlayStation had to decide whether it was electronics or
 * audio, and Finance lost the one field that tells them what is actually in
 * the box. The list is now the same granularity the desks already work at.
 *
 * Everything here is WEIGHT_BASED, deliberately. The source system prices some
 * of these per piece; AITRANSIT's card is per kilo across the board, and
 * importing a per-item method under a per-kilo rate would bill a 30 kg printer
 * as one item.
 */
export const SPECIAL_CATEGORY: Product[] = [
  { name: "Smart Phone (Full Box)", keywords: "phone,smartphone,手机,full box" },
  { name: "Smart Phone (Unboxed)", keywords: "unboxed,老人机,senior phone" },
  { name: "Laptop", keywords: "laptop,notebook,笔记本,电脑" },
  { name: "Tablet", keywords: "tablet,ipad,平板" },
  { name: "Kids Tablet", keywords: "kids tablet,儿童平板" },
  { name: "Smart Watch", keywords: "watch,smart watch,手表" },
  { name: "Camera", keywords: "camera,相机,摄像头" },
  { name: "AirPods", keywords: "airpods,earbuds,耳机" },
  { name: "Speakers", keywords: "speaker,音箱,soundbar" },
  { name: "PlayStation", keywords: "playstation,console,游戏机,xbox" },
  { name: "Batteries", keywords: "battery,电池,power bank,inverter,逆变器" },
  { name: "Monitors", keywords: "monitor,显示器,screen" },
  { name: "Chargers", keywords: "charger,充电器,cable,adapter" },
  { name: "Printers", keywords: "printer,打印机,3d printer,toner" },
  { name: "LED Displays", keywords: "led,display,模组,module" },
  { name: "Medicines & Food Stuff", keywords: "medicine,药,food,食品,蛋白粉,protein,保健品,capsule,胶囊" },
  { name: "Cosmetics", keywords: "cosmetic,化妆品,perfume,香水,cream,lotion,makeup" },
  { name: "Oils", keywords: "oil,油,lubricant,润滑剂,凝胶,gel,沐浴露,liquid,液体" },
  { name: "Documents", keywords: "document,papers,文件" },
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
