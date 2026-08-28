import type { Metadata } from "next";
import { Banknote, Paperclip } from "lucide-react";

import { SupplierPaymentForm } from "@/components/portal/request-forms";
import { Empty, Note, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { formatDate, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listCargo, listExchange, listSupplierPayments } from "@/lib/portal-data";
import {
  EXCHANGE_LABEL,
  labelFor,
  SUPPLIER_PAYMENT_LABEL,
} from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Supplier payments — AITRANSIT" };

/**
 * "Pay my supplier in China for me."
 *
 * TWO LISTS, BECAUSE THERE ARE TWO THINGS. What a customer asks for is an
 * ExchangeRequest of type SUPPLIER_PAYMENT; what we actually send is a
 * SupplierPayment, created by the money desk when it decides to pay. Showing
 * only the first would leave a customer unable to see the proof of a transfer;
 * showing only the second would make every fresh request vanish until somebody
 * acted on it.
 *
 * So: "Your requests" is what you asked for and where it has got to, and
 * "Payments we have made" is money that has actually left, with the reference
 * and the proof. Nothing here is presented as complete until Finance has said
 * it is.
 */
export default async function SupplierPaymentsPage() {
  const viewer = await requireCustomer();
  const [payments, exchange, { rows }] = await Promise.all([
    listSupplierPayments(viewer.customerId),
    listExchange(viewer.customerId),
    listCargo(viewer.customerId, {}),
  ]);

  const requests = exchange.filter((r) => r.type === "SUPPLIER_PAYMENT");
  const live = rows.filter((r) => r.deliveredAt === null);

  return (
    <div>
      <PageHead
        title="Supplier payments"
        lede="Send money to your China supplier through us — you pay us in kwacha, we pay them in yuan."
      />

      <div className="mb-6">
        <SupplierPaymentForm
          cargo={live.map((c) => ({
            id: c.id,
            trackingNumber: c.trackingNumber,
          }))}
        />
      </div>

      <Note tone="amber" title="Nothing is sent until we confirm it with you">
        A request here reaches our money desk. They check the supplier's details,
        agree the amount and the rate with you, and only then send the money. You
        will see the payment reference and the proof on this page once it has gone.
      </Note>

      {/* ────────────────────────────────────────────────────── the requests */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
          Your requests
        </h2>

        {requests.length === 0 ? (
          <Empty
            icon={Banknote}
            title="No requests yet"
            body="Tell us the supplier, the amount and how they want to be paid, and our money desk takes it from there."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const meta = labelFor(EXCHANGE_LABEL, req.status);
              return (
                <RecordRow
                  key={req.id}
                  href={`/portal/exchange/${req.id}`}
                  title={req.recipientName ?? "Supplier payment"}
                  subtitle={`Request ${req.reference}`}
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    {
                      label: "Amount",
                      value: `${req.toCurrency} ${toNumber(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    },
                    ...(req.agreedRate
                      ? [
                          {
                            label: "Agreed rate",
                            value: toNumber(req.agreedRate).toLocaleString(),
                          },
                        ]
                      : []),
                    { label: "Asked", value: formatDate(req.createdAt) },
                  ]}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────── money that has moved */}
      {payments.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Payments we have made
          </h2>
          <div className="space-y-3">
            {payments.map((payment) => {
              const meta = labelFor(SUPPLIER_PAYMENT_LABEL, payment.status);
              return (
                <RecordRow
                  key={payment.id}
                  title={payment.supplierName}
                  subtitle={`${payment.reference}${payment.shipment ? ` · ${payment.shipment.trackingNumber}` : ""}`}
                  right={
                    <div className="flex flex-col items-end gap-1.5">
                      <Pill tone={meta.tone}>{meta.label}</Pill>
                      {payment.proofUrl ? (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          Proof
                        </a>
                      ) : null}
                    </div>
                  }
                  facts={[
                    {
                      label: "Sent",
                      value: `${payment.currency} ${toNumber(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    },
                    ...(payment.amountUsd
                      ? [
                          {
                            label: "In USD",
                            value: `USD ${toNumber(payment.amountUsd).toFixed(2)}`,
                          },
                        ]
                      : []),
                    ...(payment.paymentReference
                      ? [{ label: "Reference", value: payment.paymentReference }]
                      : []),
                    {
                      label: payment.paidAt ? "Paid on" : "Recorded",
                      value: formatDate(payment.paidAt ?? payment.createdAt),
                    },
                  ]}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
