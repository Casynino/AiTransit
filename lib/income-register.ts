import "server-only";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

/**
 * Everything received, and what is still owed.
 *
 * ONE MODULE, BECAUSE THE FIGURES HAVE TO AGREE. The income page shows a
 * headline total, a split by account, a split by what was billed, a day-by-day
 * register and a list of who still owes — six answers that are all the same
 * question asked differently. Computed in six places they drift, and a page
 * whose account chips do not add up to its own headline is a page nobody
 * trusts again.
 *
 * TWO BASES, NEVER MIXED. Income RECEIVED is money that actually arrived — the
 * payments. Billed is what was put on invoices, which is a different thing and
 * usually a bigger one. Both belong on this page, because the gap between them
 * IS the business's cash position, but every figure below says plainly which
 * of the two it is. Target's own page makes the same distinction and it is the
 * single most important thing on it: "it becomes income only when the money is
 * actually received".
 *
 * VOIDED PAYMENTS ARE NOT INCOME. Every query here excludes `voidedAt`, so a
 * payment recorded in error and reversed stops counting the moment it is
 * reversed rather than being netted off somewhere further down.
 */

export type Period =
  | "all"
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "year"
  | "custom";

/** The named ranges, resolved against the reader's own midnight. */
export function periodRange(
  period: Period,
  from?: string,
  to?: string
): { gte?: Date; lte?: Date } {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);

  switch (period) {
    case "today":
      return { gte: midnight };
    case "yesterday": {
      const start = new Date(midnight);
      start.setDate(start.getDate() - 1);
      return { gte: start, lte: new Date(midnight.getTime() - 1) };
    }
    case "week": {
      /* Monday, because a Zambian working week starts on one. A Sunday-based
         week puts Monday's takings in "last week" for the whole of Monday. */
      const start = new Date(midnight);
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      return { gte: start };
    }
    case "month": {
      const start = new Date(midnight);
      start.setDate(1);
      return { gte: start };
    }
    case "year": {
      const start = new Date(midnight);
      start.setMonth(0, 1);
      return { gte: start };
    }
    case "custom": {
      const range: { gte?: Date; lte?: Date } = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) range.gte = d;
      }
      if (to) {
        const d = new Date(`${to}T23:59:59.999`);
        if (!Number.isNaN(d.getTime())) range.lte = d;
      }
      return range;
    }
    default:
      return {};
  }
}

export type IncomeFilters = {
  period: Period;
  from?: string;
  to?: string;
  q?: string;
};

/**
 * The register, in one round trip.
 *
 * `take` on the payment list is deliberately generous: this is a page somebody
 * scrolls looking for one receipt, and paginating a day's takings across two
 * pages makes the day totals lie.
 */
export async function incomeRegister(filters: IncomeFilters) {
  const range = periodRange(filters.period, filters.from, filters.to);
  const q = filters.q?.trim();

  const where = {
    voidedAt: null,
    ...(range.gte || range.lte ? { paidAt: range } : {}),
    ...(q
      ? {
          OR: [
            { reference: { contains: q, mode: "insensitive" as const } },
            { receipt: { receiptNumber: { contains: q, mode: "insensitive" as const } } },
            {
              invoice: {
                OR: [
                  { invoiceNumber: { contains: q, mode: "insensitive" as const } },
                  { customer: { name: { contains: q, mode: "insensitive" as const } } },
                  {
                    shipment: {
                      trackingNumber: { contains: q, mode: "insensitive" as const },
                    },
                  },
                ],
              },
            },
          ],
        }
      : {}),
  };

  const [payments, totals, byAccount, tendered, accounts] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      take: 400,
      select: {
        id: true,
        amount: true,
        currency: true,
        creditedAmount: true,
        method: true,
        reference: true,
        paidAt: true,
        account: { select: { id: true, name: true, currency: true, accountNumber: true } },
        receivedBy: { select: { name: true } },
        receipt: { select: { receiptNumber: true } },
        invoice: {
          select: {
            invoiceNumber: true,
            currency: true,
            customer: { select: { id: true, name: true } },
            shipment: { select: { trackingNumber: true } },
          },
        },
      },
    }),

    /* The headline. `creditedAmount` is what the payment was worth in the
       invoice's currency — the figure that actually settles a bill — so it is
       what the total is built from, not the tendered amount. */
    prisma.payment.aggregate({
      where,
      _sum: { creditedAmount: true },
      _count: true,
    }),

    prisma.payment.groupBy({
      where,
      by: ["accountId"],
      _sum: { creditedAmount: true },
      _count: true,
    }),

    /* How much was handed over in kwacha rather than dollars. Not a copy of
       the total above it: it is the share of takings that arrived in local
       currency, which is what tells Finance how much kwacha the tin is seeing. */
    prisma.payment.aggregate({
      where: { ...where, currency: "ZMW" },
      _sum: { creditedAmount: true },
      _count: true,
    }),

    prisma.companyAccount.findMany({
      select: { id: true, name: true, currency: true },
    }),
  ]);

  const accountName = new Map(accounts.map((a) => [a.id, a]));

  return {
    payments,
    receivedUsd: toNumber(totals._sum.creditedAmount),
    count: totals._count,
    tenderedInKwachaUsd: toNumber(tendered._sum.creditedAmount),
    tenderedInKwachaCount: tendered._count,
    accounts: byAccount
      .map((row) => ({
        id: row.accountId,
        name: row.accountId
          ? (accountName.get(row.accountId)?.name ?? "Unknown account")
          : "No account named",
        currency: row.accountId ? accountName.get(row.accountId)?.currency : null,
        usd: toNumber(row._sum.creditedAmount),
        count: row._count,
      }))
      .sort((a, b) => b.usd - a.usd),
  };
}

