/**
 * Checks the live rate book against the worked examples in the pricing spec.
 *
 *   npx tsx prisma/verify-pricing.ts
 *
 * Runs the real engine (lib/pricing), not a copy of it, so a change to
 * resolution or tier logic shows up here. Exits non-zero on a mismatch, which
 * makes it usable as a pre-deploy gate after any rate change.
 */
import { PrismaClient } from "@prisma/client";

import type { CargoCategory } from "@prisma/client";

import { guessCategory } from "../lib/cargo";
import { quote } from "../lib/pricing";

const prisma = new PrismaClient();

type Case = {
  name: string;
  category: "NORMAL_GOODS" | "ELECTRONICS" | "LIQUID_SPECIAL";
  typeName?: string;
  weightKg: number;
  quantity?: number;
  /** Expected total, or null when the cargo should come back unpriced. */
  expect: number | null;
};

const CASES: Case[] = [
  /*
    AITRANSIT's published card, checked against the real engine.

    Three categories, plus the rule that makes the first tier work: anything
    under 1 kg bills as 1 kg. That last one is the case worth having — the
    first tier is stored with NO lower bound precisely so a 400 g parcel
    matches it (see prisma/price-list.ts), and if somebody "tidies" that into
    minWeightKg: 1 these tests are what catches it, because the parcel stops
    matching any rule at all and comes back unpriced.
  */

  /*
    NORMAL GOODS — 14.50 under 10 kg, 14.00 from 10 kg.

    The boundary case is the one that earns its place: exactly 10 kg must take
    the CHEAPER upper band, not the dearer lower one. An off-by-one there is
    invisible on a rate card and wrong on every ten-kilo consignment.
  */
  { name: "Normal goods, 9 kg → 14.50/kg", category: "NORMAL_GOODS", weightKg: 9, expect: 130.5 },
  { name: "Normal goods, 9.5 kg → 14.50/kg", category: "NORMAL_GOODS", weightKg: 9.5, expect: 137.75 },
  { name: "Normal goods, exactly 10 kg → 14.00/kg", category: "NORMAL_GOODS", weightKg: 10, expect: 140 },
  { name: "Normal goods, 15 kg → 14.00/kg", category: "NORMAL_GOODS", weightKg: 15, expect: 210 },
  { name: "Normal goods, 25 kg → 14.00/kg", category: "NORMAL_GOODS", weightKg: 25, expect: 350 },

  // Hair, which is now an item under normal goods and takes the same two bands.
  { name: "Hair (normal goods), 5 kg → 14.50/kg", category: "NORMAL_GOODS", weightKg: 5, expect: 72.5 },
  { name: "Hair (normal goods), 12 kg → 14.00/kg", category: "NORMAL_GOODS", weightKg: 12, expect: 168 },

  /*
    THE HONG KONG CATEGORIES — 16.50 at every weight, both of them.

    The 30 kg case is the one worth keeping: these items were once priced per
    piece, so a 30 kg printer billed as a single item instead of by weight.
  */
  { name: "Liquid & special, 4 kg → 16.50/kg", category: "LIQUID_SPECIAL", weightKg: 4, expect: 66 },
  { name: "Liquid & special, exactly 10 kg → 16.50/kg", category: "LIQUID_SPECIAL", weightKg: 10, expect: 165 },
  { name: "Liquid & special, 30 kg → 16.50/kg", category: "LIQUID_SPECIAL", weightKg: 30, expect: 495 },

  /*
    ELECTRONICS THAT ARE NOT ON THE PER-PIECE LIST fall back to 16.50/kg. A box
    of chargers, a printer, a monitor. This is the case that proves the fallback
    exists at all — every other electronics case below is a per-piece override,
    so without this one the category rate could be missing and nothing would say.
  */
  { name: "Electronics off-list (Chargers), 6 kg → 16.50/kg", category: "ELECTRONICS", typeName: "Chargers", weightKg: 6, expect: 99 },
  { name: "Electronics off-list, no item chosen, 4 kg → 16.50/kg", category: "ELECTRONICS", weightKg: 4, expect: 66 },

  /*
    THE MINIMUM BILLABLE WEIGHT. Anything under a kilo is billed as a kilo, so
    each of these is exactly one kilo at that category's rate — and none of them
    may come back unpriced.
  */
  { name: "Normal goods, 0.4 kg → billed as 1 kg at 14.50", category: "NORMAL_GOODS", weightKg: 0.4, expect: 14.5 },
  { name: "Normal goods, exactly 1 kg → 14.50", category: "NORMAL_GOODS", weightKg: 1, expect: 14.5 },
  { name: "Liquid & special, 0.05 kg → billed as 1 kg at 16.50", category: "LIQUID_SPECIAL", weightKg: 0.05, expect: 16.5 },

  /*
    Weight is the TOTAL of the consignment, not the weight of one box. Three
    4 kg cartons is a 12 kg shipment and earns the over-10 kg rate — quantity
    prices per-item cargo and must never scale the weight.
  */
  { name: "Normal goods, 12 kg in 3 cartons → 14.00/kg", category: "NORMAL_GOODS", weightKg: 12, quantity: 3, expect: 168 },

  /*
    PER-PIECE ITEMS. A laptop is USD 50 whether it weighs two kilos or eight,
    and three of them are USD 150 — quantity is what prices this cargo, weight
    is not. Looked up by product NAME, because these are product-specific rules
    rather than category ones.

    All nine are listed. They are the prices a customer is quoted by hand over
    WhatsApp, so a drift between this file and the flyer is a drift a customer
    finds before we do.
  */
  { name: "Laptop, 2 kg → USD 50 flat", category: "ELECTRONICS", typeName: "Laptop", weightKg: 2, expect: 50 },
  { name: "Laptop, 8 kg → still USD 50", category: "ELECTRONICS", typeName: "Laptop", weightKg: 8, expect: 50 },
  { name: "Laptop x3 → USD 150", category: "ELECTRONICS", typeName: "Laptop", weightKg: 6, quantity: 3, expect: 150 },
  { name: "Camera → USD 50", category: "ELECTRONICS", typeName: "Camera", weightKg: 3, expect: 50 },
  { name: "Documents → USD 30", category: "ELECTRONICS", typeName: "Documents", weightKg: 1.2, expect: 30 },
  { name: "Smart Phone (Full Box) → USD 25", category: "ELECTRONICS", typeName: "Smart Phone (Full Box)", weightKg: 0.5, expect: 25 },
  { name: "Tablet → USD 25", category: "ELECTRONICS", typeName: "Tablet", weightKg: 0.7, expect: 25 },
  { name: "Smart Phone (Unboxed) → USD 20", category: "ELECTRONICS", typeName: "Smart Phone (Unboxed)", weightKg: 0.4, expect: 20 },
  { name: "Kids Tablet → USD 15", category: "ELECTRONICS", typeName: "Kids Tablet", weightKg: 0.6, expect: 15 },
  { name: "AirPods → USD 10", category: "ELECTRONICS", typeName: "AirPods", weightKg: 0.3, expect: 10 },
  { name: "Smart Watch → USD 10", category: "ELECTRONICS", typeName: "Smart Watch", weightKg: 0.2, expect: 10 },
];

