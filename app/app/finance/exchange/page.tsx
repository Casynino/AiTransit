import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Inbox } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { FinanceNav } from "@/components/app/finance-nav";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import {
  EXCHANGE_OPEN_STATUSES,
  EXCHANGE_STATUS_LABELS,
  EXCHANGE_STATUS_TONE,
  EXCHANGE_TYPE_LABELS,
  exchangeQueue,
} from "@/lib/exchange";
import { financeTabs } from "@/lib/finance-tabs";
import { formatDate, formatRelative, toNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { requirePermission } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";

export const metadata: Metadata = { title: "Money desk" };

/**
 * The money desk's inbox: currency bookings, quotations and China payments.
 *
 * Ordered open-first and oldest-first inside that, because the request that
 * makes a customer ring is the one nobody has touched — not the newest one. The
 * same ordering the collections follow-up list uses, for the same reason.
 *
 * Guarded on `fx.manage`, which is the permission that already governs what a
 * currency is worth here. Reading the queue and moving a request along are the
 * same desk's job; only marking one COMPLETE needs the separate authority to say
 * money moved, and that is checked on the request itself.
 */
export default async function ExchangeQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission("fx.manage");
  const params = await searchParams;
  const locale = await viewerLocale();
  const user = await requirePermission("fx.manage");

  const showAll = params.status === "all";
  const requests = await exchangeQueue({ status: showAll ? undefined : "OPEN" });

  const open = requests.filter((request) =>
    (EXCHANGE_OPEN_STATUSES as readonly string[]).includes(request.status)
  ).length;

  return (
    <>
      <FinanceNav tabs={financeTabs(user.role)} />

      <PageHeader
        title={t(locale, "Money desk")}
        description={t(
          locale,
          "Currency bookings, quotations and payments to suppliers in China. A request is an ask — nothing here has moved money until somebody records that it has."
        )}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/app/finance/exchange"
          aria-current={showAll ? undefined : "page"}
          className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${
            showAll ? "bg-card" : "border-brand bg-brand text-brand-foreground"
          }`}
        >
          {t(locale, "Open")} ({open})
        </Link>
        <Link
          href="/app/finance/exchange?status=all"
          aria-current={showAll ? "page" : undefined}
          className={`inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium ${
            showAll ? "border-brand bg-brand text-brand-foreground" : "bg-card"
          }`}
        >
          {t(locale, "Everything")}
        </Link>
        <Link
          href="/app/finance/supplier-payments"
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium hover:bg-muted"
        >
          <Coins className="h-4 w-4" />
          {t(locale, "Supplier payments")}
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t(locale, "Nothing waiting")}
          description={t(
            locale,
            "Requests submitted from the website's money exchange page land here."
          )}
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {requests.map((request) => (
            <li key={request.id}>
              <Link
                href={`/app/finance/exchange/${request.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm">{request.reference}</p>
                  <p className="font-medium">
                    {t(locale, EXCHANGE_TYPE_LABELS[request.type])}
                    {" — "}
                    {request.fromCurrency}{" "}
                    {toNumber(request.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    → {request.toCurrency}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {request.customer
                      ? `${request.customer.name} (${request.customer.code})`
                      : request.contactName}{" "}
                    · {request.contactPhone}
                    {request.recipientName ? ` · to ${request.recipientName}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={EXCHANGE_STATUS_TONE[request.status]}>
                    {t(locale, EXCHANGE_STATUS_LABELS[request.status])}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatRelative(request.createdAt)} ·{" "}
                    {formatDate(request.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
