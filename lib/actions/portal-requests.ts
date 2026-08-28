"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import {
  nextAppointmentReference,
  nextExchangeReference,
  nextSourcingNumber,
} from "@/lib/ids";
import { requireCustomer } from "@/lib/portal";
import { prisma } from "@/lib/prisma";
import { putDocument } from "@/lib/storage";
import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";

/**
 * Everything a customer ASKS FOR, from the portal.
 *
 * FOUR RULES HOLD FOR EVERY ACTION IN THIS FILE, and they are the reason a
 * customer-writable surface is safe to expose at all.
 *
 *   1. THE CUSTOMER ID COMES FROM THE SESSION, never from the form. Any id in
 *      a form — a cargo id, an invoice id, an appointment id — is treated as a
 *      claim about ownership and re-checked against the session before it is
 *      used. Forms are typed by whoever is holding the browser.
 *
 *   2. A REQUEST IS NOT A DECISION. Every row written here lands in the status
 *      that means "somebody at AITRANSIT has not looked at this yet" —
 *      REQUESTED, NEW, OPEN — and nothing here writes a status that would mean
 *      we have agreed to something. A customer can ask to collect cargo on
 *      Tuesday; only the warehouse can confirm Tuesday.
 *
 *   3. NOTHING HERE TOUCHES MONEY. No Payment, no LedgerEntry, no invoice
 *      balance, no exchange rate. The money-shaped things a customer can do —
 *      submit proof of payment, ask for a supplier to be paid, book an exchange
 *      — all write a REQUEST that Finance acts on. See the payment-proof action
 *      in portal.ts, which is the same shape.
 *
 *   4. THE CUSTOMER'S OWN WORDS ARE KEPT AS THEY WROTE THEM. Requests are
 *      evidence of what somebody wanted. What we decide goes in the staff
 *      fields beside it, never over the top of it.
 *
 * These all land in queues the internal portals already work — Appointment,
 * ExchangeRequest, SourcingRequest — rather than in tables invented for the
 * portal. A second inbox for the same desk is a second inbox somebody forgets
 * to open.
 */

/* ------------------------------------------------------------------ shared */

/** An optional file field on a form, stored if present. */
async function attachment(formData: FormData, field: string, folder: string) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  const stored = await putDocument(file, folder);
  return { url: stored.url, name: file.name };
}

const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v?.length ? v : null));

const money = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: `${label} does not look right.`,
    });

/**
 * A date the customer asked for, which must be in the future.
 *
 * Checked against today at midnight rather than against `now`, so somebody
 * booking at four in the afternoon for "today" is not told their date is in the
 * past. The desk can still refuse it; that is the desk's call, not a validator's.
 */
const futureDate = z
  .string()
  .trim()
  .min(1, "Choose a date.")
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), { message: "That date is not valid." })
  .refine(
    (d) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    },
    { message: "Choose a date from today onwards." }
  );

/* ---------------------------------------------------- 1. pickup appointment */

const pickupSchema = z.object({
  shipmentId: z.string().min(1, "Choose the cargo you are collecting."),
  preferredDate: futureDate,
  preferredTime: optionalText(40),
  contactName: z.string().trim().min(2, "Who is collecting?"),
  contactPhone: z.string().trim().min(9, "A phone number for the collector, please."),
  notes: optionalText(),
});

/**
 * "I would like to collect this on Tuesday."
 *
 * REFUSED UNLESS THE CARGO IS ACTUALLY COLLECTABLE. A booking against cargo
 * still in China is a booking the warehouse cannot keep, and letting it through
 * would mean a customer travelling to Makeni for a box that is over the Indian
 * Ocean. The check is `readyForPickup` on the cargo — the same field the
 * warehouse sets and the release desk reads — not the invoice's status, because
 * cargo released on approved credit is ready without being paid for.
 */
