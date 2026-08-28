import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeAlert,
  Camera,
  Receipt,
  ScrollText,
  Warehouse,
} from "lucide-react";

import { CargoTimeline } from "@/components/portal/cargo-timeline";
import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import {
  formatPackages,
  SHIPMENT_STATUS_META,
  storageStatus,
  STORAGE_POLICY,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatWeight, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { requireCustomer } from "@/lib/portal";
import { ownedCargo } from "@/lib/portal-data";
import {
  CLAIM_LABEL,
  CLAIM_TYPE,
  CREDIT_LABEL,
  INVOICE_LABEL,
  labelFor,
  PICKUP_NOTE_LABEL,
} from "@/lib/portal-labels";
import { shipmentQrDataUrl } from "@/lib/qr";

export const metadata: Metadata = { title: "Cargo — AITRANSIT" };

/**
 * One consignment, in full.
 *
 * `ownedCargo` takes the tracking number OR the id and puts the customer in the
 * WHERE clause, so a URL for somebody else's cargo 404s exactly like a URL for
 * cargo that does not exist — see lib/portal-data.ts.
 *
 * WHAT IT SHOWS AND WHAT IT DOES NOT. Everything on this page is either a fact
 * about the customer's own goods or a figure from their own invoice. The
 * warehouse's internal notes, the clerk who registered it and the pricing
 * working that Finance overrode are all absent, because none of them is theirs
 * and two of them start arguments about people rather than about cargo.
 */
export default async function CargoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const cargo = await ownedCargo(viewer.customerId, id);

  const meta = SHIPMENT_STATUS_META[cargo.status];
  const storage = storageStatus(cargo.arrivedAt, cargo.deliveredAt);
  const invoice = cargo.invoice;
  const owed = invoice ? toNumber(invoice.total) - toNumber(invoice.amountPaid) : 0;
  const qr = await shipmentQrDataUrl(cargo.qrToken, 200);

  const openClaim = cargo.exceptions.find(
    (e) => !["CLOSED", "RESOLVED", "WRITTEN_OFF"].includes(e.status)
  );

  return (
    <div>
      <Link
        href="/portal/cargo"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All my cargo
      </Link>

      <PageHead
        title={cargo.trackingNumber}
        lede={cargo.description}
        action={
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
        }
      />

      {/* ─────────────────────────────────────────────── anything urgent first */}
      <div className="mb-6 space-y-3">
        {cargo.status === "READY_FOR_PICKUP" ? (
          <Note tone="emerald" title="Ready to collect">
            Waiting at our Makeni warehouse, Lusaka.{" "}
            <Link href="/portal/appointments" className="font-semibold underline">
              Book a pickup time
            </Link>
            {cargo.pickupNote ? (
              <>
                {" · "}
                <Link href="/portal/pickup-notes" className="font-semibold underline">
                  Open pickup note {cargo.pickupNote.noteNumber}
                </Link>
              </>
            ) : null}
          </Note>
        ) : null}

        {storage.expired && !storage.collected ? (
          <Note tone="amber" title="Storage is being charged">
            {storage.chargeableDays} chargeable day
            {storage.chargeableDays === 1 ? "" : "s"} so far —{" "}
            {formatUsd(storage.chargeUsd)}. Storage is free for{" "}
            {STORAGE_POLICY.freeDays} days after check-in, then{" "}
            {formatUsd(STORAGE_POLICY.perDayUsd)} a day.
          </Note>
        ) : null}

        {openClaim ? (
          <Note tone="amber" title="There is an open issue on this cargo">
            {CLAIM_TYPE[openClaim.type] ?? openClaim.type} —{" "}
            {labelFor(CLAIM_LABEL, openClaim.status).label}.{" "}
            <Link
              href={`/portal/claims/${openClaim.id}`}
              className="font-semibold underline"
            >
              Open the claim
            </Link>
          </Note>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* ──────────────────────────────────────────────────── photographs */}
          {cargo.photos.length > 0 ? (
            <Panel title="Photographs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {cargo.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-[var(--ai-radius)]"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? "Cargo photograph"}
                      width={320}
                      height={240}
                      unoptimized
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
              <p className="ai-muted mt-3 text-xs">
                Taken by our warehouse. These are the record of the condition your
                cargo was in — tap any to see it full size.
              </p>
            </Panel>
          ) : (
            <Panel title="Photographs">
              <div className="flex items-center gap-3">
                <Camera
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                />
                <p className="ai-muted text-sm">
                  No photographs on this consignment yet.
                </p>
              </div>
            </Panel>
          )}

          {/* ────────────────────────────────────────────────────── the journey */}
          <Panel title="Where it has been">
            <CargoTimeline
              input={{
                registeredAt: cargo.registeredAt,
                batchNumber: cargo.batch?.batchNumber ?? null,
                departedAt: cargo.departedAt,
                arrivedAt: cargo.arrivedAt,
                readyForPickup: cargo.readyForPickup,
                deliveredAt: cargo.deliveredAt,
                invoiceConfirmedAt: invoice?.confirmedAt ?? null,
                invoicePaidAt:
                  invoice && toNumber(invoice.amountPaid) > 0
                    ? invoice.confirmedAt
                    : null,
                creditApproved: invoice?.creditStatus === "APPROVED",
                expectedArrival: cargo.batch?.expectedArrival ?? null,
              }}
            />
          </Panel>

          {/* ───────────────────────────────────────────────────── the packages */}
          {cargo.packageList.length > 0 ? (
            <Panel title="The boxes">
              <ul className="divide-y" style={{ borderColor: "hsl(var(--ai-stone-3))" }}>
                {cargo.packageList.map((pkg) => (
                  <li
                    key={pkg.id}
                    className="flex items-center justify-between py-2.5 text-sm"
                  >
                    <span className="ai-num font-medium">
                      {pkg.sequence} of {cargo.packages} · {pkg.reference}
                    </span>
                    <span className="ai-num" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                      {pkg.weightKg ? formatWeight(toNumber(pkg.weightKg)) : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {/* ────────────────────────────────────────────────── recorded history */}
          {cargo.statusHistory.length > 0 ? (
            <Panel title="Activity history">
              <ul className="space-y-2.5">
                {[...cargo.statusHistory].reverse().map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <span className="font-medium">
                      {SHIPMENT_STATUS_META[entry.toStatus]?.publicLabel ??
                        entry.toStatus}
                    </span>
                    <span
                      className="ai-num ml-2 text-xs"
                      style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                    >
                      {formatDateTime(entry.createdAt)}
                    </span>
                    {entry.note ? (
                      <span
                        className="mt-0.5 block text-xs"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {entry.note}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>

        {/* ───────────────────────────────────────────────────────── the facts */}
        <div className="space-y-6">
          <Panel title="This consignment">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Category">{cargo.cargoType?.name ?? "—"}</Field>
              <Field label="Pieces">
                {formatPackages(cargo.packages, cargo.packageType)}
              </Field>
              <Field label="Weight in China">
                {formatWeight(toNumber(cargo.weightKg))}
              </Field>
              <Field label="Billable weight">
                {cargo.chargeableKg
                  ? formatWeight(toNumber(cargo.chargeableKg))
                  : formatWeight(toNumber(cargo.weightKg))}
              </Field>
              <Field label="Origin">{cargo.origin.replace(/_/g, " ")}</Field>
              <Field label="Batch">{cargo.batch?.batchNumber ?? "Not yet assigned"}</Field>
              <Field label="Registered">{formatDate(cargo.registeredAt)}</Field>
              <Field label="Checked in at Lusaka">
                {cargo.arrivedAt ? formatDate(cargo.arrivedAt) : "Not yet"}
              </Field>
            </dl>
          </Panel>

          {/* ──────────────────────────────────────────────────────────── the QR */}
          <Panel title="Your code">
            <div className="flex flex-col items-center gap-3">
              <Image
                src={qr}
                alt={`QR code for ${cargo.trackingNumber}`}
                width={160}
                height={160}
                unoptimized
                className="rounded-[var(--ai-radius)] bg-white p-2"
              />
              <p className="ai-num text-sm font-bold">{cargo.trackingNumber}</p>
              <p className="ai-muted text-center text-xs">
                Show this at the counter, or scan it yourself to open the tracking
                page.
              </p>
            </div>
          </Panel>

          {/* ────────────────────────────────────────────────────────── storage */}
          {cargo.arrivedAt ? (
            <Panel title="Storage">
              <dl className="space-y-3">
                <Field label="In the warehouse since">
                  {formatDate(cargo.arrivedAt)}
                </Field>
                <Field label="Days so far">{String(storage.daysInWarehouse)}</Field>
                <Field label="Free days left">
                  {storage.collected ? "—" : String(storage.freeDaysRemaining)}
                </Field>
                <Field label="Chargeable so far">
                  {storage.chargeableDays > 0
                    ? `${storage.chargeableDays} day(s) · ${formatUsd(storage.chargeUsd)}`
                    : "Nothing"}
                </Field>
              </dl>
              <p className="ai-muted mt-3 text-xs">
                What you are actually billed is on your invoice — the desk waives
                storage from time to time, and the invoice is the figure that counts.
              </p>
            </Panel>
          ) : null}

          {/* ─────────────────────────────────────────────────────── the invoice */}
          <Panel title="Price and payment">
            {invoice ? (
              <>
                <dl className="space-y-3">
                  <Field label="Invoice">
                    <Link
                      href={`/portal/invoices/${invoice.id}`}
                      className="ai-num underline underline-offset-2"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </Field>
                  <Field label="Total">
                    {invoice.currency} {toNumber(invoice.total).toFixed(2)}
                  </Field>
                  <Field label="Paid">
                    {invoice.currency} {toNumber(invoice.amountPaid).toFixed(2)}
                  </Field>
                  <Field label="Outstanding">
                    {owed > 0.005 ? (
                      <span style={{ color: "hsl(var(--ai-copper))" }}>
                        {invoice.currency} {owed.toFixed(2)}
                      </span>
                    ) : (
                      "Nothing"
                    )}
                  </Field>
                  {invoice.storageCharge && toNumber(invoice.storageCharge) > 0 ? (
                    <Field label="Storage on this invoice">
                      {invoice.currency} {toNumber(invoice.storageCharge).toFixed(2)}{" "}
                      ({invoice.storageDays} day
                      {invoice.storageDays === 1 ? "" : "s"})
                    </Field>
                  ) : null}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone={labelFor(INVOICE_LABEL, invoice.status).tone}>
                    {labelFor(INVOICE_LABEL, invoice.status).label}
                  </Pill>
                  {invoice.creditStatus !== "NONE" ? (
                    <Pill tone={labelFor(CREDIT_LABEL, invoice.creditStatus).tone}>
                      {labelFor(CREDIT_LABEL, invoice.creditStatus).label}
                    </Pill>
                  ) : null}
                </div>

                {owed > 0.005 ? (
                  <Link
                    href={`/portal/invoices/${invoice.id}`}
                    className="ai-btn ai-btn-primary mt-4 w-full"
                  >
                    <Receipt className="h-4 w-4" />
                    Pay or send proof
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="ai-muted text-sm">
                Not priced yet. Finance raises an invoice once your cargo has been
                weighed at Lusaka — nothing is owed until then.
              </p>
            )}
          </Panel>

          {/* ───────────────────────────────────────────────────── pickup note */}
          {cargo.pickupNote ? (
            <Panel title="Pickup note">
              <dl className="space-y-3">
                <Field label="Number">
                  <span className="ai-num">{cargo.pickupNote.noteNumber}</span>
                </Field>
                <Field label="Issued">{formatDate(cargo.pickupNote.issuedAt)}</Field>
                <Field label="Status">
                  <Pill tone={labelFor(PICKUP_NOTE_LABEL, cargo.pickupNote.status).tone}>
                    {labelFor(PICKUP_NOTE_LABEL, cargo.pickupNote.status).label}
                  </Pill>
                </Field>
              </dl>
              <Link
                href={`/portal/pickup-notes/${cargo.pickupNote.id}`}
                className="ai-btn ai-btn-outline mt-4 w-full"
              >
                <ScrollText className="h-4 w-4" />
                Open the note
              </Link>
            </Panel>
          ) : null}

          {/* ─────────────────────────────────────────────── raise a problem */}
          <Panel title="Something wrong?">
            <p className="ai-muted text-sm">
              Damaged, missing or not what you sent — tell us and we will
              investigate.
            </p>
            <Link
              href={`/portal/claims/new?cargo=${cargo.id}`}
              className="ai-btn ai-btn-outline mt-4 w-full"
            >
              <BadgeAlert className="h-4 w-4" />
              Raise an issue
            </Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
