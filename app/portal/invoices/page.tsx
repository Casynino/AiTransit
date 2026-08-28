import type { Metadata } from "next";
import Link from "next/link";
import { Receipt } from "lucide-react";

import { Empty, Metric, Note, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { formatDate, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { requireCustomer } from "@/lib/portal";
import { listInvoices } from "@/lib/portal-data";
import { CREDIT_LABEL, INVOICE_LABEL, labelFor } from "@/lib/portal-labels";
import { AlertTriangle, CheckCircle2, Wallet } from "lucide-react";

export const metadata: Metadata = { title: "Invoices — AITRANSIT" };

/**
 * What the customer owes, and what they have paid.
 *
 * DRAFTS ARE NOT HERE. listInvoices excludes them; a draft is Finance's working
 * figure and nobody owes it. That is why a customer can have cargo checked in
 * at Lusaka with no invoice on this page — the cargo detail page says so in
 * those words rather than leaving a gap.
 *
 * The status filter is a set of links rather than a dropdown. There are four
 * states worth filtering to and links are one tap on a phone.
 */
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireCustomer();
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "ALL";
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const invoices = await listInvoices(viewer.customerId, { status, q });
  const all = await listInvoices(viewer.customerId, {});

  const outstanding = all.reduce((sum, i) => {
    if (["PAID", "VOID", "WRITTEN_OFF"].includes(i.status)) return sum;
    return sum + (toNumber(i.total) - toNumber(i.amountPaid));
  }, 0);
  const paidTotal = all.reduce((sum, i) => sum + toNumber(i.amountPaid), 0);
  const overdue = all.filter(
    (i) =>
      !["PAID", "VOID", "WRITTEN_OFF"].includes(i.status) &&
      i.dueDate &&
      i.dueDate < new Date()
  );
  const awaiting = all.filter((i) => i.submissions.length > 0);

  const TABS: [string, string][] = [
    ["ALL", "Everything"],
    ["UNPAID", "Unpaid"],
    ["PARTIALLY_PAID", "Part paid"],
    ["PAID", "Paid"],
  ];

  return (
    <div>
      <PageHead
        title="Invoices & payments"
        lede="Every invoice we have raised for you, what is still owing, and how to pay it."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Metric
          icon={Receipt}
          label="Outstanding"
          value={formatUsd(outstanding)}
          hint={`${all.filter((i) => !["PAID", "VOID", "WRITTEN_OFF"].includes(i.status)).length} unpaid`}
          tone={outstanding > 0 ? "copper" : undefined}
        />
        <Metric
          icon={AlertTriangle}
          label="Overdue"
          value={String(overdue.length)}
          hint={overdue.length ? "Please settle these first" : "Nothing overdue"}
          tone={overdue.length ? "amber" : undefined}
        />
        <Metric
          icon={CheckCircle2}
          label="Paid to date"
          value={formatUsd(paidTotal)}
          hint="Confirmed by Finance"
        />
        <Metric
          icon={Wallet}
          label="With Finance"
          value={String(awaiting.length)}
          hint={
            awaiting.length
              ? "Proof sent, being checked"
              : "No payments waiting to be checked"
          }
        />
      </div>

      {awaiting.length > 0 ? (
        <Note tone="amber" title="Payments being checked">
          You have sent proof for {awaiting.map((i) => i.invoiceNumber).join(", ")}.
          Finance matches every payment against the account it landed in before
          the balance changes — nothing here moves until they do.
        </Note>
      ) : null}

      <div className="my-6 flex flex-wrap gap-2">
        {TABS.map(([value, label]) => {
          const active = status === value;
          return (
            <Link
              key={value}
              href={value === "ALL" ? "/portal/invoices" : `/portal/invoices?status=${value}`}
              className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              style={
                active
                  ? {
                      background: "hsl(var(--ai-emerald))",
                      borderColor: "hsl(var(--ai-emerald))",
                      color: "white",
                    }
                  : {
                      borderColor: "hsl(var(--ai-stone-3))",
                      background: "hsl(var(--ai-white))",
                    }
              }
            >
              {label}
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <Empty
          icon={Receipt}
          title={status === "ALL" ? "No invoices yet" : "Nothing in this list"}
          body={
            status === "ALL"
              ? "Finance raises an invoice once your cargo has been weighed at Lusaka. Nothing is owed until then."
              : "Try another filter."
          }
          action={
            status !== "ALL" ? (
              <Link href="/portal/invoices" className="ai-btn ai-btn-outline">
                Show everything
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const owed = toNumber(invoice.total) - toNumber(invoice.amountPaid);
            const meta = labelFor(INVOICE_LABEL, invoice.status);
            const isOverdue =
              !["PAID", "VOID", "WRITTEN_OFF"].includes(invoice.status) &&
              invoice.dueDate &&
              invoice.dueDate < new Date();

            return (
              <RecordRow
                key={invoice.id}
                href={`/portal/invoices/${invoice.id}`}
                title={<span className="ai-num">{invoice.invoiceNumber}</span>}
                subtitle={
                  <>
                    {invoice.shipment?.trackingNumber} —{" "}
                    {invoice.shipment?.description}
                  </>
                }
                right={
                  <div className="flex flex-col items-end gap-1.5">
                    <Pill tone={meta.tone}>{meta.label}</Pill>
                    {isOverdue ? <Pill tone="rose">Overdue</Pill> : null}
                    {invoice.creditStatus !== "NONE" ? (
                      <Pill tone={labelFor(CREDIT_LABEL, invoice.creditStatus).tone}>
                        {labelFor(CREDIT_LABEL, invoice.creditStatus).label}
                      </Pill>
                    ) : null}
                    {invoice.submissions.length > 0 ? (
                      <Pill tone="amber">Proof sent</Pill>
                    ) : null}
                  </div>
                }
                facts={[
                  {
                    label: "Total",
                    value: `${invoice.currency} ${toNumber(invoice.total).toFixed(2)}`,
                  },
                  {
                    label: "Paid",
                    value: `${invoice.currency} ${toNumber(invoice.amountPaid).toFixed(2)}`,
                  },
                  {
                    label: "Outstanding",
                    value:
                      owed > 0.005 ? (
                        <span style={{ color: "hsl(var(--ai-copper))" }}>
                          {invoice.currency} {owed.toFixed(2)}
                        </span>
                      ) : (
                        "Nothing"
                      ),
                  },
                  ...(toNumber(invoice.storageCharge) > 0
                    ? [
                        {
                          label: "Storage",
                          value: `${invoice.currency} ${toNumber(invoice.storageCharge).toFixed(2)} (${invoice.storageDays}d)`,
                        },
                      ]
                    : []),
                  { label: "Issued", value: formatDate(invoice.issuedAt) },
                  {
                    label: "Due",
                    value: invoice.dueDate ? formatDate(invoice.dueDate) : "On collection",
                  },
                ]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