export async function bookPickup(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = pickupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const cargo = await prisma.shipment.findFirst({
      where: { id: input.shipmentId, customerId: viewer.customerId, deletedAt: null },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        readyForPickup: true,
        deliveredAt: true,
      },
    });
    if (!cargo) return fail("We cannot find that cargo on your account.");
    if (cargo.deliveredAt) {
      return fail(`${cargo.trackingNumber} has already been collected.`);
    }
    if (!cargo.readyForPickup) {
      return fail(
        `${cargo.trackingNumber} is not ready for collection yet. You can book once it shows as ready.`
      );
    }

    /* One live booking per consignment. Two people turning up for one box on
       two days is the warehouse's problem to sort out at the counter. */
    const existing = await prisma.appointment.findFirst({
      where: {
        customerId: viewer.customerId,
        shipmentId: cargo.id,
        kind: "CARGO_PICKUP",
        status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] },
      },
      select: { reference: true },
    });
    if (existing) {
      return fail(
        `You already have pickup booking ${existing.reference} open for this cargo.`
      );
    }

    const row = await prisma.$transaction(async (tx) =>
      tx.appointment.create({
        data: {
          reference: await nextAppointmentReference(tx),
          kind: "CARGO_PICKUP",
          status: "REQUESTED",
          customerId: viewer.customerId,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: viewer.email,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          visitors: 1,
          shipmentId: cargo.id,
          notes: input.notes,
        },
        select: { id: true, reference: true },
      })
    );

    await recordAudit({
      actor: null,
      action: "portal.pickupBooked",
      entity: "Appointment",
      entityId: row.id,
      summary: `${viewer.name} requested pickup ${row.reference} for ${cargo.trackingNumber}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/appointments");
    revalidatePath("/app/appointments");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* --------------------------------------------- 2. market / factory / visits */

const visitSchema = z.object({
  kind: z.enum([
    "SUPPLIER_VISIT",
    "FACTORY_VISIT",
    "MARKET_VISIT",
    "GOODS_INSPECTION",
    "SOURCING_HELP",
  ]),
  locationName: z.string().trim().min(2, "Which supplier, factory or market?"),
  locationAddress: optionalText(400),
  productType: optionalText(200),
  preferredDate: futureDate,
  preferredTime: optionalText(40),
  visitors: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v) : 1))
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 20, {
      message: "Between 1 and 20 visitors.",
    }),
  needsInterpreter: z
    .union([z.literal("on"), z.literal("true"), z.string()])
    .optional()
    .transform((v) => v === "on" || v === "true"),
  contactName: z.string().trim().min(2, "Who should we meet?"),
  contactPhone: z.string().trim().min(9, "A phone number, please."),
  budgetUsd: money("That budget"),
  notes: optionalText(),
});

/** A concierge booking in China: a supplier, a factory or a market. */
export async function bookVisit(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = visitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();
    const doc = await attachment(formData, "document", "visit");

    const row = await prisma.$transaction(async (tx) =>
      tx.appointment.create({
        data: {
          reference: await nextAppointmentReference(tx),
          kind: input.kind,
          status: "REQUESTED",
          customerId: viewer.customerId,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: viewer.email,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          visitors: input.visitors,
          locationName: input.locationName,
          locationAddress: input.locationAddress,
          productType: input.productType,
          needsInterpreter: input.needsInterpreter,
          budgetUsd: input.budgetUsd,
          notes: input.notes,
          documentUrl: doc?.url ?? null,
          documentName: doc?.name ?? null,
        },
        select: { id: true, reference: true },
      })
    );

    await recordAudit({
      actor: null,
      action: "portal.visitBooked",
      entity: "Appointment",
      entityId: row.id,
      summary: `${viewer.name} requested ${input.kind} ${row.reference} at ${input.locationName}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/visits");
    revalidatePath("/app/appointments");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* ------------------------------------------- 3. reschedule / cancel a booking */

const changeSchema = z.object({
  appointmentId: z.string().min(1),
  intent: z.enum(["RESCHEDULE", "CANCEL"]),
  preferredDate: z.string().trim().optional(),
  reason: z.string().trim().min(3, "Tell us why, briefly.").max(1000),
});

/**
 * "Can we move it, or can I cancel?"
 *
 * A CANCELLATION IS IMMEDIATE; A RESCHEDULE IS A REQUEST. Those are different
 * because they cost different things: nobody is inconvenienced by a customer
 * withdrawing, but a new date has to be one the warehouse or the Guangzhou desk
 * can actually keep, so it goes back to REQUESTED for somebody to confirm.
 *
 * Neither is possible once the appointment is COMPLETED. A visit that already
 * happened cannot be cancelled, and offering the button implies otherwise.
 */
export async function changeAppointment(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = changeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const appt = await prisma.appointment.findFirst({
      where: { id: input.appointmentId, customerId: viewer.customerId },
      select: { id: true, reference: true, status: true, notes: true },
    });
    if (!appt) return fail("We cannot find that booking on your account.");
    if (appt.status === "COMPLETED" || appt.status === "CANCELLED") {
      return fail("That booking is already closed.");
    }

    /*
      The reason is APPENDED to the customer's notes, never written over them.
      The original request is what they asked for; the change is a later fact
      about it, and overwriting one with the other loses the thing a dispute
      would turn on.
    */
    const stamp = new Date().toISOString().slice(0, 10);
    const appended = [
      appt.notes,
      `[${stamp}] ${input.intent === "CANCEL" ? "Cancellation" : "Reschedule"} requested by customer: ${input.reason}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (input.intent === "CANCEL") {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { status: "CANCELLED", notes: appended },
      });
    } else {
      const when = input.preferredDate ? new Date(input.preferredDate) : null;
      if (!when || Number.isNaN(when.getTime())) {
        return fail("Choose the new date you would like.");
      }
      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          status: "REQUESTED",
          preferredDate: when,
          notes: appended,
          /* The old confirmation no longer applies. Leaving it would show the
             customer a confirmed time we have not agreed to. */
          confirmedFor: null,
        },
      });
    }

    await recordAudit({
      actor: null,
      action: `portal.appointment${input.intent === "CANCEL" ? "Cancelled" : "Reschedule"}`,
      entity: "Appointment",
      entityId: appt.id,
      summary: `${viewer.name} asked to ${input.intent.toLowerCase()} ${appt.reference}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/appointments");
    revalidatePath("/portal/visits");
    revalidatePath("/app/appointments");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* --------------------------------------------------- 4. supplier payment ask */

const supplierSchema = z.object({
  supplierName: z.string().trim().min(2, "Who is the supplier?"),
  supplierContact: optionalText(200),
  recipientDetails: z
    .string()
    .trim()
    .min(4, "The supplier's bank, Alipay or WeChat details, please."),
  amount: z
    .string()
    .trim()
    .min(1, "How much?")
    .transform((v) => Number(v.replace(/,/g, "")))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "That amount does not look right." }),
  currency: z.enum(["CNY", "USD"]),
  purpose: z.string().trim().min(3, "What is the payment for?").max(500),
  shipmentId: optionalText(60),
  notes: optionalText(),
});

/**
 * "Please pay my supplier in China."
 *
 * Writes an ExchangeRequest of type SUPPLIER_PAYMENT in status NEW — the same
 * row and the same queue as a request taken over WhatsApp. It does NOT write a
 * SupplierPayment: that row means money has been committed to a supplier, and
 * it is created by the money desk when it decides to pay, not by a customer
 * when they ask. The two are linked when that happens, which is why the portal
 * can show a payment reference and a proof against the original request.
 */
export async function requestSupplierPayment(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = supplierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    /* An optional link to their own cargo — re-checked, like every id. */
    let shipmentId: string | null = null;
    if (input.shipmentId) {
      const cargo = await prisma.shipment.findFirst({
        where: { id: input.shipmentId, customerId: viewer.customerId, deletedAt: null },
        select: { id: true },
      });
      if (!cargo) return fail("We cannot find that cargo on your account.");
      shipmentId = cargo.id;
    }

    const doc = await attachment(formData, "document", "supplier-request");

    const row = await prisma.$transaction(async (tx) =>
      tx.exchangeRequest.create({
        data: {
          reference: await nextExchangeReference(tx),
          type: "SUPPLIER_PAYMENT",
          status: "NEW",
          customerId: viewer.customerId,
          contactName: viewer.name,
          contactPhone: viewer.phone ?? "",
          contactEmail: viewer.email,
          /* Money leaves us in the supplier's currency; what the customer funds
             it with is the money desk's arithmetic, not the form's. */
          fromCurrency: "USD",
          toCurrency: input.currency,
          amount: input.amount,
          recipientName: input.supplierName,
          recipientContact: input.supplierContact,
          recipientDetails: input.recipientDetails,
          purpose: input.purpose,
          notes: input.notes,
          shipmentId,
          documentUrl: doc?.url ?? null,
          documentName: doc?.name ?? null,
        },
        select: { id: true, reference: true },
      })
    );

    await recordAudit({
      actor: null,
      action: "portal.supplierPaymentRequested",
      entity: "ExchangeRequest",
      entityId: row.id,
      summary: `${viewer.name} asked us to pay ${input.supplierName} ${input.currency} ${input.amount}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/supplier-payments");
    revalidatePath("/app/finance/supplier-payments");
    revalidatePath("/app/finance/exchange");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* ----------------------------------------------------- 5. money exchange ask */

const exchangeSchema = z.object({
  type: z.enum(["MONEY_EXCHANGE", "EXCHANGE_QUOTE", "SEND_MONEY_CHINA"]),
  fromCurrency: z.enum(["ZMW", "USD", "CNY"]),
  toCurrency: z.enum(["ZMW", "USD", "CNY"]),
  amount: z
    .string()
    .trim()
    .min(1, "How much?")
    .transform((v) => Number(v.replace(/,/g, "")))
    .refine((v) => Number.isFinite(v) && v > 0, { message: "That amount does not look right." }),
  recipientName: optionalText(200),
  recipientContact: optionalText(200),
  recipientDetails: optionalText(1000),
  purpose: optionalText(500),
  preferredMethod: optionalText(120),
  notes: optionalText(),
});

/** A currency booking, or a quote. Both are requests; neither moves money. */
export async function bookExchange(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = exchangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  if (input.fromCurrency === input.toCurrency) {
    return fail("Choose two different currencies.");
  }

  try {
    const viewer = await requireCustomer();
    const doc = await attachment(formData, "document", "exchange");

    const row = await prisma.$transaction(async (tx) =>
      tx.exchangeRequest.create({
        data: {
          reference: await nextExchangeReference(tx),
          type: input.type,
          status: "NEW",
          customerId: viewer.customerId,
          contactName: viewer.name,
          contactPhone: viewer.phone ?? "",
          contactEmail: viewer.email,
          fromCurrency: input.fromCurrency,
          toCurrency: input.toCurrency,
          amount: input.amount,
          recipientName: input.recipientName,
          recipientContact: input.recipientContact,
          recipientDetails: input.recipientDetails,
          purpose: input.purpose,
          preferredMethod: input.preferredMethod,
          notes: input.notes,
          documentUrl: doc?.url ?? null,
          documentName: doc?.name ?? null,
        },
        select: { id: true, reference: true },
      })
    );

    await recordAudit({
      actor: null,
      action: "portal.exchangeBooked",
      entity: "ExchangeRequest",
      entityId: row.id,
      summary: `${viewer.name} booked ${input.fromCurrency}→${input.toCurrency} ${input.amount}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/exchange");
    revalidatePath("/app/finance/exchange");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/* --------------------------------------------------- 6. china service request */

const chinaSchema = z.object({
  type: z.enum([
    "FIND_SUPPLIER",
    "FIND_PRODUCT",
    "REQUEST_QUOTATION",
    "VERIFY_SUPPLIER",
    "BUY_ON_BEHALF",
    "INSPECT_GOODS",
    "COLLECT_FROM_SUPPLIER",
    "PACKING",
    "SEND_IN_ADVANCE",
    "PAY_ON_COLLECTION",
  ]),
  product: z.string().trim().min(2, "What are the goods?"),
  description: z.string().trim().min(5, "Tell us what you need."),
  supplier: optionalText(200),
  budgetUsd: money("That budget"),
});

/**
 * One of the Guangzhou desk's services, asked for from the portal.
 *
 * Lands in SourcingRequest, which is the queue that desk already works. The
 * supplier's name, when given, is folded into the description rather than given
 * a column: it is one line of context on a job somebody reads in full, and a
 * column would imply we hold a supplier directory that we do not.
 */
export async function requestChinaService(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = chinaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();
    const doc = await attachment(formData, "document", "china-request");

    const description = input.supplier
      ? `${input.description}\n\nSupplier: ${input.supplier}`
      : input.description;

    const row = await prisma.$transaction(async (tx) =>
      tx.sourcingRequest.create({
        data: {
          requestNumber: await nextSourcingNumber(tx),
          customerId: viewer.customerId,
          contactName: viewer.name,
          contactPhone: viewer.phone,
          type: input.type,
          product: input.product,
          description,
          budgetUsd: input.budgetUsd,
          status: "NEW",
          documentUrl: doc?.url ?? null,
          documentName: doc?.name ?? null,
        },
        select: { id: true, requestNumber: true },
      })
    );

    await recordAudit({
      actor: null,
      action: "portal.chinaService",
      entity: "SourcingRequest",
      entityId: row.id,
      summary: `${viewer.name} requested ${input.type} — ${input.product}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/china");
    revalidatePath("/app/requests");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}