/**
 * What was BILLED in the same window — freight, storage and everything added
 * by hand.
 *
 * Dated by when the invoice was CONFIRMED, not when it was drafted: a draft is
 * Finance's working figure and nobody owes it. Kept apart from the received
 * figures above because they answer different questions, and a page that adds
 * the two together is a page reporting revenue twice.
 */
export async function billedInWindow(filters: IncomeFilters) {
  const range = periodRange(filters.period, filters.from, filters.to);

  /*
    STATUS, NOT `confirmedAt`.

    This first required `confirmedAt: { not: null }` and reported every billed
    figure as zero beside an income total of three hundred thousand — because
    NOT ONE invoice in this system has that column set. `confirmedAt` is
    written by one specific Finance action; the field that says an invoice is
    real is its status, which starts at UNPAID and is DRAFT only while Finance
    is still working it out. That is the predicate the portal and every other
    query uses, and this now matches them.

    Dated on `issuedAt`, which always exists. A window built on a column that
    is usually null is a window that is usually empty.
  */
  const invoices = await prisma.invoice.aggregate({
    where: {
      status: { notIn: ["DRAFT", "VOID"] },
      ...(range.gte || range.lte ? { issuedAt: range } : {}),
    },
    _sum: {
      freightCost: true,
      storageCharge: true,
      otherCharges: true,
      discount: true,
    },
    _count: true,
  });

  return {
    freightUsd: toNumber(invoices._sum.freightCost),
    storageUsd: toNumber(invoices._sum.storageCharge),
    otherUsd: toNumber(invoices._sum.otherCharges),
    discountUsd: toNumber(invoices._sum.discount),
    count: invoices._count,
  };
}

/**
 * Who still owes, worst first.
 *
 * DELIBERATELY NOT FILTERED BY THE PERIOD. A debt from March is still a debt
 * in September, and hiding it because the reader happens to be looking at this
 * week would be the one thing on this page that could lose the business money.
 * The date filter governs what came IN; this governs what has not.
 */
export async function toCollect(limit = 6) {
  const [rows, totals] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      orderBy: [{ dueDate: "asc" }, { issuedAt: "asc" }],
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        total: true,
        amountPaid: true,
        dueDate: true,
        creditStatus: true,
        customer: { select: { id: true, name: true } },
        shipment: { select: { id: true, trackingNumber: true } },
      },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
      _sum: { total: true, amountPaid: true },
      _count: true,
    }),
  ]);

  return {
    rows: rows.map((r) => ({
      ...r,
      owingUsd: toNumber(r.total) - toNumber(r.amountPaid),
    })),
    owingUsd: toNumber(totals._sum.total) - toNumber(totals._sum.amountPaid),
    count: totals._count,
  };
}

/**
 * The register, split into days.
 *
 * A flat list of four hundred payments is a list nobody reads; the same list
 * under "24 Sep · 35 payments · USD 4,210" is a register somebody can check
 * against a bank statement. Grouped here rather than in the page so the day
 * total is computed from the same rows that are printed under it.
 */
export function groupByDay<T extends { paidAt: Date; creditedAmount: unknown }>(
  payments: T[]
) {
  const days = new Map<string, { date: Date; rows: T[]; usd: number }>();

  for (const p of payments) {
    const key = p.paidAt.toISOString().slice(0, 10);
    const day = days.get(key) ?? {
      date: new Date(`${key}T00:00:00`),
      rows: [] as T[],
      usd: 0,
    };
    day.rows.push(p);
    day.usd += toNumber(p.creditedAmount as never);
    days.set(key, day);
  }

  return [...days.values()];
}
