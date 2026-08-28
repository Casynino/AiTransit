"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { normalisePhone } from "@/lib/format";
import { nextCustomerCode, nextSubmissionNumber } from "@/lib/ids";
import { requireCustomer } from "@/lib/portal";
import { recordTermsAcceptance } from "@/lib/terms-accept";
import { prisma } from "@/lib/prisma";
import { putDocument } from "@/lib/storage";
import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";

/**
 * The customer portal's writes.
 *
 * Registration is the only unauthenticated write here, and it is the only place
 * in the system that mints a User row without a member of staff. Two rules make
 * that safe:
 *
 *   THE ROLE IS HARDCODED. `role: "CUSTOMER"` is written literally below and is
 *   not read from the form, so no amount of crafted input can register an
 *   account with staff permissions. CUSTOMER holds no permissions at all.
 *
 *   THE ACCOUNT AND THE CUSTOMER ARE CREATED TOGETHER, in one transaction. A
 *   User with role CUSTOMER and no Customer row would be an account that can
 *   sign in and resolve to nobody — see requireCustomer in lib/portal.ts, which
 *   treats that state as a broken session precisely because it should not exist.
 *
 * Registration also RECONCILES with the operational record rather than ignoring
 * it. Most people registering have already shipped with AITRANSIT and already
 * have a Customer row created at the Guangzhou counter. Matching on phone number
 * attaches the account to that history instead of creating a second customer,
 * which is how a customer ends up unable to see their own cargo.
 */

/**
 * The tick, as a schema rule rather than an if-statement further down.
 *
 * An unticked HTML checkbox submits nothing at all, so the field is absent
 * rather than false — which is why this is a literal("on") on an optional
 * field rather than a boolean. The message is what a customer reads when they
 * hurry past it, so it says what to do, not what went wrong.
 */
const acceptTerms = z
  .literal("on", {
    errorMap: () => ({
      message:
        "Please read and agree to our terms of business before opening an account.",
    }),
  });

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please give us your name."),
    phone: z
      .string()
      .trim()
      .min(9, "A phone number we can reach you on, please.")
      .max(30),
    email: z.string().trim().toLowerCase().email("That email does not look right."),
    city: z.string().trim().max(80).optional(),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(200),
    confirmPassword: z.string(),
    acceptTerms,
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export async function registerCustomer(
  _prev: ActionResult<{ email: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;
  const phone = normalisePhone(input.phone) ?? input.phone;

  try {
    /* One address, one account. Checked before the transaction so the customer
       gets a sentence they can act on rather than a unique-constraint error. */
    const taken = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (taken) {
      return fail(
        "There is already an account with that email. Sign in instead, or use the other address."
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      /*
        Attach to the customer record the warehouse already has, if there is one.

        Matched on phone, which is unique on Customer and is what the Guangzhou
        counter records. Email is not matched on: it is not unique there, and
        several members of one family regularly share one.
      */
      const existing = await tx.customer.findUnique({
        where: { phone },
        select: { id: true, portalUser: { select: { id: true } } },
      });

      if (existing?.portalUser) {
        /* Their cargo is already claimed by another sign-in. Refusing is the
           only safe answer — the alternative is handing one person's shipping
           history to whoever typed their phone number. */
        throw new Error(
          "That phone number is already registered. Sign in, or contact us if it is not you."
        );
      }

      const customerId =
        existing?.id ??
        (
          await tx.customer.create({
            data: {
              code: await nextCustomerCode(tx),
              name: input.name,
              phone,
              email: input.email,
              city: input.city?.length ? input.city : null,
            },
            select: { id: true },
          })
        ).id;

      /* Fill in what the counter did not have. Never overwrite: the name on the
         operational record is the one the warehouse labels boxes with. */
      if (existing) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            email: input.email,
            ...(input.city?.length ? { city: input.city } : {}),
          },
        });
      }

      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone,
          passwordHash: await bcrypt.hash(input.password, 10),
          // Literal, never from the form. See the note at the top of this file.
          role: "CUSTOMER",
          department: "CUSTOMER",
          customerId,
        },
        select: { id: true, email: true },
      });

      /*
        The acceptance, inside the same transaction as the account.

        Outside it, a registration that half-failed could leave an account that
        has agreed to nothing — and the whole point of the gate is that no such
        account exists.
      */
      await recordTermsAcceptance(
        "register",
        {
          customerId,
          name: input.name,
          phone,
          email: input.email,
        },
        tx
      );

      return { user, customerId, matched: Boolean(existing) };
    });

    await recordAudit({
      actor: null,
      action: "portal.register",
      entity: "User",
      entityId: result.user.id,
      summary: `${input.name} registered a customer portal account`,
      metadata: { customerId: result.customerId, matchedExisting: result.matched },
    });

    return ok({ email: result.user.email });
  } catch (error) {
    return fail(toActionError(error));
  }
}

