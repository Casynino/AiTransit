import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { PrintButton } from "@/components/portal/print-button";
import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import { COMPANY, formatPackages } from "@/lib/constants";
import { formatDate, formatWeight, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { ownedPickupNote } from "@/lib/portal-data";
import { labelFor, PICKUP_NOTE_LABEL } from "@/lib/portal-labels";
import { shipmentQrDataUrl } from "@/lib/qr";

export const metadata: Metadata = { title: "Pickup note — AITRANSIT" };

/**
 * One pickup note, as the counter needs to see it.
 *
 * BUILT TO BE HELD UP TO A SCANNER. The QR is large and on white, the tracking
 * number is set big underneath it, and everything else is secondary — because
 * the moment this page is used is somebody standing at a counter in Makeni with
 * a warehouse clerk waiting. The clerk scans the code; the customer reads the
 * number aloud if the scan fails.
 *
 * A CANCELLED OR USED NOTE SAYS SO, LOUDLY. Cargo released against a note that
 * was already used is cargo released twice, and the failure mode is a customer
 * arriving with a screenshot of a note from last month.
 */
export default async function PickupNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const note = await ownedPickupNote(viewer.customerId, id);

  const meta = labelFor(PICKUP_NOTE_LABEL, note.status);
  const qr = await shipmentQrDataUrl(note.shipment.qrToken, 320);
  const invoice = note.shipment.invoice;
  const owed = invoice
    ? toNumber(invoice.total) - toNumber(invoice.amountPaid)
    : 0;

  return (
    <div>
      <Link
        href="/portal/pickup-notes"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All pickup notes
      </Link>

      <PageHead
        title={note.noteNumber}
        lede="Show this at our Makeni warehouse to collect your cargo."
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />

      {note.status !== "ACTIVE" ? (
        <Note
          tone="amber"
          title={
            note.status === "USED"
              ? "This note has already been used"
              : "This note was cancelled"
          }
        >
          {note.status === "USED"
            ? `Cargo was handed over on ${note.usedAt ? formatDate(note.usedAt) : "a previous date"}. It cannot be used again.`
            : "It is no longer valid. Speak to us if you still need to collect."}
        </Note>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* ────────────────────────────────────────────────── the scannable bit */}
        <div
          className="rounded-[var(--ai-radius-lg)] border p-6 text-center"
          style={{
            borderColor: "hsl(var(--ai-stone-3))",
            background: "hsl(var(--ai-white))",
            /* A used or cancelled note is dimmed so a clerk can tell at arm's
               length, before reading a word of it. */
            opacity: note.status === "ACTIVE" ? 1 : 0.55,
          }}
        >
          <Image
            src={qr}
            alt={`QR code for ${note.shipment.trackingNumber}`}
            width={240}
            height={240}
            unoptimized
            className="mx-auto rounded-[var(--ai-radius)] bg-white p-3"
          />
          <p className="ai-num mt-4 text-2xl font-bold">
            {note.shipment.trackingNumber}
          </p>
          <p className="ai-num text-sm" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
            {note.noteNumber}
          </p>
          <p className="mt-3 text-sm font-semibold">{viewer.name}</p>
          <p className="ai-num text-xs" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
            {viewer.code}
          </p>
        </div>

        <div className="space-y-6">
          <Panel title="What you are collecting">
            <dl className="grid grid-cols-2 gap-4">
              <Field label="Description">{note.shipment.description}</Field>
              <Field label="Category">{note.shipment.cargoType?.name ?? "—"}</Field>
              <Field label="Pieces">
                {formatPackages(note.shipment.packages, note.shipment.packageType)}
              </Field>
              <Field label="Weight">
                {formatWeight(toNumber(note.shipment.weightKg))}
              </Field>
              <Field label="Issued">{formatDate(note.issuedAt)}</Field>
              <Field label="Amount settled">
                {note.currency} {toNumber(note.amountPaid).toFixed(2)}
              </Field>
            </dl>
          </Panel>

          <Panel title="Payment position">
            {invoice ? (
              <dl className="space-y-3">
                <Field label="Invoice">
                  <span className="ai-num">{invoice.invoiceNumber}</span>
                </Field>
                <Field label="Status">
                  {invoice.creditStatus === "APPROVED"
                    ? "Released on approved credit"
                    : owed > 0.005
                      ? `${invoice.currency} ${owed.toFixed(2)} still outstanding`
                      : "Paid in full"}
                </Field>
              </dl>
            ) : (
              <p className="ai-muted text-sm">No invoice attached.</p>
            )}
          </Panel>

          <Panel title="Where to collect">
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "hsl(var(--ai-emerald))" }}
              />
              <div className="text-sm">
                <p className="font-semibold">{COMPANY.name}</p>
                <p className="ai-muted">{COMPANY.zambiaAddress}</p>
                <p className="ai-num mt-1">{COMPANY.phone}</p>
              </div>
            </div>

            <Note tone="neutral">
              <p className="font-semibold">Bring with you</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                <li>This note, on your phone or printed.</li>
                <li>Your ID, or the ID of whoever is collecting for you.</li>
                <li>
                  If somebody else is collecting, tell us their name first — book
                  it on{" "}
                  <Link href="/portal/appointments" className="underline">
                    pickup appointments
                  </Link>
                  .
                </li>
              </ul>
            </Note>

            {/* The browser's own print of a mostly-white page with a large QR
                on it comes out scannable, which is the only requirement here. */}
            <div className="mt-4">
              <PrintButton label="Print this note" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
