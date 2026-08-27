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

import { Badge } from "@/components/ui/badge";
import { SHIPMENT_STATUS_META, storageStatus } from "@/lib/constants";
import { formatDate, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { portalOverview, requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "My AITRANSIT" };

/**
 * The customer's own front page.
 *
 * Answers the three questions somebody signs in with, in the order they ask
 * them: where is my cargo, what do I owe, and is anything waiting on me. Every
 * figure is the same figure the internal system holds — the balance is
 * `total - amountPaid` off the invoice, and the storage days come from the same
 * storageStatus() the counter reads — so a customer and a clerk on the phone are
 * never looking at two different numbers.
 *
 * What it deliberately does NOT show: anything about another customer, anything
 * internal (staff names, cost inputs, notes) and any invoice still in DRAFT. A
 * draft is Finance's working figure that nobody has reviewed, and showing one
 * would be asking for money the business has not yet decided to ask for.
 */
export default async function PortalHome() {
  const viewer = await requireCustomer();
  const { shipments, invoices, customer } = await portalOverview(viewer.customerId);

  const inFlight = shipments.filter(
    (s) => s.status !== "DELIVERED" && s.status !== "CANCELLED"
  );
  const readyToCollect = shipments.filter((s) => s.status === "READY_FOR_PICKUP");

  const outstanding = invoices.reduce((sum, invoice) => {
    if (invoice.status === "PAID" || invoice.status === "VOID") return sum;
    if (invoice.status === "WRITTEN_OFF") return sum;
    return sum + (toNumber(invoice.total) - toNumber(invoice.amountPaid));
  }, 0);

  const creditLimit =
    customer?.creditLimitUsd === null || customer?.creditLimitUsd === undefined
      ? null
      : toNumber(customer.creditLimitUsd);

  /* Storage that has started costing money, and storage about to. Both are
     worth a customer's attention and neither is visible from a status alone. */
  const storageWarnings = shipments
    .map((shipment) => ({
      shipment,
      storage: storageStatus(shipment.arrivedAt, shipment.deliveredAt),
    }))
    .filter(({ storage }) => storage.expired || storage.lastFreeDay);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Hello, {viewer.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your account is <span className="font-mono">{viewer.code}</span>. Quote
          it when you call or message us.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          value={String(readyToCollect.length)}
          hint="At our Makeni warehouse"
          href="/portal/cargo"
          tone={readyToCollect.length > 0 ? "success" : undefined}
        />
        <Tile
          icon={Receipt}
          label="Outstanding"
          value={formatUsd(outstanding)}
          hint={`${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`}
          href="/portal/invoices"
          tone={outstanding > 0 ? "warning" : undefined}
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
        <section className="rounded-xl border border-warning/40 bg-warning/5 p-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Storage
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {storageWarnings.map(({ shipment, storage }) => (
              <li key={shipment.id} className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono">{shipment.trackingNumber}</span>
                <span className="text-muted-foreground">
                  {storage.expired
                    ? `${storage.chargeableDays} chargeable day${storage.chargeableDays === 1 ? "" : "s"} — ${formatUsd(storage.chargeUsd)} so far.`
                    : "Today is the last free day. Charges begin tomorrow."}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Storage is free for the first {storageWarnings[0]?.storage.freeDays}{" "}
            days from check-in at Lusaka, then USD{" "}
            {storageWarnings[0]?.storage.perDayUsd} per day.
          </p>
        </section>
      ) : null}

      <section>
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold">Recent cargo</h2>
          <Link
            href="/portal/cargo"
            className="inline-flex items-center gap-1 text-sm text-signal hover:underline"
          >
            All cargo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {shipments.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nothing here yet. Once we register cargo for you in Guangzhou it
            appears on this page with a tracking number.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {shipments.slice(0, 6).map((shipment) => {
              const meta = SHIPMENT_STATUS_META[shipment.status];
              return (
                <li
                  key={shipment.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{shipment.trackingNumber}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {shipment.cargoType?.name ?? shipment.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {formatDate(shipment.createdAt)}
                    </span>
                    <Badge variant={meta.tone}>{meta.publicLabel}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
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
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  href: string;
  tone?: "success" | "warning";
}) {
  const accent =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-brand";

  return (
    <Link
      href={href}
      className="rounded-xl border bg-card p-5 shadow-soft transition-shadow hover:shadow-lift"
    >
      <Icon className={`h-5 w-5 ${accent}`} />
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}