/*
  THE CLASSIFIER, CHECKED TOO.

  guessCategory decides the airport and therefore the price when a packing list
  is imported, and it is a wall of regex nobody reads. A blanket rename during
  the three-category change pointed every hair word at ELECTRONICS — which
  would have flown a box of wigs to Hong Kong at 16.50 instead of Guangzhou at
  14.50, and no pricing test would have noticed, because every case above names
  its category explicitly.

  These are the words most likely to be typed on a real packing list.
*/
const GUESSES: [string, CargoCategory][] = [
  ["Human hair bundles 20 inch", "NORMAL_GOODS"],
  ["lace frontal closure", "NORMAL_GOODS"],
  ["braiding hair extension", "NORMAL_GOODS"],
  ["假发", "NORMAL_GOODS"],
  ["Ladies shoes size 38", "NORMAL_GOODS"],
  ["cotton fabric roll", "NORMAL_GOODS"],
  ["iPhone 15 full box", "ELECTRONICS"],
  ["HP laptop", "ELECTRONICS"],
  ["手机", "ELECTRONICS"],
  ["camera lens", "ELECTRONICS"],
  ["LED display module", "ELECTRONICS"],
  ["hair oil 500ml", "LIQUID_SPECIAL"],
  ["cosmetics and perfume", "LIQUID_SPECIAL"],
  ["car battery", "LIQUID_SPECIAL"],
  ["药品", "LIQUID_SPECIAL"],
  ["laser printer toner", "LIQUID_SPECIAL"],
];

function checkGuesses() {
  let ok = 0;
  let bad = 0;
  console.log("\nClassifier — guessCategory()\n");
  for (const [text, expected] of GUESSES) {
    const got = guessCategory(text);
    if (got === expected) {
      ok += 1;
      console.log(`✓ "${text}" → ${got}`);
    } else {
      bad += 1;
      console.log(`✗ "${text}"\n    got ${got}, expected ${expected}`);
    }
  }
  return { ok, bad };
}

async function main() {
  let failures = 0;

  for (const testCase of CASES) {
    const cargoTypeId = testCase.typeName
      ? (
          await prisma.cargoType.findFirst({
            where: { name: testCase.typeName },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    if (testCase.typeName && !cargoTypeId) {
      console.log(`✗ ${testCase.name}\n    cargo type "${testCase.typeName}" not found`);
      failures++;
      continue;
    }

    const result = await quote({
      category: testCase.category,
      cargoTypeId,
      weightKg: testCase.weightKg,
      quantity: testCase.quantity,
    });

    const actual = result.ok ? Number(result.total.toFixed(2)) : null;
    const pass = actual === testCase.expect;

    if (!pass) failures++;
    const shown =
      actual === null ? "unpriced" : `USD ${actual.toFixed(2)}`;
    const wanted =
      testCase.expect === null ? "unpriced" : `USD ${testCase.expect.toFixed(2)}`;

    console.log(
      `${pass ? "✓" : "✗"} ${testCase.name}\n    got ${shown}, expected ${wanted}` +
        (result.ok
          ? `\n    route ${result.route}, ${result.method}, rate ${result.rate}`
          : "")
    );
  }

  const priced = CASES.length - failures;
  const guesses = checkGuesses();
  const total = failures + guesses.bad;

  console.log(
    `\n${priced}/${CASES.length} prices, ` +
      `${guesses.ok}/${guesses.ok + guesses.bad} classifications` +
      (total ? ` — ${total} FAILED` : "")
  );
  if (total) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