// ---------------------------------------------------------------------------
// Signed-in customers
// ---------------------------------------------------------------------------

const proofSchema = z.object({
  invoiceId: z.string().min(1),
  reference: z.string().trim().max(120).optional(),
  amount: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: "That amount does not look right.",
    }),
  note: z.string().trim().max(600).optional(),
});

/**
 * "I have paid — here is the screenshot."
 *
 * Writes a PaymentSubmission in status PENDING, which is the same row the
 * support desk creates when a customer sends the same screenshot on WhatsApp,
 * and lands in the same verification queue Finance already works. It does NOT
 * write a Payment, does not touch the invoice's balance and does not move the
 * cargo one step closer to release. A customer saying they have paid is a
 * claim; Finance confirming it against the account is the fact.
 *
 * The invoice is re-read and checked against the signed-in customer before
 * anything is written. The id comes from a form, and a form is not evidence of
 * ownership.
 */
export async function submitPaymentProof(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = proofSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const viewer = await requireCustomer();

    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, customerId: viewer.customerId },
      select: { id: true, invoiceNumber: true, total: true, currency: true },
    });
    if (!invoice) return fail("We cannot find that invoice on your account.");

    const file = formData.get("proof");
    if (!(file instanceof File) || file.size === 0) {
      return fail("Attach the payment screenshot or receipt.");
    }
    const stored = await putDocument(file, "payment-proof");

    /* The submission and its proof are written together. A claim with no
       evidence attached is the state Finance cannot act on, and the upload has
       already succeeded by this point — so there is no reason to allow it. */
    await prisma.$transaction(async (tx) => {
      const submission = await tx.paymentSubmission.create({
        data: {
          submissionNumber: await nextSubmissionNumber(tx),
          invoiceId: invoice.id,
          amount: input.amount ?? invoice.total,
          currency: invoice.currency,
          /* The portal cannot know how they actually paid — the form asks for a
             reference and a screenshot, not a rail. Finance sets the real method
             when they verify it against the account the money landed in. */
          method: "BANK_TRANSFER",
          reference: input.reference?.length ? input.reference : null,
          note: input.note?.length ? input.note : null,
          status: "PENDING",
        },
        select: { id: true },
      });

      await tx.paymentProof.create({
        data: {
          submissionId: submission.id,
          url: stored.url,
          contentType: stored.contentType,
          bytes: stored.bytes,
          filename: file.name,
        },
      });
    });

    await recordAudit({
      actor: null,
      action: "portal.paymentProof",
      entity: "Invoice",
      entityId: invoice.id,
      summary: `${viewer.name} submitted payment proof for ${invoice.invoiceNumber}`,
      metadata: { customerId: viewer.customerId },
    });

    revalidatePath("/portal/invoices");
    revalidatePath("/app/collections/submissions");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

/*
  submitChinaRequest lived here and has been replaced by requestChinaService in
  lib/actions/portal-requests.ts.

  Same table, same queue, same status. The new one also takes an attachment and
  a supplier name, which is what customers were putting in the description
  anyway, and it sits beside the other five request actions rather than in the
  file that handles registration and payment proof. Two actions writing the same
  row through slightly different validation is how the two drift.
*/
