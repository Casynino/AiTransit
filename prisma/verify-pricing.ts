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
  category: "NORMAL_GOODS" | "WIGS" | "SPECIAL_CATEGORY";
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

  // Wigs — 14.40 under 10 kg, 14.00 from 10 kg.
  { name: "Wigs, 5 kg → 14.40/kg", category: "WIGS", weightKg: 5, expect: 72 },
  { name: "Wigs, 9.5 kg → 14.40/kg", category: "WIGS", weightKg: 9.5, expect: 136.8 },
  { name: "Wigs, exactly 10 kg → 14.00/kg", category: "WIGS", weightKg: 10, expect: 140 },
  { name: "Wigs, 25 kg → 14.00/kg", category: "WIGS", weightKg: 25, expect: 350 },

  // Normal goods — 13.50 under 10 kg, 13.00 from 10 kg.
  { name: "Normal goods, 9 kg → 13.50/kg", category: "NORMAL_GOODS", weightKg: 9, expect: 121.5 },
  { name: "Normal goods, exactly 10 kg → 13.00/kg", category: "NORMAL_GOODS", weightKg: 10, expect: 130 },
  { name: "Normal goods, 15 kg → 13.00/kg", category: "NORMAL_GOODS", weightKg: 15, expect: 195 },

  // Special category — 16.30 under 10 kg, 15.30 from 10 kg.
  { name: "Special, 4 kg → 16.30/kg", category: "SPECIAL_CATEGORY", weightKg: 4, expect: 65.2 },
  { name: "Special, exactly 10 kg → 15.30/kg", category: "SPECIAL_CATEGORY", weightKg: 10, expect: 153 },
  { name: "Special, 30 kg → 15.30/kg", category: "SPECIAL_CATEGORY", weightKg: 30, expect: 459 },

  /*
    THE MINIMUM BILLABLE WEIGHT. Anything under a kilo is billed as a kilo, so
    each of these is exactly one kilo at that category's under-10 kg rate — and
    none of them may come back unpriced.
  */
  { name: "Normal goods, 0.4 kg → billed as 1 kg at 13.50", category: "NORMAL_GOODS", weightKg: 0.4, expect: 13.5 },
  { name: "Wigs, 0.2 kg → billed as 1 kg at 14.40", category: "WIGS", weightKg: 0.2, expect: 14.4 },
  { name: "Special, 0.05 kg → billed as 1 kg at 16.30", category: "SPECIAL_CATEGORY", weightKg: 0.05, expect: 16.3 },
  { name: "Normal goods, exactly 1 kg → 13.50", category: "NORMAL_GOODS", weightKg: 1, expect: 13.5 },

  /*
    Weight is the TOTAL of the consignment, not the weight of one box. Three
    4 kg cartons is a 12 kg shipment and earns the over-10 kg rate — quantity
    prices per-item cargo and must never scale the weight.
  */
  { name: "Normal goods, 12 kg in 3 cartons → 13.00/kg", category: "NORMAL_GOODS", weightKg: 12, quantity: 3, expect: 156 },
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
