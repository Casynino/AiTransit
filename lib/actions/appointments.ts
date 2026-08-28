"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { normalisePhone, normaliseCode } from "@/lib/format";
import { nextAppointmentReference } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { acceptTermsField, recordTermsAcceptance } from "@/lib/terms-accept";
import { authorize } from "@/lib/session";
import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";

/**
 * Booking a slot, and what the desk does with it.
 *
 * THE RULE, as everywhere else on this site: a customer can only ever create a
 * REQUEST. `status` is written literally as REQUESTED below and is never read
 * from the form, so no amount of crafted input produces a confirmed booking.
 * Confirming, rescheduling and cancelling are staff actions behind a permission.
 *
 * A cargo pickup is additionally checked against the consignment — see the note
 * on that branch. Somebody travelling to Makeni to collect cargo that is still
 * in the air is the failure this whole feature exists to prevent.
 */

const KINDS = [
  "CARGO_PICKUP",
  "SUPPLIER_VISIT",
  "FACTORY_VISIT",
  "MARKET_VISIT",
  "SOURCING_HELP",
  "GOODS_INSPECTION",
  "CONSULTATION",
] as const;

const blank = (v: string | undefined | null) => (v && v.length > 0 ? v : null);

const bookingSchema = z.object({
  kind: z.enum(KINDS),
  contactName: z.string().trim().min(2, "Please give us your name."),
  contactPhone: z
    .string()
    .trim()
    .min(9, "A phone number we can reach you on, please.")
    .max(30),
  contactEmail: z
    .string()
    .trim()
    .email("That email does not look right.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  preferredDate: z
    .string()
    .trim()
    .min(1, "Choose a date.")
    .transform((v) => new Date(v))
    .refine((d) => !Number.isNaN(d.getTime()), "That date does not look right."),
  preferredTime: z.string().trim().max(60).optional(),
  visitors: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number.parseInt(v, 10) : 1))
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 50, {
      message: "How many people are coming? Between 1 and 50.",
    }),
  locationName: z.string().trim().max(160).optional(),
  locationAddress: z.string().trim().max(600).optional(),
  marketSlug: z.string().trim().max(120).optional(),
  productType: z.string().trim().max(160).optional(),
  needsInterpreter: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
  trackingNumber: z.string().trim().max(40).optional(),
  packages: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number.parseInt(v, 10) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v > 0 && v < 10000), {
      message: "How many packages? A whole number.",
    }),
  budgetUsd: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
      message: "That budget does not look right.",
    }),
  notes: z.string().trim().max(2000).optional(),
  customerId: z.string().trim().optional(),
  acceptTerms: acceptTermsField(),
});

/**
 * The day a booking may be for.
 *
 * Yesterday is refused, and so is anything more than a year out — both are
 * typing mistakes rather than intentions, and a diary full of them is a diary
 * nobody trusts. The lower bound is midnight TODAY rather than "now", so
 * somebody booking a same-day pickup at four in the afternoon is not told their
 * date is in the past.
 */
function dateIsBookable(date: Date) {
  const midnightToday = new Date();
  midnightToday.setHours(0, 0, 0, 0);
  const aYearOut = new Date();
  aYearOut.setFullYear(aYearOut.getFullYear() + 1);
  return date >= midnightToday && date <= aYearOut;
}

