import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, Package } from "lucide-react";

import { PaymentProofForm } from "@/components/portal/payment-proof-form";
import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import { accountsForInvoice } from "@/lib/company-settings";
import { formatPackages } from "@/lib/constants";
import { formatDate, formatDateTime, formatWeight, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { ownedInvoice } from "@/lib/portal-data";
import {
  CREDIT_LABEL,
  INVOICE_LABEL,
  labelFor,
  SUBMISSION_LABEL,
} from "@/lib/portal-labels";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Invoice — AITRANSIT" };

/**
 * One invoice, its working, and how to pay it.
 *
 * THE KWACHA FIGURE COMES FROM THE INVOICE, NOT FROM TODAY'S RATE. Every
 * confirmed invoice froze `exchangeRate` and `totalLocal` at the moment Finance
 * confirmed it, and this page shows those. Converting at today's rate would
 * quote the customer a different number every morning for a bill that has not
 * changed — and when no rate was frozen, the page says so instead of inventing
 * one. That is the rule the owner set: never present a computed figure as an
 * official one.
 *
 * THE ACCOUNTS COME FROM THE SNAPSHOT the invoice was issued with, not from
 * today's settings — an old invoice must keep printing the account numbers the
 * customer was actually given.
 */
export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const invoice = await ownedInvoice(viewer.customerId, id);

  /*
    The payment accounts, read separately because ownedInvoice deliberately does
    not select paymentSnapshot — it is a Json blob and the list query has no use
    for it. Still narrowed by the customer, belt and braces.
  */
  const snapshot = await prisma.invoice.findFirst({
    where: { id: invoice.id, customerId: viewer.customerId },
    select: { paymentSnapshot: true },
  });
  const accounts = accountsForInvoice(snapshot?.paymentSnapshot);

  const total = toNumber(invoice.total);
  const paid = toNumber(invoice.amountPaid);
  const owed = Math.max(0, total - paid);
  const meta = labelFor(INVOICE_LABEL, invoice.status);
  const freight =
    invoice.freightOverride === null
      ? toNumber(invoice.freightCost)
      : toNumber(invoice.freightOverride);

  const pendingSubmission = invoice.submissions.find((s) => s.status === "PENDING");
  const settled = owed <= 0.005;
  const onCredit = invoice.creditStatus === "APPROVED";

  return (
    <div>
      <Link
        href="/portal/invoices"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All invoices
      </Link>

      <PageHead
        title={invoice.invoiceNumber}
        lede={`For ${invoice.shipment.trackingNumber} — ${invoice.shipment.description}`}
        action={
          <a
            href={`/portal/invoices/${invoice.id}/pdf`}
            className="ai-btn ai-btn-outline"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </a>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Pill tone={meta.tone}>{meta.label}</Pill>
        {invoice.creditStatus !== "NONE" ? (
          <Pill tone={labelFor(CREDIT_LABEL, invoice.creditStatus).tone}>
            {labelFor(CREDIT_LABEL, invoice.creditStatus).label}
          </Pill>
        ) : null}
        {pendingSubmission ? <Pill tone="amber">Proof with Finance</Pill> : null}
      </div>

      {pendingSubmission ? (
        <Note tone="amber" title="We have your payment proof">
          Submitted {formatDateTime(pendingSubmission.submittedAt)} as{" "}
          <span className="ai-num">{pendingSubmission.submissionNumber}</span>.
          Finance checks every payment against the account it landed in before
          this balance changes. You do not need to send it again.
        </Note>
      ) : null}

      {onCredit && !settled ? (
        <Note tone="emerald" title="Approved on credit">
          You may collect this cargo now and pay by{" "}
          {invoice.dueDate ? formatDate(invoice.dueDate) : "the agreed date"}
          {invoice.creditTermDays ? ` (${invoice.creditTermDays}-day terms)` : ""}.
        </Note>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* ───────────────────────────────────────────────────── the working */}
          <Panel title="What you are being charged">
            <dl className="space-y-0">
              <Line label="Freight" value={freight} currency={invoice.currency} />
              {toNumber(invoice.storageCharge) > 0 ? (
                <Line
                  label={`Storage (${invoice.storageDays} day${invoice.storageDays === 1 ? "" : "s"})`}
                  value={toNumber(invoice.storageCharge)}
                  currency={invoice.currency}
                />
              ) : null}
              {toNumber(invoice.storageWaivedUsd) > 0 ? (
                <Line
                  label="Storage waived"
                  value={-toNumber(invoice.storageWaivedUsd)}
                  currency={invoice.currency}
                  tone="emerald"
                />
              ) : null}
              {toNumber(invoice.otherCharges) > 0 ? (
                <Line
                  label="Other charges"
                  value={toNumber(invoice.otherCharges)}
                  currency={invoice.currency}
                />
              ) : null}
              {toNumber(invoice.discount) > 0 ? (
                <Line
                  label="Discount"
                  value={-toNumber(invoice.discount)}
                  currency={invoice.currency}
                  tone="emerald"
                />
              ) : null}

              <div
                className="mt-2 flex items-center justify-between border-t pt-3"
                style={{ borderColor: "hsl(var(--ai-stone-3))" }}
              >
                <dt className="font-bold">Total</dt>
                <dd className="ai-num text-lg font-bold">
                  {invoice.currency} {total.toFixed(2)}
                </dd>
              </div>

              <Line label="Paid" value={paid} currency={invoice.currency} tone="emerald" />

              <div
                className="mt-2 flex items-center justify-between border-t pt-3"
                style={{ borderColor: "hsl(var(--ai-stone-3))" }}
              >
                <dt className="font-bold">Outstanding</dt>
                <dd
                  className="ai-num text-lg font-bold"
                  style={{
                    color: owed > 0.005
                      ? "hsl(var(--ai-copper))"
                      : "hsl(var(--ai-emerald))",
                  }}
                >
                  {owed > 0.005 ? `${invoice.currency} ${owed.toFixed(2)}` : "Nothing"}
                </dd>
              </div>
            </dl>

            {/*
              THE KWACHA LINE, ONLY WHEN THE INVOICE CARRIES ONE.
              Frozen at confirmation. No rate on the invoice means no kwacha
              figure here — not a figure computed from today's board, which
              would be a number nobody at AITRANSIT has agreed to.
            */}
            {invoice.totalLocal !== null && invoice.exchangeRate !== null ? (
              <div
                className="mt-4 rounded-[var(--ai-radius)] px-4 py-3 text-sm"
                style={{ background: "hsl(var(--ai-stone-2))" }}
              >
                <p className="font-semibold">
                  {invoice.localCurrency}{" "}
                  {toNumber(invoice.totalLocal).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                <p className="ai-muted mt-0.5 text-xs">
                  At the rate on this invoice — 1 USD ={" "}
                  {toNumber(invoice.exchangeRate).toLocaleString()}{" "}
                  {invoice.localCurrency}. This is the rate it was issued at and it
                  does not change.
                </p>
              </div>
            ) : (
              <p className="ai-muted mt-4 text-xs">
                This invoice is in {invoice.currency}. Ask Finance for the kwacha
                figure on the day you pay.
              </p>
            )}
          </Panel>

          {/* ───────────────────────────────────────────────────── how to pay */}
          {!settled ? (
            <Panel title="How to pay">
              <p className="ai-muted mb-4 text-sm">
                Pay into one of the accounts below, then send us the proof. These
                are the accounts this invoice was issued with.
              </p>
              <ul className="space-y-3">
                {accounts.map((account) => (
                  <li
                    key={`${account.label}-${account.number}`}
                    className="rounded-[var(--ai-radius)] border px-4 py-3"
                    style={{ borderColor: "hsl(var(--ai-stone-3))" }}
                  >
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em]">
                      {account.label}
                    </p>
                    <p className="ai-num mt-1 text-sm font-semibold">
                      {account.number}
                    </p>
                    <p className="ai-muted text-xs">{account.accountName}</p>
                  </li>
                ))}
              </ul>

              <PaymentProofForm
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoiceNumber}
              />

              <p className="ai-muted mt-4 text-xs">
                Only our finance desk can confirm a payment. Sending proof puts it
                in their queue — the balance above changes when they have matched
                it to the account.
              </p>
            </Panel>
          ) : null}

          {/* ───────────────────────────────────────────── payments and proofs */}
          {invoice.payments.length > 0 ? (
            <Panel title="Payments received">
              <ul className="divide-y" style={{ borderColor: "hsl(var(--ai-stone-3))" }}>
                {invoice.payments.map((payment) => (
                  <li key={payment.id} className="flex items-start justify-between py-3">
                    <div>
                      <p className="ai-num font-semibold">
                        {payment.currency} {toNumber(payment.amount).toFixed(2)}
                      </p>
                      <p className="ai-muted text-xs">
                        {payment.method.replace(/_/g, " ").toLowerCase()}
                        {payment.reference ? ` · ${payment.reference}` : ""}
                      </p>
                    </div>
                    <p className="ai-num text-xs" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                      {formatDate(payment.paidAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {invoice.submissions.length > 0 ? (
            <Panel title="Proof you have sent">
              <ul className="divide-y" style={{ borderColor: "hsl(var(--ai-stone-3))" }}>
                {invoice.submissions.map((sub) => {
                  const subMeta = labelFor(SUBMISSION_LABEL, sub.status);
                  return (
                    <li key={sub.id} className="py-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="ai-num font-semibold">
                            {sub.submissionNumber} — {sub.currency}{" "}
                            {toNumber(sub.amount).toFixed(2)}
                          </p>
                          <p className="ai-muted text-xs">
                            Sent {formatDateTime(sub.submittedAt)}
                            {sub.reference ? ` · ref ${sub.reference}` : ""}
                          </p>
                        </div>
                        <Pill tone={subMeta.tone}>{subMeta.label}</Pill>
                      </div>
                      {subMeta.hint ? (
                        <p className="ai-muted mt-1 text-xs">{subMeta.hint}</p>
                      ) : null}
                      {sub.status === "REJECTED" && sub.rejectionReason ? (
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "hsl(348 70% 42%)" }}
                        >
                          {sub.rejectionReason}
                        </p>
                      ) : null}
                      {sub.proofs.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sub.proofs.map((proof) => (
                            <a
                              key={proof.id}
                              href={proof.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold underline"
                            >
                              {proof.filename ?? "View proof"}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}
        </div>

        {/* ─────────────────────────────────────────────────────── the cargo */}
        <div className="space-y-6">
          <Panel title="The cargo">
            <dl className="space-y-3">
              <Field label="Tracking number">
                <Link
                  href={`/portal/cargo/${invoice.shipment.id}`}
                  className="ai-num underline underline-offset-2"
                >
                  {invoice.shipment.trackingNumber}
                </Link>
              </Field>
              <Field label="Description">{invoice.shipment.description}</Field>
              <Field label="Category">
                {invoice.shipment.cargoType?.name ?? "—"}
              </Field>
              <Field label="Pieces">
                {formatPackages(
                  invoice.shipment.packages,
                  invoice.shipment.packageType
                )}
              </Field>
              <Field label="Weight">
                {formatWeight(toNumber(invoice.shipment.weightKg))}
              </Field>
              {invoice.shipment.chargeableKg ? (
                <Field label="Billable weight">
                  {formatWeight(toNumber(invoice.shipment.chargeableKg))}
                </Field>
              ) : null}
            </dl>
            <Link
              href={`/portal/cargo/${invoice.shipment.id}`}
              className="ai-btn ai-btn-outline mt-4 w-full"
            >
              <Package className="h-4 w-4" />
              Open the cargo
            </Link>
          </Panel>

          <Panel title="Dates">
            <dl className="space-y-3">
              <Field label="Issued">{formatDate(invoice.issuedAt)}</Field>
              <Field label="Confirmed by Finance">
                {invoice.confirmedAt ? formatDate(invoice.confirmedAt) : "—"}
              </Field>
              <Field label="Due">
                {invoice.dueDate ? formatDate(invoice.dueDate) : "On collection"}
              </Field>
            </dl>
          </Panel>

          {invoice.notes ? (
            <Panel title="Note from Finance">
              <p className="whitespace-pre-wrap text-sm">{invoice.notes}</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone?: "emerald";
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <dt className="text-sm" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
        {label}
      </dt>
      <dd
        className="ai-num text-sm font-medium"
        style={tone === "emerald" ? { color: "hsl(var(--ai-emerald))" } : undefined}
      >
        {value < 0 ? "−" : ""}
        {currency} {Math.abs(value).toFixed(2)}
      </dd>
    </div>
  );
}
