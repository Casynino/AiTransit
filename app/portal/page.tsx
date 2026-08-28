import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Coins,
  MapPinned,
  MessageSquare,
  Package,
  Plane,
  Radar,
  Receipt,
  Store,
  Warehouse,
} from "lucide-react";

import { CargoTimeline } from "@/components/portal/cargo-timeline";
import { PortalHero } from "@/components/portal/portal-hero";
import { Empty, Metric, Note, Panel, Pill, RecordRow } from "@/components/portal/ui";
import { SHIPMENT_STATUS_META, storageStatus, STORAGE_POLICY } from "@/lib/constants";
import { formatDate, formatDateTime, formatRelative, toNumber } from "@/lib/format";
import { formatUsd } from "@/lib/money";
import { portalActivity, portalOverview, requireCustomer } from "@/lib/portal";
import { APPOINTMENT_KIND, CLAIM_TYPE, labelFor, CLAIM_LABEL } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "My AITRANSIT" };

/**
 * The customer's front page.
 *
 * IT ANSWERS FOUR QUESTIONS, IN THIS ORDER, and nothing else is above the fold:
 * where is my cargo, what do I owe, what is waiting on me, and what can I do
 * right now. Everything below that is context for those four.
 *
 * THE COUNTS ARE DERIVED, NEVER STORED. "Cargo in China" is shipments whose
 * status is READY_TO_DEPART; "in transit" is IN_TRANSIT; "in Zambia" is
 * RECEIVED_AT_ZAMBIA plus READY_FOR_PICKUP. Working them out here from the same
 * rows the internal system holds means a customer and a clerk on the telephone
 * are never looking at two different numbers — which is the whole reason this
 * portal reads the operational database rather than a copy of it.
 *
 * Drafts never appear: the query in lib/portal.ts excludes them, because a
 * draft is Finance's working figure and nobody owes it yet.
 */
