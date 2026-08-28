import {
  Check,
  CircleDashed,
  Handshake,
  PackageCheck,
  PackageSearch,
  Plane,
  PlaneTakeoff,
  Receipt,
  Warehouse,
} from "lucide-react";

import { Pill } from "@/components/portal/ui";
import { formatDateTime } from "@/lib/format";

/**
 * Where one consignment has got to, as ten steps.
 *
 * THE STEPS ARE NOT THE DATABASE STATUSES. Shipment has five states in its
 * flow; a customer's journey has ten moments, and the extra five are things
 * that happen to the invoice and the pickup note rather than to the box. From
 * where they stand "invoice confirmed" and "arrived in Lusaka" are equally
 * events in the life of their cargo, and a timeline that shows only the cargo's
 * own statuses leaves them wondering why nothing has moved for four days when
 * what is actually happening is that they have not paid.
 *
 * So each step below is derived from a DATE, not from the current status. A
 * status says where the cargo is now; a date says when it got there, and the
 * customer wants both. Steps with no date yet are drawn as pending, which also
 * means the timeline reads correctly for cargo that skipped a step — nothing is
 * ever shown as done because a later thing happened.
 */

export type TimelineInput = {
  registeredAt: Date | null;
  batchNumber: string | null;
  departedAt: Date | null;
  arrivedAt: Date | null;
  readyForPickup: Date | null;
  deliveredAt: Date | null;
  invoiceConfirmedAt: Date | null;
  invoicePaidAt: Date | null;
  /** APPROVED credit counts as settled for the purpose of releasing cargo. */
  creditApproved: boolean;
  expectedArrival: Date | null;
};

type Step = {
  key: string;
  label: string;
  detail: string;
  icon: typeof Check;
  at: Date | null;
  /** Shown under a step that has not happened, when we can say something useful. */
  pendingNote?: string;
};

export function buildSteps(c: TimelineInput): Step[] {
  return [
    {
      key: "received",
      label: "Received in China",
      detail: "Registered, weighed and labelled at our warehouse.",
      icon: PackageSearch,
      at: c.registeredAt,
    },
    {
      key: "batched",
      label: "Assigned to a flight",
      detail: c.batchNumber
        ? `On loading table ${c.batchNumber}.`
        : "Waiting for the next flight out.",
      icon: PackageCheck,
      /*
        A batch number is not a date, but being placed on one is an event the
        customer can see happen. Registration is the closest honest timestamp we
        hold for it — the alternative is a step that is permanently pending for
        cargo that is demonstrably on a batch.
      */
      at: c.batchNumber ? c.registeredAt : null,
      pendingNote: "Cargo flies once there is enough for a flight.",
    },
    {
      key: "dispatched",
      label: "Dispatched",
      detail: "Loaded and left the Guangzhou or Hong Kong warehouse.",
      icon: PlaneTakeoff,
      at: c.departedAt,
    },
    {
      key: "transit",
      label: "In transit",
      detail: "In the air between China and Zambia.",
      icon: Plane,
      at: c.departedAt,
      pendingNote: c.expectedArrival
        ? `Expected ${formatDateTime(c.expectedArrival)}`
        : undefined,
    },
    {
      key: "arrived",
      label: "Arrived in Zambia",
      detail: "Landed in Lusaka.",
      icon: Warehouse,
      at: c.arrivedAt,
    },
    {
      key: "checkedin",
      label: "Checked in at Lusaka",
      detail: "Weighed on our own scale and booked into the warehouse.",
      icon: PackageCheck,
      /*
        Check-in and arrival share a timestamp: `arrivedAt` is written by the
        Lusaka warehouse at the moment it books the cargo in, not when the plane
        landed. They are two steps rather than one because the customer's
        storage clock starts here, and merging them would hide that.
      */
      at: c.arrivedAt,
    },
    {
      key: "invoiced",
      label: "Invoice confirmed",
      detail: "Priced and confirmed by Finance.",
      icon: Receipt,
      at: c.invoiceConfirmedAt,
      pendingNote: "Nothing is owed until an invoice is confirmed.",
    },
    {
      key: "settled",
      label: c.creditApproved ? "Credit approved" : "Payment received",
      detail: c.creditApproved
        ? "Approved to collect now and pay later."
        : "Payment matched to your invoice by Finance.",
      icon: Handshake,
      at: c.invoicePaidAt,
    },
    {
      key: "ready",
      label: "Ready for pickup",
      detail: "Collectable from our Makeni warehouse.",
      icon: PackageCheck,
      at: c.readyForPickup,
    },
    {
      key: "collected",
      label: "Collected",
      detail: "Handed over and signed for.",
      icon: Check,
      at: c.deliveredAt,
    },
  ];
}

export function CargoTimeline({ input }: { input: TimelineInput }) {
  const steps = buildSteps(input);
  /*
    The last step with a date is where they are NOW. Everything after it is
    pending — even if a later step somehow has a date, which would mean the
    record is inconsistent and is better shown honestly than tidied over.
  */
  const lastDone = steps.reduce((last, s, i) => (s.at ? i : last), -1);

  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const done = Boolean(step.at);
        const current = i === lastDone;
        const Icon = done ? step.icon : CircleDashed;
        const last = i === steps.length - 1;

        const colour = done
          ? current
            ? "hsl(var(--ai-emerald))"
            : "hsl(var(--ai-charcoal))"
          : "hsl(var(--ai-charcoal-soft))";

        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {/* The rail. Drawn behind the marker, stopping at the last step. */}
            {!last ? (
              <span
                aria-hidden
                className="absolute left-[0.9375rem] top-8 bottom-0 w-px"
                style={{
                  background: done
                    ? "hsl(var(--ai-emerald) / 0.4)"
                    : "hsl(var(--ai-stone-3))",
                }}
              />
            ) : null}

            <span
              className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
              style={{
                borderColor: done
                  ? "hsl(var(--ai-emerald))"
                  : "hsl(var(--ai-stone-3))",
                background: current
                  ? "hsl(var(--ai-emerald))"
                  : "hsl(var(--ai-white))",
                color: current ? "white" : colour,
              }}
            >
              <Icon className="h-4 w-4" />
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold" style={{ color: colour }}>
                  {step.label}
                </span>
                {current ? <Pill tone="emerald">Now</Pill> : null}
              </div>

              <p className="mt-0.5 text-sm" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                {done ? step.detail : (step.pendingNote ?? step.detail)}
              </p>

              {step.at ? (
                <p className="ai-num mt-1 text-xs" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                  {formatDateTime(step.at)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
