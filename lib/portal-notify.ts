import "server-only";

import { notifyCustomer } from "@/lib/notify";
import type { TxClient } from "@/lib/prisma";

/**
 * The events a customer is told about, written once each.
 *
 * WHY A MODULE OF ITS OWN. These messages are the only writing in the system a
 * customer reads without asking for it, and they were going to be composed
 * inline at a dozen call sites across finance, batches, credit and the
 * investigation queue. Composed inline they drift: the same event gets three
 * wordings, one of them says "Dar es Salaam", and the day somebody wants to
 * stop notifying on a step there is no list of what is notified.
 *
 * WHAT MAKES A GOOD ONE, and the rule every message below follows: say what
 * happened, name the thing it happened to, and link to where it can be acted
 * on. A notification that says "Your cargo has been updated" is worse than no
 * notification, because it costs a tap to discover it was nothing.
 *
 * WHAT IS NOT NOTIFIED. Internal steps with no consequence for the customer —
 * a batch sealed, an invoice drafted, a claim assigned to somebody. A portal
 * that pings on every internal state change trains people to ignore it, and
 * the one message that mattered goes unread with the rest.
 *
 * Every function takes an optional transaction, because these are called from
 * inside the transaction that caused the event. A notification that says cargo
 * arrived, written outside the transaction that recorded the arrival, is a
 * notification that can survive a rollback.
 */

type Ctx = { customerId: string; tx?: TxClient };

/* ------------------------------------------------------------------- cargo */

export async function notifyCargoRegistered(
  ctx: Ctx,
  cargo: { id: string; trackingNumber: string; description: string }
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "cargo.registered",
      title: `Cargo received in China — ${cargo.trackingNumber}`,
      body: `We have registered ${cargo.description} at our China warehouse. It flies on the next available flight.`,
      href: `/portal/cargo/${cargo.id}`,
    },
    ctx.tx
  );
}

export async function notifyDispatched(
  ctx: Ctx,
  cargo: { id: string; trackingNumber: string },
  batchNumber: string
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "cargo.dispatched",
      title: `On its way — ${cargo.trackingNumber}`,
      body: `Your cargo has left China on ${batchNumber}.`,
      href: `/portal/cargo/${cargo.id}`,
    },
    ctx.tx
  );
}

/**
 * Arrival and check-in are one message, not two.
 *
 * They share a timestamp — `arrivedAt` is written when Lusaka books the cargo
 * in — so two notifications would arrive in the same second saying almost the
 * same thing. The storage clock is the part the customer needs, so it is here
 * rather than in a second ping they would ignore.
 */
export async function notifyArrived(
  ctx: Ctx,
  cargo: { id: string; trackingNumber: string },
  freeDays: number
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "cargo.arrived",
      title: `Landed in Lusaka — ${cargo.trackingNumber}`,
      body: `Checked in at our Makeni warehouse. Storage is free for ${freeDays} days from today.`,
      href: `/portal/cargo/${cargo.id}`,
    },
    ctx.tx
  );
}

export async function notifyReadyForPickup(
  ctx: Ctx,
  cargo: { id: string; trackingNumber: string },
  noteNumber?: string | null
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "cargo.ready",
      title: `Ready to collect — ${cargo.trackingNumber}`,
      body: noteNumber
        ? `Pickup note ${noteNumber} has been issued. Bring it to the Makeni warehouse, on your phone or printed.`
        : "Your cargo is cleared and waiting at the Makeni warehouse.",
      href: `/portal/cargo/${cargo.id}`,
    },
    ctx.tx
  );
}

/* ---------------------------------------------------------------- invoices */

export async function notifyInvoiceConfirmed(
  ctx: Ctx,
  invoice: { id: string; invoiceNumber: string; total: string; currency: string },
  trackingNumber: string
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "invoice.confirmed",
      title: `Invoice ${invoice.invoiceNumber} — ${invoice.currency} ${invoice.total}`,
      body: `Your cargo ${trackingNumber} has been priced. You can see the breakdown and pay from your invoices.`,
      href: `/portal/invoices/${invoice.id}`,
    },
    ctx.tx
  );
}

