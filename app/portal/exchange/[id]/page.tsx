import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";

import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import { formatDate, formatDateTime, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { ownedExchange } from "@/lib/portal-data";
import {
  EXCHANGE_LABEL,
  EXCHANGE_TYPE,
  labelFor,
  SUPPLIER_PAYMENT_LABEL,
} from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Exchange request — AITRANSIT" };

/**
 * One money-desk request, and what the desk decided about it.
 *
 * THE TWO HALVES ARE KEPT APART ON THE PAGE. "What you asked for" is the
 * customer's own words, stored as they typed them and never edited. "What we
 * agreed" is the desk's — the rate, the amount, the fee, the note. A dispute
 * about a currency booking is always a dispute about which of those two is
 * being remembered, and merging them into one panel would destroy the
 * distinction the model exists to keep.
 */
export default async function ExchangeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const req = await ownedExchange(viewer.customerId, id);
  const meta = labelFor(EXCHANGE_LABEL, req.status);
  const payment = req.supplierPayment;

  return (
    <div>
      <Link
        href={
          req.type === "SUPPLIER_PAYMENT"
            ? "/portal/supplier-payments"
            : "/portal/exchange"
        }
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {req.type === "SUPPLIER_PAYMENT" ? "Supplier payments" : "Money exchange"}
      </Link>

      <PageHead
        title={req.reference}
        lede={`${EXCHANGE_TYPE[req.type] ?? req.type} · ${req.fromCurrency} → ${req.toCurrency}`}
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />

      {meta.hint ? <Note tone="neutral">{meta.hint}</Note> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="What you asked for">
          <dl className="space-y-3">
            <Field label="Amount">
              {req.fromCurrency}{" "}
              {toNumber(req.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Field>
            <Field label="Into">{req.toCurrency}</Field>
            {req.recipientName ? (
              <Field label="Recipient">{req.recipientName}</Field>
            ) : null}
            {req.recipientContact ? (
              <Field label="Their contact">{req.recipientContact}</Field>
            ) : null}
            {req.recipientDetails ? (
              <Field label="Their payment details">
                <span className="whitespace-pre-wrap">{req.recipientDetails}</span>
              </Field>
            ) : null}
            {req.purpose ? <Field label="Purpose">{req.purpose}</Field> : null}
            {req.preferredMethod ? (
              <Field label="How you will pay us">{req.preferredMethod}</Field>
            ) : null}
            {req.shipment ? (
              <Field label="Related cargo">
                <Link
                  href={`/portal/cargo/${req.shipment.id}`}
                  className="ai-num underline underline-offset-2"
                >
                  {req.shipment.trackingNumber}
                </Link>
              </Field>
            ) : null}
            <Field label="Asked">{formatDateTime(req.createdAt)}</Field>
          </dl>

          {req.notes ? (
            <p className="ai-muted mt-4 whitespace-pre-wrap text-sm">{req.notes}</p>
          ) : null}

          {req.documentUrl ? (
            <a
              href={req.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {req.documentName ?? "Your attachment"}
            </a>
          ) : null}
        </Panel>

        <Panel title="What we agreed">
          {req.agreedRate || req.agreedAmount || req.decisionNote ? (
            <dl className="space-y-3">
              {req.agreedRate ? (
                <Field label="Rate">
                  {toNumber(req.agreedRate).toLocaleString()}
                </Field>
              ) : null}
              {req.agreedAmount ? (
                <Field label="You receive">
                  {req.toCurrency}{" "}
                  {toNumber(req.agreedAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Field>
              ) : null}
              {req.feeAmount ? (
                <Field label="Our fee">
                  {toNumber(req.feeAmount).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Field>
              ) : null}
              {req.reviewedAt ? (
                <Field label="Reviewed">{formatDateTime(req.reviewedAt)}</Field>
              ) : null}
              {req.completedAt ? (
                <Field label="Completed">{formatDateTime(req.completedAt)}</Field>
              ) : null}
              {req.decisionNote ? (
                <Field label="Note from the desk">
                  <span className="whitespace-pre-wrap">{req.decisionNote}</span>
                </Field>
              ) : null}
            </dl>
          ) : (
            <p className="ai-muted text-sm">
              Nothing agreed yet. The money desk will put a rate to you before
              anything moves — you will get a notification when they do.
            </p>
          )}

          {req.proofUrl ? (
            <a
              href={req.proofUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {req.proofName ?? "Proof of transfer"}
            </a>
          ) : null}
        </Panel>
      </div>

      {payment ? (
        <div className="mt-6">
          <Panel title="The payment we sent">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Reference">
                <span className="ai-num">{payment.reference}</span>
              </Field>
              <Field label="Supplier">{payment.supplierName}</Field>
              <Field label="Amount">
                {payment.currency}{" "}
                {toNumber(payment.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Field>
              <Field label="Status">
                <Pill tone={labelFor(SUPPLIER_PAYMENT_LABEL, payment.status).tone}>
                  {labelFor(SUPPLIER_PAYMENT_LABEL, payment.status).label}
                </Pill>
              </Field>
              {payment.paymentReference ? (
                <Field label="Transfer reference">{payment.paymentReference}</Field>
              ) : null}
              {payment.paidAt ? (
                <Field label="Paid on">{formatDate(payment.paidAt)}</Field>
              ) : null}
            </dl>

            {payment.proofUrl ? (
              <a
                href={payment.proofUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {payment.proofName ?? "Proof of payment"}
              </a>
            ) : null}
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
