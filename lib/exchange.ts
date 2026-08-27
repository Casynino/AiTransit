import "server-only";

import { cache } from "react";
import type { ExchangeRequestStatus, ExchangeRequestType } from "@prisma/client";

import { toNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

/**
 * The money desk, read side.
 *
 * AITRANSIT sells two things: freight, and currency. This module is the second
 * one — the published board a customer reads on the website, and the queues the
 * finance desk works from.
 *
 * The single rule everything here observes: a published rate is an INDICATION
 * and a customer request is an ASK. Neither is a transaction. Money only ever
 * moves through the ledger machinery in lib/ledger.ts, against a real account,
 * on a staff action — so nothing in this file returns anything that could be
 * mistaken for a completed transfer.
 */

export const EXCHANGE_TYPE_LABELS: Record<ExchangeRequestType, string> = {
  MONEY_EXCHANGE: "Money exchange booking",
  EXCHANGE_QUOTE: "Exchange quotation",
  SUPPLIER_PAYMENT: "China supplier payment",
  SEND_MONEY_CHINA: "Send money to China",
};

export const EXCHANGE_STATUS_LABELS: Record<ExchangeRequestStatus, string> = {
  NEW: "New",
  UNDER_REVIEW: "Under review",
  QUOTED: "Quoted",
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const EXCHANGE_STATUS_TONE: Record<
  ExchangeRequestStatus,
  "muted" | "info" | "warning" | "success" | "brand" | "destructive"
> = {
  NEW: "warning",
  UNDER_REVIEW: "info",
  QUOTED: "info",
  AWAITING_PAYMENT: "warning",
  CONFIRMED: "brand",
  COMPLETED: "success",
  REJECTED: "destructive",
  CANCELLED: "muted",
};

/**
 * Requests nobody has finished with.
 *
 * Shared as the FILTER rather than as a count, the same way PENDING_SUBMISSION
 * is in lib/constants.ts — the dashboard tile, the sidebar badge and the queue
 * page all ask this question, and redefining "open" must move all three at once
 * or none.
 */
export const EXCHANGE_OPEN_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "QUOTED",
  "AWAITING_PAYMENT",
  "CONFIRMED",
] as const satisfies readonly ExchangeRequestStatus[];

/** Finished, one way or the other. Never re-opened. */
export const EXCHANGE_TERMINAL_STATUSES = [
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const satisfies readonly ExchangeRequestStatus[];

export type FxBoardRow = {
  id: string;
  base: string;
  quote: string;
  /** Pre-formatted, because a rate is read and not calculated with here. */
  buy: string;
  sell: string;
  buyValue: number | null;
  sellValue: number | null;
  note: string | null;
};

/**
 * A rate as it is written on a board: grouped thousands, and only as many
 * decimals as the figure needs.
 *
 * ZMW per USD is quoted to two places (27.45). CNY per ZMW is a fraction and
 * needs four (0.2637). Fixing on one precision would print either a misleading
 * 0.26 or an absurd 27.4500.
 */
function formatRate(value: number | null): string {
  if (value === null) return "—";
  const decimals = value >= 100 ? 2 : value >= 1 ? 2 : 4;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * The published board, for the public site.
 *
 * Deduplicated per request: the home page shows it and so does the exchange
 * page's calculator, and on a page that renders both this would otherwise be
 * the same query twice.
 */
export const publishedFxBoard = cache(async (): Promise<FxBoardRow[]> => {
  const rows = await prisma.publishedFxRate.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { baseCurrency: "asc" }],
  });

  return rows.map((row) => {
    const buy = row.buyRate === null ? null : toNumber(row.buyRate);
    const sell = row.sellRate === null ? null : toNumber(row.sellRate);
    return {
      id: row.id,
      base: row.baseCurrency,
      quote: row.quoteCurrency,
      buy: formatRate(buy),
      sell: formatRate(sell),
      buyValue: buy,
      sellValue: sell,
      note: row.note,
    };
  });
});

/** Every pair including the withdrawn ones, for the admin screen. */
export async function fxRateBook() {
  return prisma.publishedFxRate.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { baseCurrency: "asc" }],
    include: { setBy: { select: { name: true } } },
  });
}

/**
 * The money desk's inbox.
 *
 * Open requests first and oldest first inside that, because the thing that
 * makes a customer ring is a request nobody has touched — not the newest one.
 */
export async function exchangeQueue(options?: {
  status?: ExchangeRequestStatus | "OPEN";
  type?: ExchangeRequestType;
  take?: number;
}) {
  const status = options?.status;
  return prisma.exchangeRequest.findMany({
    where: {
      ...(status === "OPEN"
        ? { status: { in: [...EXCHANGE_OPEN_STATUSES] } }
        : status
          ? { status }
          : {}),
      ...(options?.type ? { type: options.type } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: options?.take ?? 200,
    include: {
      customer: { select: { id: true, code: true, name: true, phone: true } },
      reviewedBy: { select: { name: true } },
      account: { select: { code: true, name: true, currency: true } },
      shipment: { select: { id: true, trackingNumber: true } },
    },
  });
}

export async function exchangeRequestById(id: string) {
  return prisma.exchangeRequest.findUnique({
    where: { id },
    include: {
      customer: true,
      reviewedBy: { select: { name: true } },
      account: { select: { id: true, code: true, name: true, currency: true } },
      shipment: { select: { id: true, trackingNumber: true } },
      supplierPayment: true,
    },
  });
}

/** How many are sitting on the desk, for the sidebar badge and the dashboard. */
export async function openExchangeCount() {
  return prisma.exchangeRequest.count({
    where: { status: { in: [...EXCHANGE_OPEN_STATUSES] } },
  });
}

/** Supplier payments, newest first. The register the desk reconciles against. */
export async function supplierPaymentRegister(take = 200) {
  return prisma.supplierPayment.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      customer: { select: { id: true, code: true, name: true, phone: true } },
      handledBy: { select: { name: true } },
      account: { select: { code: true, name: true, currency: true } },
      shipment: { select: { id: true, trackingNumber: true } },
      request: { select: { id: true, reference: true } },
    },
  });
}

/**
 * One customer's own money-desk history, for the portal.
 *
 * Takes the customer id rather than reading the session, so the only way to
 * call it is to have already resolved whose portal this is — the portal's own
 * guard does that once, in lib/portal.ts.
 */
export async function customerExchangeHistory(customerId: string) {
  const [requests, payments] = await Promise.all([
    prisma.exchangeRequest.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.supplierPayment.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { shipment: { select: { trackingNumber: true } } },
    }),
  ]);
  return { requests, payments };
}
