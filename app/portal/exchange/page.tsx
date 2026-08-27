import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/brand/ui";
import {
  EXCHANGE_STATUS_LABELS,
  EXCHANGE_STATUS_TONE,
  EXCHANGE_TYPE_LABELS,
  customerExchangeHistory,
  publishedFxBoard,
} from "@/lib/exchange";
import { formatDate, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "Money exchange" };

const amount = (value: number, currency: string) =>
  `${currency} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * The customer's own money-desk history.
 *
 * Reads exactly like the internal queue, minus the decision controls — same
 * status labels, same tones, same reference numbers — so a customer on the
 * phone and the clerk answering are describing the same row in the same words.
 *
 * Booking a new one sends them to the public /exchange page rather than
 * duplicating the form here. One form, one action, one set of validation rules;
 * a second copy behind a login is a second place for the two to drift apart.
 */
export default async function PortalExchangePage() {
  const viewer = await requireCustomer();
  const [{ requests, payments }, board] = await Promise.all([
    customerExchangeHistory(viewer.customerId),
    publishedFxBoard(),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="ai-display-lg">
            Money exchange
          </h1>
          <p className="mt-1 ai-muted">
            Your exchange bookings and the payments we have made to your
            suppliers in China.
          </p>
        </div>
        <Link
          href="/exchange"
          className="ai-btn ai-btn-primary"
        >
          New request
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {board.length > 0 ? (
        <section className="rounded-xl border bg-card p-5">
          <h2 className="ai-display-sm">
            Today&rsquo;s published rates
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {board.map((pair) => (
              <div key={pair.id}>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] ai-muted">
                  {pair.base} → {pair.quote}
                </p>
                <p className="mt-1 font-mono text-sm tabular">
                  buy {pair.buy} · sell {pair.sell}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs ai-muted">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Indicative. Your confirmed rate is the one our finance desk agrees
            with you, and it is shown on the request itself once agreed.
          </p>
        </section>
      ) : null}

      <section>
        <h2 className="ai-display">My requests</h2>
        {requests.length === 0 ? (
          <p className="ai-card ai-muted mt-6">
            Nothing yet. Book an exchange or ask us to pay a supplier and it will
            appear here with its status.
          </p>
        ) : (
          <ul className="ai-card ai-rows mt-6 !p-0">
            {requests.map((request) => (
              <li key={request.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="ai-num text-sm">{request.reference}</p>
                    <p className="font-medium">
                      {EXCHANGE_TYPE_LABELS[request.type]}
                    </p>
                    <p className="mt-1 text-sm ai-muted">
                      {amount(toNumber(request.amount), request.fromCurrency)} →{" "}
                      {request.toCurrency}
                      {request.recipientName
                        ? ` · to ${request.recipientName}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone={EXCHANGE_STATUS_TONE[request.status]}>
                      {EXCHANGE_STATUS_LABELS[request.status]}
                    </Badge>
                    <p className="mt-1 text-xs ai-muted">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>

                {request.agreedRate !== null ? (
                  <p className="ai-card mt-3 !p-3 text-sm">
                    <span className="block text-xs uppercase tracking-widest ai-muted">
                      Agreed with you
                    </span>
                    1 {request.fromCurrency} = {request.toCurrency}{" "}
                    {toNumber(request.agreedRate).toLocaleString()}
                    {request.agreedAmount !== null
                      ? ` — you receive ${amount(toNumber(request.agreedAmount), request.toCurrency)}`
                      : ""}
                    {request.feeAmount !== null
                      ? `, fee ${amount(toNumber(request.feeAmount), request.fromCurrency)}`
                      : ""}
                  </p>
                ) : null}

                {request.decisionNote ? (
                  <p className="mt-2 text-sm ai-muted">
                    {request.decisionNote}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="ai-display">
          Payments to your suppliers
        </h2>
        {payments.length === 0 ? (
          <p className="ai-card ai-muted mt-6">
            We have not paid a supplier on your behalf yet.
          </p>
        ) : (
          <ul className="ai-card ai-rows mt-6 !p-0">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="ai-num text-sm">{payment.reference}</p>
                  <p className="font-medium">{payment.supplierName}</p>
                  <p className="mt-1 text-sm ai-muted">
                    {amount(toNumber(payment.amount), payment.currency)}
                    {payment.supplierReference
                      ? ` · order ${payment.supplierReference}`
                      : ""}
                    {payment.shipment
                      ? ` · cargo ${payment.shipment.trackingNumber}`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    tone={payment.status === "PAID" ? "success" : "warning"}
                  >
                    {payment.status.toLowerCase()}
                  </Badge>
                  <p className="mt-1 text-xs ai-muted">
                    {formatDate(payment.paidAt ?? payment.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
