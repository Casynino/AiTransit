import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

import { CargoFilters } from "@/components/portal/cargo-filters";
import { Empty, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { SHIPMENT_STATUS_META, storageStatus } from "@/lib/constants";
import { formatDate, formatWeight, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { listCargo } from "@/lib/portal-data";
import { requireCustomer } from "@/lib/portal";
import { INVOICE_LABEL, labelFor } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "My cargo — AITRANSIT" };

/**
 * Every consignment this customer has ever sent.
 *
 * Filters are read from the query string and passed straight to listCargo,
 * which adds them to a WHERE that already contains the customer id — see the
 * comment there. A filter can narrow this list; nothing in the URL can widen it
 * past the signed-in customer.
 */
export default async function CargoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireCustomer();
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === "string" ? v : undefined;
  };

  const { rows, batches } = await listCargo(viewer.customerId, {
    q: one("q"),
    status: one("status"),
    batch: one("batch"),
    from: one("from"),
    to: one("to"),
  });

  const filtered = Boolean(one("q") || one("status") || one("batch") || one("from") || one("to"));

  return (
    <div>
      <PageHead
        title="My cargo"
        lede="Everything we have registered for you, newest first. Open any consignment for its full history."
      />

      <CargoFilters batches={batches} />

      {rows.length === 0 ? (
        <Empty
          icon={Package}
          title={filtered ? "Nothing matches those filters" : "No cargo yet"}
          body={
            filtered
              ? "Try clearing the filters, or search for the tracking number on its own."
              : "Once we register cargo for you at our China warehouse it appears here."
          }
          action={
            filtered ? (
              <Link href="/portal/cargo" className="ai-btn ai-btn-outline">
                Clear filters
              </Link>
            ) : (
              <Link href="/portal/china" className="ai-btn ai-btn-primary">
                Ask us about shipping
              </Link>
            )
          }
        />
      ) : (
        <>
          <p className="ai-muted mb-4 text-sm">
            {rows.length} consignment{rows.length === 1 ? "" : "s"}
          </p>

          <div className="space-y-3">
            {rows.map((cargo) => {
              const meta = SHIPMENT_STATUS_META[cargo.status];
              const storage = storageStatus(cargo.arrivedAt, cargo.deliveredAt);
              const invoice = cargo.invoice;
              const owed = invoice
                ? toNumber(invoice.total) - toNumber(invoice.amountPaid)
                : 0;
              const invoiceMeta = invoice
                ? labelFor(INVOICE_LABEL, invoice.status)
                : null;

              return (
                <RecordRow
                  key={cargo.id}
                  href={`/portal/cargo/${cargo.id}`}
                  media={
                    /*
                      The first photograph, when the warehouse took one. Cargo
                      photographed at check-in is the customer's own proof of
                      condition, and a thumbnail is the fastest way to recognise
                      a box among eleven identical tracking numbers.
                    */
                    cargo.photos[0] ? (
                      <Image
                        src={cargo.photos[0].url}
                        alt=""
                        width={72}
                        height={72}
                        unoptimized
                        className="h-[4.5rem] w-[4.5rem] rounded-[var(--ai-radius)] object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[var(--ai-radius)]"
                        style={{ background: "hsl(var(--ai-stone-2))" }}
                      >
                        <Package
                          className="h-6 w-6"
                          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                        />
                      </div>
                    )
                  }
                  title={
                    <span className="ai-num">{cargo.trackingNumber}</span>
                  }
                  subtitle={
                    <>
                      {cargo.description}
                      {cargo.cargoType?.name ? ` · ${cargo.cargoType.name}` : ""}
                    </>
                  }
                  right={
                    <div className="flex flex-col items-end gap-1.5">
                      <Pill
                        tone={
                          cargo.status === "READY_FOR_PICKUP"
                            ? "emerald"
                            : cargo.status === "UNDER_INVESTIGATION"
                              ? "rose"
                              : cargo.status === "DELIVERED"
                                ? "neutral"
                                : "amber"
                        }
                      >
                        {meta?.publicLabel ?? cargo.status}
                      </Pill>
                      {invoiceMeta ? (
                        <Pill tone={invoiceMeta.tone}>{invoiceMeta.label}</Pill>
                      ) : null}
                    </div>
                  }
                  facts={[
                    {
                      label: "Where",
                      value: meta?.publicLocation ?? "—",
                    },
                    {
                      label: "Pieces",
                      value: String(cargo.packages),
                    },
                    {
                      label: "Weight",
                      value: formatWeight(toNumber(cargo.weightKg)),
                    },
                    {
                      label: "Batch",
                      value: cargo.batch?.batchNumber ?? "Not yet assigned",
                    },
                    ...(cargo.arrivedAt
                      ? [
                          {
                            label: "Checked in",
                            value: formatDate(cargo.arrivedAt),
                          },
                          {
                            label: "Storage",
                            value: storage.collected
                              ? "Collected"
                              : storage.expired
                                ? `${storage.chargeableDays} chargeable day(s) · ${formatUsd(storage.chargeUsd)}`
                                : `${storage.freeDaysRemaining} free day(s) left`,
                          },
                        ]
                      : []),
                    ...(invoice
                      ? [
                          {
                            label: "Owing",
                            value:
                              owed > 0.005
                                ? formatUsd(owed)
                                : "Nothing",
                          },
                        ]
                      : []),
                    {
                      label: "Pickup note",
                      value: cargo.pickupNote
                        ? cargo.pickupNote.noteNumber
                        : "Not issued",
                    },
                  ]}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