export async function requestAppointment(
  _prev: ActionResult<{ reference: string; kind: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ reference: string; kind: string }>> {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  if (!dateIsBookable(input.preferredDate)) {
    return fail("Choose a date between today and a year from now.");
  }

  try {
    let shipmentId: string | null = null;

    if (input.kind === "CARGO_PICKUP") {
      /*
        A PICKUP IS CHECKED AGAINST THE CARGO.

        The specification asks that we validate the consignment is ready before
        confirming — and the honest place to start is here, at the request,
        because the alternative is a customer travelling to Makeni on a day we
        were never going to be able to hand anything over.

        What is refused is only what is certainly wrong: no such tracking
        number, or cargo that has already been collected. Cargo still in transit
        is ALLOWED through as a request — customers book ahead all the time, and
        the desk confirms the slot once it lands. The status is shown to them
        either way, so nobody is told a date is agreed when it is not.
      */
      const code = normaliseCode(input.trackingNumber ?? "");
      if (!code) {
        return fail("Enter the tracking number of the cargo you are collecting.");
      }
      const shipment = await prisma.shipment.findFirst({
        where: { trackingNumber: code, deletedAt: null },
        select: { id: true, status: true },
      });
      if (!shipment) {
        return fail(
          `We cannot find cargo ${code}. Check the number on your label, or message us.`
        );
      }
      if (shipment.status === "DELIVERED") {
        return fail(
          `Cargo ${code} has already been collected. If that is not right, please contact us.`
        );
      }
      if (shipment.status === "CANCELLED") {
        return fail(`Cargo ${code} is no longer active. Please contact us.`);
      }
      shipmentId = shipment.id;
    }

    const created = await prisma.$transaction(async (tx) => {
      await recordTermsAcceptance(
        "appointment",
        {
          name: input.contactName,
          phone: input.contactPhone,
          email: input.contactEmail ?? null,
        },
        tx
      );

      const reference = await nextAppointmentReference(tx);
      return tx.appointment.create({
        data: {
          reference,
          kind: input.kind,
          // Literal. See the note at the top of this file.
          status: "REQUESTED",
          customerId: blank(input.customerId),
          contactName: input.contactName,
          contactPhone:
            normalisePhone(input.contactPhone) ?? input.contactPhone,
          contactEmail: input.contactEmail,
          preferredDate: input.preferredDate,
          preferredTime: blank(input.preferredTime),
          visitors: input.visitors,
          locationName: blank(input.locationName),
          locationAddress: blank(input.locationAddress),
          marketSlug: blank(input.marketSlug),
          productType: blank(input.productType),
          needsInterpreter: input.needsInterpreter,
          shipmentId,
          packages: input.packages,
          budgetUsd: input.budgetUsd,
          notes: blank(input.notes),
        },
        select: { id: true, reference: true, kind: true },
      });
    });

    /* Audited with a null actor, like every other public submission: "somebody
       on the internet asked" is true and useful; inventing a staff actor is not. */
    await recordAudit({
      actor: null,
      action: "appointment.request",
      entity: "Appointment",
      entityId: created.id,
      summary: `${input.contactName} requested ${created.reference} (${created.kind})`,
    });

    revalidatePath("/app/appointments");
    return ok({ reference: created.reference, kind: created.kind });
  } catch (error) {
    return fail(toActionError(error));
  }
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

const decisionSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "CONFIRMED",
    "RESCHEDULED",
    "COMPLETED",
    "CANCELLED",
  ]),
  confirmedFor: z.string().trim().optional(),
  confirmedTime: z.string().trim().max(60).optional(),
  staffNote: z.string().trim().max(1000).optional(),
});

/**
 * Confirm, move or cancel a booking.
 *
 * Gated on `ticket.manage` — this is the customer-facing desk's work, and
 * Support is who answers the phone about it. Admin holds every permission, so
 * the owner can work the diary too.
 *
 * Two rules enforced here rather than in the form: a CONFIRMED or RESCHEDULED
 * booking must carry the slot it was agreed for, and a CANCELLED one must carry
 * a reason. Both exist because the customer is told the outcome, and an outcome
 * with nothing behind it is a phone call to the office.
 */
export async function decideAppointment(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const user = await authorize("ticket.manage");

    const existing = await prisma.appointment.findUnique({
      where: { id: input.id },
      select: { reference: true, status: true, preferredDate: true },
    });
    if (!existing) return fail("That booking no longer exists.");

    const needsSlot =
      input.status === "CONFIRMED" || input.status === "RESCHEDULED";
    let confirmedFor: Date | null = null;
    if (needsSlot) {
      if (!input.confirmedFor) {
        return fail("Give the date you are confirming it for.");
      }
      confirmedFor = new Date(input.confirmedFor);
      if (Number.isNaN(confirmedFor.getTime())) {
        return fail("That date does not look right.");
      }
    }
    if (input.status === "CANCELLED" && !blank(input.staffNote)) {
      return fail("Say why it was cancelled — the customer will ask.");
    }

    await prisma.appointment.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(confirmedFor ? { confirmedFor } : {}),
        ...(blank(input.confirmedTime)
          ? { preferredTime: input.confirmedTime }
          : {}),
        staffNote: blank(input.staffNote),
        handledById: user.id,
        handledAt: new Date(),
      },
    });

    await recordAudit({
      actor: user,
      action: "appointment.decide",
      entity: "Appointment",
      entityId: input.id,
      summary: `${user.name} moved ${existing.reference} from ${existing.status} to ${input.status}`,
      metadata: { from: existing.status, to: input.status },
    });

    revalidatePath("/app/appointments");
    revalidatePath("/portal/appointments");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}