export default async function PortalHome() {
  const viewer = await requireCustomer();
  const [{ shipments, invoices, customer }, activity] = await Promise.all([
    portalOverview(viewer.customerId),
    portalActivity(viewer.customerId, viewer.userId),
  ]);

  const live = shipments.filter(
    (s) => s.status !== "DELIVERED" && s.status !== "CANCELLED"
  );
  const inChina = live.filter((s) => s.status === "READY_TO_DEPART");
  const inTransit = live.filter((s) => s.status === "IN_TRANSIT");
  const inZambia = live.filter(
    (s) => s.status === "RECEIVED_AT_ZAMBIA" || s.status === "READY_FOR_PICKUP"
  );
  const ready = live.filter((s) => s.status === "READY_FOR_PICKUP");

  const outstanding = invoices.reduce((sum, invoice) => {
    if (["PAID", "VOID", "WRITTEN_OFF"].includes(invoice.status)) return sum;
    return sum + (toNumber(invoice.total) - toNumber(invoice.amountPaid));
  }, 0);

  /* Cargo whose free week has run out, or runs out today. */
  const storageWarnings = shipments
    .map((s) => ({ s, storage: storageStatus(s.arrivedAt, s.deliveredAt) }))
    .filter(({ storage }) => storage.expired || storage.lastFreeDay);

  const overdue = invoices.filter(
    (i) =>
      !["PAID", "VOID", "WRITTEN_OFF"].includes(i.status) &&
      i.dueDate &&
      i.dueDate < new Date()
  );

  /* The one consignment worth showing a timeline for: the furthest along that
     has not been collected. A customer with one box wants to see that box. */
  const focus =
    ready[0] ?? inZambia[0] ?? inTransit[0] ?? inChina[0] ?? null;

  return (
    <div className="space-y-10">
      {/* ────────────────────────────────────────────────────────── the band */}
      <PortalHero
        eyebrow="Your account"
        code={viewer.code}
        title={`Hello, ${viewer.name.split(" ")[0]}`}
        lede={
          /*
            THE PORTFOLIO, NOT THE URGENCY.

            This first said "1 consignment is ready to collect" — which the
            copper figure in the band already says, and which the green note
            directly below then said a third time WITH the tracking number. One
            screen, three sentences, one fact. The band states the shape of the
            account; the notes underneath carry what needs doing, because only
            they can name the consignment it needs doing to.
          */
          live.length > 0
            ? `${live.length} consignment${live.length === 1 ? "" : "s"} on the move. We will tell you the moment anything changes.`
            : "Nothing in motion right now. Quote your account number when you send cargo to our China warehouse."
        }
        facts={[
          {
            label: "On the move",
            value: String(live.length),
            hint: `${shipments.length} in total`,
            href: "/portal/cargo",
          },
          {
            label: "Ready to collect",
            value: String(ready.length),
            hint: ready.length ? "Bring your pickup note" : "Nothing waiting",
            href: "/portal/cargo?status=READY_FOR_PICKUP",
            accent: ready.length > 0,
          },
          {
            label: "Total due",
            value: formatUsd(outstanding),
            hint: overdue.length
              ? `${overdue.length} overdue`
              : outstanding > 0
                ? "Not yet overdue"
                : "Nothing outstanding",
            href: "/portal/invoices",
            accent: outstanding > 0,
          },
          {
            label: "Needs you",
            value: String(activity.openClaims.length + overdue.length),
            hint:
              activity.openClaims.length + overdue.length > 0
                ? "Issues and overdue bills"
                : "Nothing waiting on you",
            href: activity.openClaims.length ? "/portal/claims" : "/portal/invoices",
            accent: activity.openClaims.length + overdue.length > 0,
          },
        ]}
        actions={[
          { href: "/portal/track", label: "Track cargo", icon: Radar, primary: true },
          ...(outstanding > 0
            ? [{ href: "/portal/invoices", label: "Pay an invoice", icon: Receipt }]
            : []),
          ...(ready.length > 0
            ? [
                {
                  href: "/portal/appointments",
                  label: "Book a pickup",
                  icon: CalendarClock,
                },
              ]
            : []),
          { href: "/portal/support", label: "Talk to us", icon: MessageSquare },
        ]}
      />

      {/* ─────────────────────────────────────────────── what needs doing now */}
      {(overdue.length > 0 || storageWarnings.length > 0 || ready.length > 0) && (
        <div className="space-y-3">
          {ready.length > 0 ? (
            <Note tone="emerald" title={`${ready.length} ready to collect`}>
              {ready.map((s) => s.trackingNumber).join(", ")} — waiting at our Makeni
              warehouse.{" "}
              <Link href="/portal/appointments" className="font-semibold underline">
                Book a pickup
              </Link>
            </Note>
          ) : null}

          {overdue.length > 0 ? (
            <Note tone="amber" title={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"} past due`}>
              {overdue.map((i) => i.invoiceNumber).join(", ")}.{" "}
              <Link href="/portal/invoices" className="font-semibold underline">
                Pay or send proof
              </Link>
            </Note>
          ) : null}

          {storageWarnings.length > 0 ? (
            <Note
              tone="amber"
              title={
                storageWarnings.some((w) => w.storage.expired)
                  ? "Storage is being charged"
                  : "Free storage ends today"
              }
            >
              {storageWarnings.map(({ s, storage }) => (
                <span key={s.id} className="mr-3 inline-block">
                  <span className="ai-num font-semibold">{s.trackingNumber}</span> —{" "}
                  {storage.expired
                    ? `${storage.chargeableDays} chargeable day${storage.chargeableDays === 1 ? "" : "s"} (${formatUsd(storage.chargeUsd)})`
                    : "last free day"}
                </span>
              ))}
              <span className="mt-1 block text-xs">
                Storage is free for {STORAGE_POLICY.freeDays} days, then{" "}
                {formatUsd(STORAGE_POLICY.perDayUsd)} a day.
              </span>
            </Note>
          ) : null}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── the cargo */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
          Where your cargo is
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Metric
            icon={Store}
            label="In China"
            value={String(inChina.length)}
            hint="Waiting for a flight"
            href="/portal/cargo?status=READY_TO_DEPART"
          />
          <Metric
            icon={Plane}
            label="In transit"
            value={String(inTransit.length)}
            hint="In the air"
            href="/portal/cargo?status=IN_TRANSIT"
          />
          <Metric
            icon={Warehouse}
            label="In Zambia"
            value={String(inZambia.length)}
            hint="At our Makeni warehouse"
            href="/portal/cargo?status=RECEIVED_AT_ZAMBIA"
          />
          {/*
            Collected, not "ready to collect" — that one is in the band above,
            in copper, because it is the thing that needs doing. This row is the
            journey, and the last stop on it is the customer's hands.
          */}
          <Metric
            icon={CheckCircle2}
            label="Collected"
            value={String(shipments.filter((s) => s.deliveredAt).length)}
            hint="Handed over to you"
            href="/portal/cargo?status=DELIVERED"
          />
        </div>
      </section>

      {/*
        THE ACCOUNT ROW USED TO BE HERE and has gone into the band.

        It carried total due, storage charged, credit limit and open issues.
        The band now states total due and what needs doing, so two of the four
        were being read twice on one screen. The other two were not headline
        figures at all: storage is itemised on the invoice that charges it, and
        the credit facility belongs with the rest of the account on the profile
        page. Neither is something a customer opens the portal to find.
      */}
      {/* ────────────────────────────────────────────────────── quick actions */}
      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
          What would you like to do?
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Action href="/portal/track" icon={Radar} label="Track cargo" />
          <Action href="/portal/invoices" icon={Receipt} label="Pay an invoice" />
          <Action href="/portal/appointments" icon={CalendarClock} label="Book a pickup" />
          <Action
            href="/portal/supplier-payments"
            icon={Banknote}
            label="Pay a China supplier"
          />
          <Action href="/portal/exchange" icon={Coins} label="Book money exchange" />
          <Action href="/portal/visits" icon={MapPinned} label="Book a China visit" />
          <Action href="/portal/china" icon={Store} label="Request a China service" />
          <Action href="/portal/support" icon={MessageSquare} label="Contact support" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* ────────────────────────────────────────────── the focused shipment */}
        <div className="space-y-6">
          {focus ? (
            <Panel
              title="Your latest cargo"
              action={
                <Link
                  href={`/portal/cargo/${focus.id}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                >
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            >
              <div className="mb-5">
                <p className="ai-num text-lg font-bold">{focus.trackingNumber}</p>
                <p className="ai-muted text-sm">{focus.description}</p>
              </div>
              <CargoTimeline
                input={{
                  registeredAt: focus.createdAt,
                  batchNumber: focus.batch?.batchNumber ?? null,
                  departedAt: null,
                  arrivedAt: focus.arrivedAt,
                  readyForPickup: focus.readyForPickup,
                  deliveredAt: focus.deliveredAt,
                  invoiceConfirmedAt: focus.invoice?.confirmedAt ?? null,
                  invoicePaidAt:
                    focus.invoice && toNumber(focus.invoice.amountPaid) > 0
                      ? focus.invoice.confirmedAt
                      : null,
                  creditApproved: focus.invoice?.creditStatus === "APPROVED",
                  expectedArrival: null,
                }}
              />
            </Panel>
          ) : (
            <Empty
              icon={Package}
              title="No cargo yet"
              body="Once we register cargo for you in China it appears here, and you can follow it all the way to Lusaka."
              action={
                <Link href="/portal/china" className="ai-btn ai-btn-primary">
                  Ask us about shipping
                </Link>
              }
            />
          )}

          {/* ──────────────────────────────────────────────── activity feed */}
          <Panel title="Recent activity">
            {activity.recentMoves.length === 0 ? (
              <p className="ai-muted text-sm">Nothing has moved yet.</p>
            ) : (
              <ul className="space-y-3">
                {activity.recentMoves.map((move) => (
                  <li key={move.id} className="flex items-start gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "hsl(var(--ai-emerald))" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <Link
                          href={`/portal/cargo/${move.shipment.id}`}
                          className="ai-num font-semibold underline-offset-2 hover:underline"
                        >
                          {move.shipment.trackingNumber}
                        </Link>{" "}
                        —{" "}
                        {SHIPMENT_STATUS_META[move.toStatus]?.publicLabel ??
                          move.toStatus}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {formatRelative(move.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ───────────────────────────────────────────────────── right column */}
        <div className="space-y-6">
          <Panel title="Coming up">
            <div className="space-y-4">
              {activity.nextPickup ? (
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarClock
                      className="h-4 w-4"
                      style={{ color: "hsl(var(--ai-emerald))" }}
                    />
                    <span className="text-sm font-semibold">Cargo pickup</span>
                  </div>
                  <p className="ai-num mt-1 text-sm">
                    {formatDate(
                      activity.nextPickup.confirmedFor ??
                        activity.nextPickup.preferredDate
                    )}
                    {activity.nextPickup.preferredTime
                      ? ` · ${activity.nextPickup.preferredTime}`
                      : ""}
                  </p>
                  <p className="ai-muted text-xs">
                    {activity.nextPickup.shipment?.trackingNumber ?? "—"} ·{" "}
                    {activity.nextPickup.reference}
                  </p>
                </div>
              ) : null}

              {activity.nextVisit ? (
                <div>
                  <div className="flex items-center gap-2">
                    <MapPinned
                      className="h-4 w-4"
                      style={{ color: "hsl(var(--ai-emerald))" }}
                    />
                    <span className="text-sm font-semibold">
                      {APPOINTMENT_KIND[activity.nextVisit.kind] ??
                        activity.nextVisit.kind}
                    </span>
                  </div>
                  <p className="ai-num mt-1 text-sm">
                    {formatDate(
                      activity.nextVisit.confirmedFor ??
                        activity.nextVisit.preferredDate
                    )}
                  </p>
                  <p className="ai-muted text-xs">
                    {activity.nextVisit.locationName ?? "—"} ·{" "}
                    {activity.nextVisit.reference}
                  </p>
                </div>
              ) : null}

              {!activity.nextPickup && !activity.nextVisit ? (
                <p className="ai-muted text-sm">
                  Nothing booked. You can book a cargo pickup once cargo is ready,
                  or a China visit any time.
                </p>
              ) : null}
            </div>
          </Panel>

          {activity.openClaims.length > 0 ? (
            <Panel title="Open issues">
              <ul className="space-y-3">
                {activity.openClaims.map((claim) => {
                  const meta = labelFor(CLAIM_LABEL, claim.status);
                  return (
                    <li key={claim.id}>
                      <Link
                        href={`/portal/claims/${claim.id}`}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {CLAIM_TYPE[claim.type] ?? claim.type}
                          </span>
                          <span
                            className="ai-num block text-xs"
                            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                          >
                            {claim.shipment.trackingNumber}
                          </span>
                        </span>
                        <Pill tone={meta.tone}>{meta.label}</Pill>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}

          <Panel
            title="Notifications"
            action={
              <Link
                href="/portal/notifications"
                className="text-sm font-semibold"
                style={{ color: "hsl(var(--ai-emerald))" }}
              >
                All
              </Link>
            }
          >
            {activity.notifications.length === 0 ? (
              <p className="ai-muted text-sm">
                Nothing yet. We will tell you here when your cargo moves, an
                invoice is raised or a request is answered.
              </p>
            ) : (
              <ul className="space-y-3">
                {activity.notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        background: n.readAt
                          ? "hsl(var(--ai-stone-3))"
                          : "hsl(var(--ai-copper-fill))",
                      }}
                    />
                    <div className="min-w-0">
                      <p className={`text-sm ${n.readAt ? "" : "font-semibold"}`}>
                        {n.href ? (
                          <Link href={n.href} className="hover:underline">
                            {n.title}
                          </Link>
                        ) : (
                          n.title
                        )}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {formatRelative(n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Action({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Package;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[var(--ai-radius-lg)] border p-4 text-sm font-semibold transition-colors"
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-white))",
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--ai-emerald))" }} />
      <span className="min-w-0 flex-1">{label}</span>
      <ArrowRight
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      />
    </Link>
  );
}