export async function notifyPaymentConfirmed(
  ctx: Ctx,
  invoice: { id: string; invoiceNumber: string },
  amount: string,
  currency: string,
  settled: boolean
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "payment.confirmed",
      title: `Payment received — ${currency} ${amount}`,
      body: settled
        ? `Invoice ${invoice.invoiceNumber} is now settled in full. Thank you.`
        : `Applied to invoice ${invoice.invoiceNumber}. A balance is still outstanding.`,
      href: `/portal/invoices/${invoice.id}`,
    },
    ctx.tx
  );
}

export async function notifyCreditDecision(
  ctx: Ctx,
  invoice: { id: string; invoiceNumber: string },
  approved: boolean,
  note?: string | null
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: approved ? "credit.approved" : "credit.rejected",
      title: approved
        ? `Credit approved — ${invoice.invoiceNumber}`
        : `Credit not approved — ${invoice.invoiceNumber}`,
      body: approved
        ? "You can collect this cargo now and pay by the agreed date."
        : (note ??
          "Payment is needed before this cargo can be collected. Please speak to Finance."),
      href: `/portal/invoices/${invoice.id}`,
    },
    ctx.tx
  );
}

/* ---------------------------------------------------------------- requests */

export async function notifyAppointmentDecision(
  ctx: Ctx,
  appt: { id: string; reference: string; status: string },
  when?: Date | null
) {
  const confirmed = appt.status === "CONFIRMED";
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "appointment.updated",
      title: confirmed
        ? `Booking confirmed — ${appt.reference}`
        : `Booking updated — ${appt.reference}`,
      body:
        confirmed && when
          ? `We will see you on ${when.toISOString().slice(0, 10)}.`
          : `Your booking is now "${appt.status.toLowerCase()}". Open it for the details.`,
      href: "/portal/appointments",
    },
    ctx.tx
  );
}

export async function notifyExchangeUpdate(
  ctx: Ctx,
  req: { id: string; reference: string; status: string },
  detail?: string | null
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "exchange.updated",
      title: `Money exchange ${req.reference} — ${req.status.replace(/_/g, " ").toLowerCase()}`,
      body: detail ?? "Open the request to see what changed.",
      href: `/portal/exchange/${req.id}`,
    },
    ctx.tx
  );
}

export async function notifySupplierPaymentUpdate(
  ctx: Ctx,
  payment: { reference: string; status: string; supplierName: string },
  detail?: string | null
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "supplierPayment.updated",
      title: `Supplier payment ${payment.reference} — ${payment.status.toLowerCase()}`,
      body: detail ?? `For ${payment.supplierName}.`,
      href: "/portal/supplier-payments",
    },
    ctx.tx
  );
}

export async function notifySourcingUpdate(
  ctx: Ctx,
  req: { id: string; requestNumber: string; status: string },
  detail?: string | null
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "china.updated",
      title: `Request ${req.requestNumber} — ${req.status.replace(/_/g, " ").toLowerCase()}`,
      body: detail ?? "Open the request to see what we found.",
      href: `/portal/china/${req.id}`,
    },
    ctx.tx
  );
}

/* -------------------------------------------------------- claims & support */

export async function notifyClaimUpdate(
  ctx: Ctx,
  claim: { id: string; status: string },
  trackingNumber: string,
  detail?: string | null
) {
  await notifyCustomer(
    ctx.customerId,
    {
      kind: "claim.updated",
      title: `Claim on ${trackingNumber} — ${claim.status.replace(/_/g, " ").toLowerCase()}`,
      body: detail ?? "Open the claim to read the latest.",
      href: `/portal/claims/${claim.id}`,
    },
    ctx.tx
  );
}

export async function notifySupportReply(
  ctx: Ctx,
  ticket: { id: string; ticketNumber: string; subject: string }
) {
  await notifyCustomer(ctx.customerId, {
    kind: "support.replied",
    title: `We have replied — ${ticket.ticketNumber}`,
    body: ticket.subject,
    href: `/portal/support/${ticket.id}`,
  });
}
