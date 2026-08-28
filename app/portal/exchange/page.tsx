import type { Metadata } from "next";
import { Coins } from "lucide-react";

import { RateCalculator } from "@/components/portal/rate-calculator";
import { ExchangeForm } from "@/components/portal/request-forms";
import { Empty, Note, PageHead, Panel, Pill, RecordRow } from "@/components/portal/ui";
import { publishedFxBoard } from "@/lib/exchange";
import { formatDate, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listExchange } from "@/lib/portal-data";
import { EXCHANGE_LABEL, EXCHANGE_TYPE, labelFor } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Money exchange — AITRANSIT" };

/**
 * The money desk, from the customer's side.
 *
 * THE BOARD IS SHOWN WITH ITS STATUS, NOT AS A PRICE. Published pairs are
 * indicative until the desk confirms a booking, and every surface that shows
 * them says so — this page, the calculator under it, and the confirmation on
 * the form. That is the owner's rule and it is not decorative: a customer who
 * believes a screen figure is a contract will argue about the difference.
 *
 * SUPPLIER PAYMENTS ARE FILTERED OUT of the list below. They are the same
 * ExchangeRequest table but they have their own page, with the actual transfers
 * beside them — showing them here as well would have a customer chasing one
 * request in two places.
 */
export default async function ExchangePage() {
  const viewer = await requireCustomer();
  const [board, requests] = await Promise.all([
    publishedFxBoard(),
    listExchange(viewer.customerId),
  ]);

  const mine = requests.filter((r) => r.type !== "SUPPLIER_PAYMENT");

  return (
    <div>
      <PageHead
        title="Money exchange"
        lede="Change kwacha to dollars or yuan, or send money to China through us."
      />

      <div className="mb-8">
        <ExchangeForm />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ───────────────────────────────────────────────────────── the board */}
        <Panel title="Today's rates">
          {board.length === 0 ? (
            <p className="ai-muted text-sm">
              No rates published at the moment. Ask the money desk for today&apos;s
              figure.
            </p>
          ) : (
            <>
              <ul className="divide-y" style={{ borderColor: "hsl(var(--ai-stone-3))" }}>
                {board.map((row) => (
                  <li key={row.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="ai-num font-semibold">
                        {row.base} / {row.quote}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {row.note ?? `Updated ${row.updatedLabel}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="ai-num text-sm font-semibold">
                        Buy {row.buy ?? "—"}
                      </p>
                      <p
                        className="ai-num text-sm"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        Sell {row.sell ?? "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="ai-muted mt-3 text-xs">
                Rates are indicative and subject to AITRANSIT confirmation.
              </p>
            </>
          )}
        </Panel>

        {/* ──────────────────────────────────────────────────── the calculator */}
        <Panel title="What would I get?">
          <RateCalculator board={board} />
        </Panel>
      </div>

      {/* ─────────────────────────────────────────────────── my bookings */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
          Your bookings
        </h2>

        {mine.length === 0 ? (
          <Empty
            icon={Coins}
            title="No bookings yet"
            body="Book an exchange above and the money desk will confirm a rate with you before anything moves."
          />
        ) : (
          <div className="space-y-3">
            {mine.map((req) => {
              const meta = labelFor(EXCHANGE_LABEL, req.status);
              return (
                <RecordRow
                  key={req.id}
                  href={`/portal/exchange/${req.id}`}
                  title={`${req.fromCurrency} → ${req.toCurrency}`}
                  subtitle={`${EXCHANGE_TYPE[req.type] ?? req.type} · ${req.reference}`}
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    {
                      label: "Amount",
                      value: `${req.fromCurrency} ${toNumber(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    },
                    ...(req.agreedRate
                      ? [
                          {
                            label: "Agreed rate",
                            value: toNumber(req.agreedRate).toLocaleString(),
                          },
                        ]
                      : []),
                    ...(req.agreedAmount
                      ? [
                          {
                            label: "You receive",
                            value: `${req.toCurrency} ${toNumber(req.agreedAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                          },
                        ]
                      : []),
                    { label: "Booked", value: formatDate(req.createdAt) },
                  ]}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
