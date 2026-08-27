/**
 * Seeds the product catalogue, the rate book and the opening exchange rate from
 * AITRANSIT's published price list.
 *
 *   npx tsx prisma/seed-pricing.ts            # add anything missing
 *   npx tsx prisma/seed-pricing.ts --reset    # rebuild the book from scratch
 *
 * `--reset` deactivates every existing rule and rewrites the book. Use it after
 * a price-list revision. Without it the script only fills gaps, so it is safe to
 * re-run and will never quietly change a live price.
 *
 * NOTHING HERE TOUCHES AN INVOICE THAT ALREADY EXISTS. A confirmed invoice
 * keeps the rate it was raised at — see Invoice.freightCost and the note on
 * confirmInvoicePrice — so republishing the book changes what is quoted from
 * now on and nothing that was quoted before.
 */
import { PrismaClient, Prisma } from "@prisma/client";

import {
  ALL_PRODUCTS,
  CATEGORY_RATES,
  MIN_BILLABLE_KG,
  NORMAL_GOODS_KEYWORDS,
  OPENING_ZMW_RATE,
  USD,
  type Product,
} from "./price-list";

const prisma = new PrismaClient();

async function upsertProduct(product: Product, sortOrder: number) {
  const existing = await prisma.cargoType.findUnique({
    where: { category_name: { category: product.category, name: product.name } },
    select: { id: true },
  });

  if (existing) {
    await prisma.cargoType.update({
      where: { id: existing.id },
      data: { route: product.route, active: true, sortOrder },
    });
    return existing.id;
  }

  const created = await prisma.cargoType.create({
    data: {
      name: product.name,
      category: product.category,
      keywords: product.keywords ?? NORMAL_GOODS_KEYWORDS[product.name] ?? null,
      route: product.route,
      sortOrder,
    },
    select: { id: true },
  });
  return created.id;
}

async function main() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    const { count } = await prisma.pricingRule.updateMany({
      where: { active: true },
      data: { active: false },
    });
    console.log(`Deactivated ${count} existing rule(s) — rebuilding the book.`);
  }

  let rules = 0;

  const addRule = async (data: Prisma.PricingRuleUncheckedCreateInput) => {
    const clash = await prisma.pricingRule.findFirst({
      where: {
        active: true,
        category: data.category,
        cargoTypeId: data.cargoTypeId ?? null,
        method: data.method,
        minWeightKg: data.minWeightKg ?? null,
        maxWeightKg: data.maxWeightKg ?? null,
      },
      select: { id: true },
    });
    if (clash) return;
    await prisma.pricingRule.create({ data });
    rules++;
  };

  // ------------------------------------------------------------- catalogue
  /* Sort order is per category, so each group reads in the order it was
     written rather than in the order the loop happened to reach it. */
  const orderByCategory = new Map<string, number>();
  for (const product of ALL_PRODUCTS) {
    const next = orderByCategory.get(product.category) ?? 0;
    await upsertProduct(product, next);
    orderByCategory.set(product.category, next + 1);
  }

  // ------------------------------------------------------------ rate book
  /*
    Three categories, two weight tiers each, and every rule category-wide
    (`cargoTypeId: null`) — which is the whole shape of AITRANSIT's card. A
    product-specific rule beats a category one in lib/pricing.ts, so Finance can
    price one awkward item later without any of this changing.

    MIN_BILLABLE_KG is set on every rule rather than in the engine, so the floor
    stays a published rate somebody can see and change instead of a constant
    buried in the pricing code. It is also what makes the first tier work at
    all: that tier is unbounded below so a 400 g parcel MATCHES it, and this is
    what then bills the parcel as 1 kg. See the long note in price-list.ts.
  */
  for (const rate of CATEGORY_RATES) {
    await addRule({
      category: rate.category,
      cargoTypeId: null,
      method: "WEIGHT_BASED",
      price: new Prisma.Decimal(rate.pricePerKg),
      currency: USD,
      minChargeableKg: new Prisma.Decimal(MIN_BILLABLE_KG),
      ...(rate.minWeightKg === null
        ? {}
        : { minWeightKg: new Prisma.Decimal(rate.minWeightKg) }),
      ...(rate.maxWeightKg === null
        ? {}
        : { maxWeightKg: new Prisma.Decimal(rate.maxWeightKg) }),
      notes:
        rate.maxWeightKg !== null
          ? `${MIN_BILLABLE_KG} to ${rate.maxWeightKg} kg. Freight and duty to the Lusaka warehouse.`
          : `${rate.minWeightKg} kg and above. Freight and duty to the Lusaka warehouse.`,
    });
  }

  // ----------------------------------------------------------- opening FX rate
  const existingRate = await prisma.exchangeRate.findFirst({
    where: { active: true, fromCurrency: "USD", toCurrency: "ZMW" },
  });
  if (!existingRate) {
    await prisma.exchangeRate.create({
      data: {
        rate: new Prisma.Decimal(OPENING_ZMW_RATE),
        notes:
          "Opening rate so nothing divides by a missing figure on day one. Publish the real one in Finance → Pricing.",
      },
    });
    console.log(`Opening exchange rate set: 1 USD = ${OPENING_ZMW_RATE} ZMW`);
  }

  const [products, active] = await Promise.all([
    prisma.cargoType.count({ where: { active: true } }),
    prisma.pricingRule.count({ where: { active: true } }),
  ]);

  console.log(`Products: ${products} active`);
  console.log(`Pricing rules: ${active} active (${rules} added this run)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
