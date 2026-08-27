import type { Metadata } from "next";
import Link from "next/link";
import { HandCoins, Paperclip } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { FinanceNav } from "@/components/app/finance-nav";
import { PageHeader } from "@/components/app/page-header";
import { SupplierPaymentForm } from "@/components/app/supplier-payment-form";
import { Badge } from "@/components/ui/badge";
import { activeAccounts } from "@/lib/accounts";
import { supplierPaymentRegister } from "@/lib/exchange";
import { financeTabs } from "@/lib/finance-tabs";
import { formatDate, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { t } from "@/lib/i18n";
import { can } from "@/lib/rbac";
import { requirePermission } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";

export const metadata: Metadata = { title: "Supplier payments" };

const TONE: Record<string, "success" | "warning" | "destructive" | "muted"> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "destructive",
  REFUNDED: "muted",
  CANCELLED: "muted",
};

/**
 * Money AITRANSIT has paid suppliers in China on customers' behalf.
 *
 * The register, not the queue — a row exists here only once somebody decided to
 * pay, so this is a truthful answer to "what have we paid out for customers".
 * The asking lives at /app/finance/exchange.
 *
 * The USD column is the one that can be totalled. A month's payouts arrive in
 * RMB, dollars and kwacha, and `amountUsd` is frozen at the rate used — the
 * same discipline LedgerEntry follows. Rows recorded without a rate show a dash
 * rather than a converted guess, and the total says how many it is missing.
 */
export default async function SupplierPaymentsPage() {
  const user = await requirePermission("accounting.view");
  const locale = await viewerLocale();

  const [payments, accounts] = await Promise.all([
    supplierPaymentRegister(),
    activeAccounts(),
  ]);

  const valued = payments.filter((p) => p.amountUsd !== null);
  const totalUsd = valued.reduce((sum, p) => sum + toNumber(p.amountUsd!), 0);
  const unvalued = payments.length - valued.length;

  return (
    <>
      <FinanceNav tabs={financeTabs(user.role)} />

      <PageHeader
        title={t(locale, "Supplier payments")}
        description={t(
          locale,
          "Money paid to suppliers in China for our customers. Every row names the account it left."
        )}
        actions={
          <Link
            href="/app/finance/exchange"
            className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium hover:bg-muted"
          >
            {t(locale, "Money desk")}
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t(locale, "Paid out, valued")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular">
            {formatUsd(totalUsd)}
          </p>
          {unvalued > 0 ? (
            <p className="mt-1 text-xs text-warning">
              {unvalued}{" "}
              {t(
                locale,
                unvalued === 1
                  ? "payment has no rate and is not in this total"
                  : "payments have no rate and are not in this total"
              )}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t(locale, "Payments recorded")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular">
            {payments.length}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {t(locale, "Still pending")}
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular">
            {payments.filter((p) => p.status === "PENDING").length}
          </p>
        </div>
      </div>

      {can(user.role, "payment.record") ? (
        <div className="mb-6">
          <SupplierPaymentForm accounts={accounts} />
        </div>
      ) : null}

      {payments.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={t(locale, "Nothing recorded yet")}
          description={t(
            locale,
            "Supplier payments arranged for customers are recorded here, with the account the money left and the proof."
          )}
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex flex-wrap items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="font-mono text-sm">{payment.reference}</p>
                <p className="font-medium">
                  {payment.supplierName}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {payment.currency}{" "}
                    {toNumber(payment.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    {payment.amountUsd !== null
                      ? ` · ${formatUsd(toNumber(payment.amountUsd))}`
                      : " · no rate"}
                  </span>
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  <Link
                    href={`/app/customers/${payment.customer.id}`}
                    className="hover:underline"
                  >
                    {payment.customer.name} ({payment.customer.code})
                  </Link>
                  {payment.account ? ` · ${payment.account.name}` : ""}
                  {payment.shipment
                    ? ` · cargo ${payment.shipment.trackingNumber}`
                    : ""}
                  {payment.handledBy ? ` · ${payment.handledBy.name}` : ""}
                </p>
                {payment.proofUrl ? (
                  <a
                    href={payment.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-signal hover:underline"
                  >
                    <Paperclip className="h-3 w-3" />
                    {payment.proofName ?? t(locale, "Proof")}
                  </a>
                ) : null}
              </div>
              <div className="text-right">
                <Badge variant={TONE[payment.status] ?? "muted"}>
                  {payment.status.toLowerCase()}
                </Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(payment.paidAt ?? payment.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
