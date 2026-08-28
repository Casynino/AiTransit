import "server-only";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

/**
 * The numbers on the homepage, taken from the operational database.
 *
 * Every one of these is a count of something that actually happened. A website
 * that claims ten thousand happy customers is a website nobody believes, and
 * the real figures here are more persuasive than a round number would be —
 * "1,247 kilos flown last month" reads like a company, not a brochure.
 *
 * Cached for an hour. These move slowly and the homepage is the most-hit page
 * on the site; recomputing five aggregates for every visitor is a bill nobody
 * needs to pay.
 */
export const revalidate = 3600;

export type SiteStats = {
  delivered: number;
  customers: number;
  weightFlownKg: number;
  weeklyFlights: number;
  warehouses: number;
  /**
   * Whether this install has traded yet.
   *
   * A brand-new deployment has delivered nothing to nobody, and a homepage
   * that announces "0 consignments delivered · 0 customers served" is not
   * neutral — it is worse than saying nothing, because it volunteers the one
   * fact that would stop a visitor booking. The page reads this and shows the
   * TERMS instead until there is a record worth quoting.
   */
  hasHistory: boolean;
};

export async function siteStats(): Promise<SiteStats> {
  const [delivered, customers, weight] = await Promise.all([
    prisma.shipment.count({ where: { status: "DELIVERED" } }),
    prisma.customer.count(),
    prisma.shipment.aggregate({
      where: { status: { in: ["IN_TRANSIT", "RECEIVED_AT_ZAMBIA", "READY_FOR_PICKUP", "DELIVERED"] } },
      _sum: { weightKg: true },
    }),
  ]);

  return {
    delivered,
    customers,
    weightFlownKg: Math.round(toNumber(weight._sum.weightKg ?? 0)),
    // Not from the database: it is the operating rhythm, and the same three
    // days generate the whole flight schedule.
    weeklyFlights: 3,
    warehouses: 2,
    // One delivered consignment is not a track record either. The threshold is
    // deliberately above zero so the site does not start boasting on day two.
    hasHistory: delivered >= 25 && customers >= 10,
  };
}
