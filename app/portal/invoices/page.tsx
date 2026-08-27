import type { Metadata } from "next";

import { PaymentProofForm } from "@/components/portal/payment-proof-form";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatDate, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { portalOverview, requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "My invoices" };

const STATUS_TONE = {
  UNPAID: "warning",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  VOID: "muted",
  WRITTEN_OFF: "muted",
  DRAFT: "muted",
} as const;

const STATUS_LABEL: Record<string, string> = {
  UNPAID: "Awaiting payment",
  PARTIALLY_PAID: "Part paid",
  PAID: "Paid",
  VOID: "Cancelled",
  WRITTEN_OFF: "Written off",
};

const CREDIT_LABEL: Record<string, string> = {
  REQUESTED: "Credit requested",
  APPROVED: "Credit approved",
  REJECTED: "Credit refused",
};

/**
 * What the customer owes, and what they have paid.
 *
 * Drafts are excluded by the query in lib/portal.ts, not filtered here — a
 * draft is a figure Finance has not signed off, nobody owes it, and it must
 * never reach a customer even as a greyed-out row.
 */
export default async function PortalInvoicesPage() {
  const viewer = await requireCustomer();
  const { invoices, customer } = await portalOverview(viewer.customerId);

  const outstanding = invoices.reduce((sum, invoice) => {
    if (["PAID", "VOID", "WRITTEN_OFF"].includes(invoice.status)) return sum;
    return sum + (toNumber(invoice.total) - toNumber(invoice.amountPaid));
  }, 0);

  const creditLimit =
    customer?.creditLimitUsd === null || customer?.creditLimitUsd === undefined
      ? null
      : toNumber(customer.creditLimitUsd);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Invoices
          </h1>
          <p className="mt-1 text-muted-foreground">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on your
            account.
          </p>
        </div>
        <div className="rounded-xl border bg-card px-5 py-3 text-right">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Outstanding
          </p>
          <p className="font-display text-2xl font-bold tabular">
            {formatUsd(outstanding)}
          </p>
        </div>
      </div>

      {creditLimit !== null ? (
        <section className="rounded-xl border border-brand/30 bg-brand/5 p-5 text-sm">
          <h2 className="font-display text-base font-semibold">
            Your credit facility
          </h2>
          <p className="mt-1 text-muted-foreground">
            Approved limit {formatUsd(creditLimit)}
            {customer?.creditTermDays
              ? `, ${customer.creditTermDays} day terms`
              : ""}
            {customer?.creditApprovedAt
              ? `, agreed ${formatDate(customer.creditApprovedAt)}`
              : ""}
            . Cargo released on credit still has to be settled — the balance
            above includes it.
          </p>
        </section>
      ) : null}

      {invoices.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
          Nothing billed yet. An invoice is raised once your cargo has been
          checked in and weighed at our Lusaka warehouse.
        </p>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => {
            const total = toNumber(invoice.total);
            const paid = toNumber(invoice.amountPaid);
            const balance = total - paid;
            const settled = ["PAID", "VOID", "WRITTEN_OFF"].includes(
              invoice.status
            );

            return (
              <article
                key={invoice.id}
                className="rounded-xl border bg-card p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-lg font-semibold">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cargo{" "}
                      <span className="font-mono">
                        {invoice.shipment.trackingNumber}
                      </span>{" "}
                      · issued {formatDate(invoice.issuedAt)}
                      {invoice.dueDate
                        ? ` · due ${formatDate(invoice.dueDate)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {invoice.creditStatus !== "NONE" &&
                    CREDIT_LABEL[invoice.creditStatus] ? (
                      <Badge variant="info">
                        {CREDIT_LABEL[invoice.creditStatus]}
                      </Badge>
                    ) : null}
                    <Badge
                      variant={
                        STATUS_TONE[invoice.status as keyof typeof STATUS_TONE] ??
                        "muted"
                      }
                    >
                      {STATUS_LABEL[invoice.status] ?? invoice.status}
                    </Badge>
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Total
                    </dt>
                    <dd className="mt-1 font-medium tabular">
                      {formatUsd(total)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Paid
                    </dt>
                    <dd className="mt-1 font-medium tabular">{formatUsd(paid)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Balance
                    </dt>
                    <dd
                      className={`mt-1 font-medium tabular ${balance > 0 ? "text-warning" : "text-success"}`}
                    >
                      {formatUsd(Math.max(0, balance))}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Storage
                    </dt>
                    <dd className="mt-1 font-medium tabular">
                      {invoice.storageDays} day
                      {invoice.storageDays === 1 ? "" : "s"} ·{" "}
                      {formatUsd(toNumber(invoice.storageCharge))}
                    </dd>
                  </div>
                </dl>

                {!settled && balance > 0 ? (
                  <>
                    <details className="mt-4 rounded-lg border bg-muted/30 p-4 text-sm">
                      <summary className="cursor-pointer font-medium">
                        Where to pay
                      </summary>
                      <ul className="mt-3 space-y-2">
                        {PAYMENT_METHODS.map((account) => (
                          <li key={account.label}>
                            <span className="block text-xs uppercase tracking-widest text-muted-foreground">
                              {account.label}
                            </span>
                            <span className="font-mono">{account.number}</span>
                            <span className="block text-xs text-muted-foreground">
                              {account.accountName}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Always check these against the accounts printed on your
                        invoice, and ring us if they differ.
                      </p>
                    </details>

                    <PaymentProofForm
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.invoiceNumber}
                    />
                  </>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
