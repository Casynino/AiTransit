import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";

import { Badge, Card, Eyebrow } from "@/components/brand/ui";
import { SHIPMENT_STATUS_META, storageStatus } from "@/lib/constants";
import { formatDate, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { portalOverview, requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "My AITRANSIT" };

/**
 * The customer's front page.
 *
 * Answers the three questions somebody signs in with, in the order they ask
 * them: where is my cargo, what do I owe, and is anything waiting on me. Every
 * figure is the same figure the internal system holds — the balance is
 * `total - amountPaid` off the invoice, the storage days come from the same
 * storageStatus() the counter reads — so a customer and a clerk on the phone
 * are never looking at two different numbers.
 *
 * Drafts never appear: the query in lib/portal.ts excludes them, because a
 * draft is Finance's working figure and nobody owes it yet.
 */
export default async function PortalHome() {
  const viewer = await requireCustomer();
  const { shipments, invoices, customer } = await portalOverview(viewer.customerId);

  const inFlight = shipments.filter(
    (s) => s.status !== "DELIVERED" && s.status !== "CANCELLED"
  );
  const ready = shipments.filter((s) => s.status === "READY_FOR_PICKUP");

  const outstanding = invoices.reduce((sum, invoice) => {
    if (["PAID", "VOID", "WRITTEN_OFF"].includes(invoice.status)) return sum;
    return sum + (toNumber(invoice.total) - toNumber(invoice.amountPaid));
  }, 0);

  const creditLimit =
    customer?.creditLimitUsd == null ? null : toNumber(customer.creditLimitUsd);

  const storageWarnings = shipments
    .map((shipment) => ({
      shipment,
      storage: storageStatus(shipment.arrivedAt, shipment.deliveredAt),
    }))
    .filter(({ storage }) => storage.expired || storage.lastFreeDay);

  return (
    <div className="space-y-10">
      <div>
        <Eyebrow>Your account</Eyebrow>
        <h1 className="ai-display-lg mt-3">
          Hello, {viewer.name.split(" ")[0]}
        </h1>
        <p className="ai-muted mt-2">
          Account <span className="ai-num font-semibold">{viewer.code}</span> —
          quote it when you call or message us.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          icon={Package}
          label="Cargo on the move"
          value={String(inFlight.length)}
          hint={`${shipments.length} in total`}
          href="/portal/cargo"
        />
        <Tile
          icon={CheckCircle2}
          label="Ready to collect"
          value={String(ready.length)}
          hint="At our Makeni warehouse"
          href="/portal/cargo"
          accent={ready.length > 0 ? "emerald" : undefined}
        />
        <Tile
          icon={Receipt}
          label="Outstanding"
          value={formatUsd(outstanding)}
          hint={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
          href="/portal/invoices"
          accent={outstanding > 0 ? "copper" : undefined}
        />
        <Tile
          icon={Wallet}
          label="Approved credit"
          value={creditLimit === null ? "—" : formatUsd(creditLimit)}
          hint={
            creditLimit === null
              ? "No credit facility"
              : customer?.creditTermDays
                ? `${customer.creditTermDays} day terms`
                : "Agreed with Finance"
          }
          href="/portal/invoices"
        />
      </div>

      {storageWarnings.length > 0 ? (
        <div
          className="rounded-[var(--ai-radius-lg)] border p-6"
          style={{
            borderColor: "hsl(38 92% 50% / 0.4)",
            background: "hsl(38 92% 50% / 0.07)",
          }}
        >
          <h2
            className="flex items-center gap-2 font-semibold"
            style={{ color: "hsl(28 72% 32%)" }}
          >
            <AlertTriangle className="h-5 w-5" />
            Storage is running
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {storageWarnings.map(({ shipment, storage }) => (
              <li key={shipment.id} className="flex flex-wrap gap-x-2">
                <span className="ai-num font-semibold">
                  {shipment.trackingNumber}
                </span>
                <span style={{ color: "hsl(28 40% 30%)" }}>
                  {storage.expired
                    ? `${storage.chargeableDays} chargeable day${storage.chargeableDays === 1 ? "" : "s"} — ${formatUsd(storage.chargeUsd)} so far.`
                    : "Today is the last free day. Charges begin tomorrow."}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs" style={{ color: "hsl(28 40% 34%)" }}>
            Free for {storageWarnings[0]?.storage.freeDays} days from check-in at
            Lusaka, then USD {storageWarnings[0]?.storage.perDayUsd} a day.
          </p>
        </div>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="ai-display">Recent cargo</h2>
          <Link href="/portal/cargo" className="ai-link">
            All cargo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {shipments.length === 0 ? (
          <Card className="mt-6">
            <p className="ai-muted">
              Nothing here yet. Once we register cargo for you in Guangzhou it
              appears with a tracking number you can follow.
            </p>
            <Link href="/china" className="ai-btn ai-btn-outline ai-btn-sm mt-5">
              Get our China address
            </Link>
          </Card>
        ) : (
          <Card className="ai-rows mt-6 !p-0">
            {shipments.slice(0, 6).map((shipment) => {
              const meta = SHIPMENT_STATUS_META[shipment.status];
              return (
                <div
                  key={shipment.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-5"
                >
                  <div className="min-w-0">
                    <p className="ai-num font-semibold">
                      {shipment.trackingNumber}
                    </p>
                    <p className="ai-muted truncate text-sm">
                      {shipment.cargoType?.name ?? shipment.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="ai-muted hidden items-center gap-1.5 text-xs sm:flex">
                      <Clock className="h-3 w-3" />
                      {formatDate(shipment.createdAt)}
                    </span>
                    <Badge
                      tone={
                        shipment.status === "READY_FOR_PICKUP"
                          ? "emerald"
                          : shipment.status === "DELIVERED"
                            ? "ink"
                            : "copper"
                      }
                    >
                      {meta.publicLabel}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  hint,
  href,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  hint: string;
  href: string;
  accent?: "emerald" | "copper";
}) {
  return (
    <Link href={href} className="ai-card ai-card-lift block">
      <Icon
        className="h-5 w-5"
        style={{
          color:
            accent === "emerald"
              ? "hsl(var(--ai-emerald))"
              : accent === "copper"
                ? "hsl(var(--ai-copper))"
                : "hsl(var(--ai-charcoal-soft))",
        }}
      />
      <p
        className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.14em]"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        {label}
      </p>
      <p className="ai-num mt-1.5 text-2xl font-semibold">{value}</p>
      <p className="ai-muted mt-1 text-xs">{hint}</p>
    </Link>
  );
}
