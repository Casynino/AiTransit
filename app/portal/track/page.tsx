import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Radar, Search } from "lucide-react";

import { CargoTimeline } from "@/components/portal/cargo-timeline";
import { Empty, Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import {
  COMPANY,
  SHIPMENT_STATUS_META,
  storageStatus,
  STORAGE_POLICY,
} from "@/lib/constants";
import { formatDate, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { requireCustomer } from "@/lib/portal";
import { listCargo } from "@/lib/portal-data";

export const metadata: Metadata = { title: "Track cargo — AITRANSIT" };

/**
 * Tracking, inside the portal.
 *
 * DIFFERENT FROM /track ON THE PUBLIC SITE, and worth having as well as it.
 * The public page answers one tracking number for anybody holding it and shows
 * only what a stranger may see. This one knows who is asking: it defaults to
 * their own live cargo, shows the storage clock and the money position beside
 * the timeline, and gives the warehouse address only when the cargo is actually
 * collectable.
 *
 * The picker is a plain link list rather than a search box with an id in it.
 * Most customers have one to five live consignments, and choosing from a list
 * of your own is faster than typing AT-000123 correctly.
 */
export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireCustomer();
  const sp = await searchParams;
  const wanted = typeof sp.id === "string" ? sp.id : undefined;

  const { rows } = await listCargo(viewer.customerId, {});

  const live = rows.filter(
    (r) => r.status !== "DELIVERED" && r.status !== "CANCELLED"
  );

  /*
    The chosen consignment, matched by id OR tracking number so a link from
    anywhere works. `rows` is already the customer's own cargo, so this is a
    find over data that was scoped by the database — there is nothing here that
    could resolve to somebody else's box.
  */
  const cargo =
    (wanted
      ? rows.find(
          (r) =>
            r.id === wanted ||
            r.trackingNumber.toUpperCase() === wanted.toUpperCase()
        )
      : null) ??
    live[0] ??
    rows[0] ??
    null;

  if (!cargo) {
    return (
      <div>
        <PageHead title="Track cargo" />
        <Empty
          icon={Radar}
          title="Nothing to track yet"
          body="Once we register cargo for you in China you can follow it here, step by step, all the way to Lusaka."
          action={
            <Link href="/portal/china" className="ai-btn ai-btn-primary">
              Ask us about shipping
            </Link>
          }
        />
      </div>
    );
  }

  const meta = SHIPMENT_STATUS_META[cargo.status];
  const storage = storageStatus(cargo.arrivedAt, cargo.deliveredAt);
  const invoice = cargo.invoice;
  const owed = invoice ? toNumber(invoice.total) - toNumber(invoice.amountPaid) : 0;
  const ready = cargo.status === "READY_FOR_PICKUP";

  const latest = [...(cargo.batch ? [cargo.batch] : [])];

  return (
    <div>
      <PageHead
        title="Track cargo"
        lede="Choose a consignment to see exactly where it is and what happens next."
      />

      {/* ─────────────────────────────────────────────────────────── the picker */}
      {rows.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {rows.slice(0, 12).map((r) => {
            const active = r.id === cargo.id;
            return (
              <Link
                key={r.id}
                href={`/portal/track?id=${r.id}`}
                className="ai-num rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors"
                style={
                  active
                    ? {
                        background: "hsl(var(--ai-emerald))",
                        borderColor: "hsl(var(--ai-emerald))",
                        color: "white",
                      }
                    : {
                        borderColor: "hsl(var(--ai-stone-3))",
                        background: "hsl(var(--ai-white))",
                      }
                }
              >
                {r.trackingNumber}
              </Link>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel>
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="ai-num text-xl font-bold">{cargo.trackingNumber}</p>
              <p className="ai-muted text-sm">{cargo.description}</p>
            </div>
            <Pill tone={ready ? "emerald" : "amber"}>
              {meta?.publicLabel ?? cargo.status}
            </Pill>
          </div>

          {/* The one-line answer, before the timeline. */}
          <div
            className="mb-6 rounded-[var(--ai-radius)] px-4 py-3"
            style={{ background: "hsl(var(--ai-stone-2))" }}
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em]" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
              Latest update
            </p>
            <p className="mt-1 font-semibold">
              {meta?.description ?? meta?.publicLabel ?? cargo.status}
            </p>
            <p className="ai-muted mt-0.5 text-sm">
              Currently at {meta?.publicLocation ?? "—"}
              {cargo.batch ? ` · ${cargo.batch.batchNumber}` : ""}
            </p>
          </div>

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

        <div className="space-y-6">
          {/*
            THE WAREHOUSE ADDRESS APPEARS ONLY WHEN THE CARGO IS COLLECTABLE.
            Showing it earlier invites somebody to travel to Makeni for a box
            that is still in Guangzhou, which is the commonest wasted journey
            this business causes.
          */}
          {ready ? (
            <Panel title="Where to collect it">
              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                />
                <div className="text-sm">
                  <p className="font-semibold">{COMPANY.name}</p>
                  <p className="ai-muted whitespace-pre-line">
                    {COMPANY.zambiaAddress}
                  </p>
                  {COMPANY.phone ? (
                    <p className="ai-num mt-1">{COMPANY.phone}</p>
                  ) : null}
                </div>
              </div>
              <Link
                href="/portal/appointments"
                className="ai-btn ai-btn-primary mt-4 w-full"
              >
                Book a pickup time
              </Link>
              {cargo.pickupNote ? (
                <Link
                  href={`/portal/pickup-notes/${cargo.pickupNote.id}`}
                  className="ai-btn ai-btn-outline mt-2 w-full"
                >
                  Open pickup note
                </Link>
              ) : null}
            </Panel>
          ) : (
            <Note>
              We will show the collection address here as soon as your cargo is
              cleared and ready. Nothing to travel for yet.
            </Note>
          )}

          <Panel title="Storage">
            {cargo.arrivedAt ? (
              <dl className="space-y-3">
                <Field label="In the warehouse since">
                  {formatDate(cargo.arrivedAt)}
                </Field>
                <Field label="Days so far">{String(storage.daysInWarehouse)}</Field>
                <Field label="Position">
                  {storage.collected
                    ? "Collected — the clock has stopped"
                    : storage.expired
                      ? `${storage.chargeableDays} chargeable day(s) · ${formatUsd(storage.chargeUsd)}`
                      : `${storage.freeDaysRemaining} free day(s) left`}
                </Field>
              </dl>
            ) : (
              <p className="ai-muted text-sm">
                Storage starts when your cargo is checked in at Lusaka. Free for{" "}
                {STORAGE_POLICY.freeDays} days, then{" "}
                {formatUsd(STORAGE_POLICY.perDayUsd)} a day.
              </p>
            )}
          </Panel>

          <Panel title="Can you collect it?">
            {ready ? (
              <p className="text-sm" style={{ color: "hsl(var(--ai-emerald))" }}>
                Yes. Bring your pickup note and ID.
              </p>
            ) : !invoice ? (
              <p className="ai-muted text-sm">
                Not yet — your cargo has not been priced. Nothing is owed until
                Finance confirms an invoice.
              </p>
            ) : owed > 0.005 && invoice.creditStatus !== "APPROVED" ? (
              <>
                <p className="ai-muted text-sm">
                  Not yet. {formatUsd(owed)} is outstanding on{" "}
                  {invoice.invoiceNumber}.
                </p>
                <Link
                  href={`/portal/invoices/${invoice.id}`}
                  className="ai-btn ai-btn-primary mt-3 w-full"
                >
                  Pay or send proof
                </Link>
              </>
            ) : (
              <p className="ai-muted text-sm">
                Not yet — your cargo has not reached the Lusaka warehouse.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
