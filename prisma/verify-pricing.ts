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

    Three categories, two tiers each, plus the rule that makes the first tier
    work: anything under 1 kg bills as 1 kg. That last one is the case worth
    having — the first tier is stored with NO lower bound precisely so a 400 g
    parcel matches it (see prisma/price-list.ts), and if somebody "tidies" that
    into minWeightKg: 1 these tests are what catches it, because the parcel
    stops matching any rule at all and comes back unpriced.
  */

  // Wigs — priced as normal goods: 13.50 under 10 kg, 12.50 from 10 kg.
  { name: "Hair (normal goods), 5 kg → 13.50/kg", category: "NORMAL_GOODS", weightKg: 5, expect: 67.5 },
  { name: "Hair (normal goods), 9.5 kg → 13.50/kg", category: "NORMAL_GOODS", weightKg: 9.5, expect: 128.25 },
  { name: "Hair (normal goods), exactly 10 kg → 12.50/kg", category: "NORMAL_GOODS", weightKg: 10, expect: 125 },
  { name: "Hair (normal goods), 25 kg → 12.50/kg", category: "NORMAL_GOODS", weightKg: 25, expect: 312.5 },

  // Normal goods — 13.50 under 10 kg, 12.50 from 10 kg.
  { name: "Normal goods, 9 kg → 13.50/kg", category: "NORMAL_GOODS", weightKg: 9, expect: 121.5 },
  { name: "Normal goods, exactly 10 kg → 12.50/kg", category: "NORMAL_GOODS", weightKg: 10, expect: 125 },
  { name: "Normal goods, 15 kg → 12.50/kg", category: "NORMAL_GOODS", weightKg: 15, expect: 187.5 },

  /*
    Special category — ONE rate at every weight, unlike normal goods. The 30 kg
    case is the one worth keeping: these items were once priced per piece, so a
    30 kg printer billed as a single USD 13.50 item instead of USD 405.
  */
  { name: "Liquid & special, 4 kg → 13.50/kg", category: "LIQUID_SPECIAL", weightKg: 4, expect: 54 },
  { name: "Liquid & special, exactly 10 kg → 13.50/kg", category: "LIQUID_SPECIAL", weightKg: 10, expect: 135 },
  { name: "Liquid & special, 30 kg → 13.50/kg", category: "LIQUID_SPECIAL", weightKg: 30, expect: 405 },

  /*
    THE MINIMUM BILLABLE WEIGHT. Anything under a kilo is billed as a kilo, so
    each of these is exactly one kilo at that category's under-10 kg rate — and
    none of them may come back unpriced.
  */
  { name: "Normal goods, 0.4 kg → billed as 1 kg at 13.50", category: "NORMAL_GOODS", weightKg: 0.4, expect: 13.5 },
  { name: "Hair (normal goods), 0.2 kg → billed as 1 kg at 13.50", category: "NORMAL_GOODS", weightKg: 0.2, expect: 13.5 },
  { name: "Liquid & special, 0.05 kg → billed as 1 kg at 13.50", category: "LIQUID_SPECIAL", weightKg: 0.05, expect: 13.5 },
  { name: "Normal goods, exactly 1 kg → 13.50", category: "NORMAL_GOODS", weightKg: 1, expect: 13.5 },

  /*
    Weight is the TOTAL of the consignment, not the weight of one box. Three
    4 kg cartons is a 12 kg shipment and earns the over-10 kg rate — quantity
    prices per-item cargo and must never scale the weight.
  */
  { name: "Normal goods, 12 kg in 3 cartons → 12.50/kg", category: "NORMAL_GOODS", weightKg: 12, quantity: 3, expect: 150 },

  /*
    PER-PIECE ITEMS. A laptop is USD 45 whether it weighs two kilos or eight,
    and three of them are USD 135 — quantity is what prices this cargo, weight
    is not. Looked up by product NAME below, because these are product-specific
    rules rather than category ones.
  */
  { name: "Laptop, 2 kg → USD 45 flat", category: "ELECTRONICS", typeName: "Laptop", weightKg: 2, expect: 45 },
  { name: "Laptop, 8 kg → still USD 45", category: "ELECTRONICS", typeName: "Laptop", weightKg: 8, expect: 45 },
  { name: "Laptop x3 → USD 135", category: "ELECTRONICS", typeName: "Laptop", weightKg: 6, quantity: 3, expect: 135 },
  { name: "AirPods → USD 10", category: "ELECTRONICS", typeName: "AirPods", weightKg: 0.3, expect: 10 },
  { name: "Smart Phone (Full Box) → USD 25", category: "ELECTRONICS", typeName: "Smart Phone (Full Box)", weightKg: 0.5, expect: 25 },
  { name: "Camera → USD 45", category: "ELECTRONICS", typeName: "Camera", weightKg: 3, expect: 45 },
  { name: "Documents → USD 40", category: "ELECTRONICS", typeName: "Documents", weightKg: 1.2, expect: 40 },
];

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

  console.log(
    `\n${CASES.length - failures}/${CASES.length} passed${failures ? ` — ${failures} FAILED` : ""}`
  );
  if (failures) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
