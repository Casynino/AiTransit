import type { Metadata } from "next";
import Link from "next/link";
import { QrCode } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cargoLabel } from "@/lib/cargo";
import {
  SHIPMENT_STATUS_META,
  formatPackages,
  storageStatus,
} from "@/lib/constants";
import { formatDate, formatWeight, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { portalOverview, requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "My cargo" };

/**
 * Every consignment this customer has, with the four facts they ring about:
 * where it is, what it weighs, what it costs and whether the storage clock has
 * started.
 *
 * The status shown is `publicLabel`, never the internal one. "Waiting for next
 * flight" is what a clerk needs to read; "Received in China" is what a customer
 * needs to hear, and the two are deliberately different strings in
 * SHIPMENT_STATUS_META.
 */
export default async function PortalCargoPage() {
  const viewer = await requireCustomer();
  const { shipments } = await portalOverview(viewer.customerId);

  if (shipments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <h1 className="font-display text-2xl font-bold">No cargo yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Send your supplier our Guangzhou address. As soon as your boxes reach
          our counter we register them, photograph them and they appear here with
          a tracking number.
        </p>
        <Link
          href="/china"
          className="mt-6 inline-flex h-11 items-center rounded-xl border px-5 text-sm font-medium hover:bg-muted"
        >
          Get the China address
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">My cargo</h1>
        <p className="mt-1 text-muted-foreground">
          {shipments.length} consignment{shipments.length === 1 ? "" : "s"} on
          your account.
        </p>
      </div>

      <div className="space-y-4">
        {shipments.map((shipment) => {
          const meta = SHIPMENT_STATUS_META[shipment.status];
          const storage = storageStatus(shipment.arrivedAt, shipment.deliveredAt);
          const invoice = shipment.invoice;
          /* A DRAFT invoice is Finance's working figure and nobody owes it. The
             portal shows a price only once it has been confirmed. */
          const billed = invoice && invoice.confirmedAt !== null;
          const balance = billed
            ? toNumber(invoice.total) - toNumber(invoice.amountPaid)
            : null;

          return (
            <article
              key={shipment.id}
              className="rounded-xl border bg-card p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-lg font-semibold">
                    {shipment.trackingNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cargoLabel(shipment.cargoType?.name, shipment.description)}
                  </p>
                </div>
                <Badge variant={meta.tone}>{meta.publicLabel}</Badge>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm sm:grid-cols-4">
                <Fact label="Packages">
                  {formatPackages(shipment.packages, shipment.packageType)}
                </Fact>
                <Fact label="Weight">
                  {shipment.weightKg === null
                    ? "Not yet weighed"
                    : formatWeight(toNumber(shipment.weightKg))}
                </Fact>
                <Fact label="Batch">
                  {shipment.batch?.batchNumber ?? "Not yet assigned"}
                </Fact>
                <Fact label="Registered">{formatDate(shipment.createdAt)}</Fact>
              </dl>

              {shipment.arrivedAt ? (
                <dl className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-sm sm:grid-cols-4">
                  <Fact label="Checked in at Lusaka">
                    {formatDate(shipment.arrivedAt)}
                  </Fact>
                  <Fact label="Days in warehouse">
                    {storage.daysInWarehouse}
                  </Fact>
                  <Fact label="Free days left">
                    {storage.collected ? "—" : storage.freeDaysRemaining}
                  </Fact>
                  <Fact
                    label="Storage fee"
                    tone={storage.chargeUsd > 0 ? "warning" : undefined}
                  >
                    {formatUsd(storage.chargeUsd)}
                  </Fact>
                </dl>
              ) : null}

              {billed ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
                  <span className="text-muted-foreground">
                    Invoice{" "}
                    <Link
                      href="/portal/invoices"
                      className="font-mono text-foreground hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted-foreground">
                      Total {formatUsd(toNumber(invoice.total))}
                    </span>
                    <span
                      className={
                        balance && balance > 0
                          ? "font-semibold text-warning"
                          : "font-semibold text-success"
                      }
                    >
                      {balance && balance > 0
                        ? `${formatUsd(balance)} outstanding`
                        : "Settled"}
                    </span>
                  </span>
                </div>
              ) : null}

              {shipment.pickupNote?.status === "ACTIVE" ? (
                <p className="mt-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
                  <QrCode className="h-4 w-4 shrink-0" />
                  Pickup note {shipment.pickupNote.noteNumber} has been issued.
                  Bring it to our Makeni warehouse to collect.
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Fact({
  label,
  children,
  tone,
}: {
  label: string;
  children: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className={tone === "warning" ? "mt-1 font-medium text-warning" : "mt-1 font-medium"}>
        {children}
      </dd>
    </div>
  );
}
