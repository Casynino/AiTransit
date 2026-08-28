import "server-only";

import { headers } from "next/headers";
import { z } from "zod";

import { prisma, type TxClient } from "@/lib/prisma";
import { TERMS_VERSION } from "@/lib/terms";

/**
 * Recording that somebody agreed to our terms.
 *
 * ONE FUNCTION, CALLED FROM EVERY PLACE A CUSTOMER STARTS DOING BUSINESS WITH
 * US. Registration, the booking form, the pickup request, the sourcing enquiry,
 * the exchange forms, and the acceptance screen in the portal all come through
 * here — so there is exactly one shape of evidence, one version stamp, and one
 * place to change if the record ever needs to hold more.
 *
 * WHAT IT DELIBERATELY DOES NOT DO: decide whether the customer agreed. The
 * checkbox is validated at the form, by the action that owns that form, because
 * only that action knows what to say when it is missing. This function is
 * called once the answer is yes.
 *
 * THE IP AND USER AGENT ARE TAKEN HERE, not passed in. They come from the
 * request, and an argument that could be passed by a caller is an argument that
 * could be passed wrongly — including by a caller in a script.
 */

export type AcceptanceSource =
  | "register"
  | "portal"
  | "booking"
  | "pickup"
  | "sourcing"
  | "exchange"
  | "appointment";

type Who = {
  customerId?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

/**
 * Write the acceptance, and update the customer's gate if there is a customer.
 *
 * Takes an optional transaction because most callers are already inside one:
 * a registration that creates a User and a Customer and then records the
 * acceptance outside that transaction is a registration that can leave an
 * account which has agreed to nothing.
 */
export async function recordTermsAcceptance(
  source: AcceptanceSource,
  who: Who,
  tx?: TxClient
) {
  const client = tx ?? prisma;

  /*
    Best effort. `headers()` throws outside a request — a seed script, a cron
    job — and an acceptance recorded without an IP address is worth far more
    than an acceptance that failed to record because we could not find one.
  */
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  try {
    const h = await headers();
    ipAddress =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    userAgent = h.get("user-agent")?.slice(0, 500) ?? null;
  } catch {
    /* not in a request context */
  }

  await client.termsAcceptance.create({
    data: {
      version: TERMS_VERSION,
      source,
      customerId: who.customerId ?? null,
      name: who.name ?? null,
      phone: who.phone ?? null,
      email: who.email ?? null,
      ipAddress,
      userAgent,
    },
  });

  if (who.customerId) {
    await client.customer.update({
      where: { id: who.customerId },
      data: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
    });
  }
}

/**
 * Has this customer accepted the terms that are current now?
 *
 * Compares the stored version to TERMS_VERSION rather than merely checking that
 * a date exists. Somebody who agreed to last year's terms has not agreed to
 * this year's, and treating "accepted something once" as "accepted" is how a
 * versioned document quietly stops meaning anything.
 */
export function hasAcceptedCurrentTerms(customer: {
  termsVersion: string | null;
}) {
  return customer.termsVersion === TERMS_VERSION;
}

/**
 * Turn a form field into a yes or a no.
 *
 * An unticked HTML checkbox submits NOTHING — the field is absent from the form
 * data rather than present and false. So this has to treat absence as refusal,
 * which is also the safe direction: a form that somehow lost the field is a
 * form whose acceptance we cannot prove.
 */
export function ticked(value: FormDataEntryValue | null) {
  return value === "on" || value === "true" || value === "1";
}

/**
 * The tick, as a zod field, for the public forms.
 *
 * An unticked HTML checkbox submits NOTHING — the field is absent, not false —
 * which is why this is a literal on a required field rather than a boolean.
 * Absence is refusal, and refusal is the safe reading.
 *
 * The message is what somebody reads when they hurry past the box, so it says
 * what to do rather than naming the field that failed.
 */
export const acceptTermsField = () =>
  z.literal("on", {
    errorMap: () => ({
      message:
        "Please read and agree to our terms of business before sending this.",
    }),
  });
