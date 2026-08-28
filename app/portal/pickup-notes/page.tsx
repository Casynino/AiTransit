import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { Empty, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { formatPackages } from "@/lib/constants";
import { formatDate, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listPickupNotes } from "@/lib/portal-data";
import { labelFor, PICKUP_NOTE_LABEL } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Pickup notes — AITRANSIT" };

/**
 * The documents that let cargo leave the counter.
 *
 * A pickup note is issued by Finance when a bill is settled or credit is
 * approved — never by this portal. Everything here is read-only for that
 * reason: the note is our authorisation to release goods, and a customer who
 * could create one could walk out with somebody's cargo.
 */
export default async function PickupNotesPage() {
  const viewer = await requireCustomer();
  const notes = await listPickupNotes(viewer.customerId);

  const active = notes.filter((n) => n.status === "ACTIVE");

  return (
    <div>
      <PageHead
        title="Pickup notes"
        lede="Your authorisation to collect. Show one at the counter — on your phone or printed."
      />

      {notes.length === 0 ? (
        <Empty
          icon={ScrollText}
          title="No pickup notes yet"
          body="We issue one automatically when your invoice is settled, or when credit is approved. It will appear here and you will be notified."
          action={
            <Link href="/portal/cargo" className="ai-btn ai-btn-outline">
              See my cargo
            </Link>
          }
        />
      ) : (
        <>
          {active.length > 0 ? (
            <p className="ai-muted mb-4 text-sm">
              {active.length} ready to use.
            </p>
          ) : null}

          <div className="space-y-3">
            {notes.map((note) => {
              const meta = labelFor(PICKUP_NOTE_LABEL, note.status);
              return (
                <RecordRow
                  key={note.id}
                  href={`/portal/pickup-notes/${note.id}`}
                  title={<span className="ai-num">{note.noteNumber}</span>}
                  subtitle={
                    <>
                      {note.shipment.trackingNumber} — {note.shipment.description}
                    </>
                  }
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    {
                      label: "Pieces",
                      value: formatPackages(
                        note.shipment.packages,
                        note.shipment.packageType
                      ),
                    },
                    {
                      label: "Paid",
                      value: `${note.currency} ${toNumber(note.amountPaid).toFixed(2)}`,
                    },
                    { label: "Issued", value: formatDate(note.issuedAt) },
                    ...(note.usedAt
                      ? [{ label: "Collected", value: formatDate(note.usedAt) }]
                      : []),
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
