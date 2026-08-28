"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { normalisePhone } from "@/lib/format";
import {
  nextExchangeReference,
  nextSupplierPaymentReference,
} from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { acceptTermsField, recordTermsAcceptance } from "@/lib/terms-accept";
import { authorize } from "@/lib/session";
import { putDocument } from "@/lib/storage";
import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";

/**
 * The money desk, write side.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: submitting a form is not sending
 * money. Everything a member of the public can reach here writes exactly one
 * kind of row — an ExchangeRequest in status NEW — and nothing else. No rate is
 * fixed, no account is touched, no ledger line is written, and the customer is
 * shown a reference number and a status, never a confirmation.
 *
 * Moving a request forward is a staff action, gated on a permission, and the
 * two that matter are deliberately split:
 *
 *   fx.manage    — publishing the board, and quoting a request.
 *   payment.record — recording that money actually moved.
 *
 * That split is the same one already drawn between pricing an invoice and
 * confirming a payment, and it is drawn for the same reason: the desk that
 * sets a figure should not be the only desk that can say the money arrived.
 *
 * There is NO payment-provider integration here and that is deliberate. The
 * specification asks for booking, review, status and record-keeping unless a
 * licensed provider already exists in the source project — Target Express had
 * none, so neither does this. Money moves the way it already moved: somebody
 * at AITRANSIT does it, and records it against a real account.
 */

// ---------------------------------------------------------------------------
// Public: a customer asks
// ---------------------------------------------------------------------------

const CURRENCY = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Pick a currency.");

const requestSchema = z.object({
  type: z.enum([
    "MONEY_EXCHANGE",
    "EXCHANGE_QUOTE",
    "SUPPLIER_PAYMENT",
    "SEND_MONEY_CHINA",
  ]),
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
  fromCurrency: CURRENCY,
  toCurrency: CURRENCY,
  amount: z
    .string()
    .trim()
    .min(1, "How much?")
    .transform((v) => Number(v.replace(/,/g, "")))
    .refine((v) => Number.isFinite(v) && v > 0 && v < 1_000_000_000, {
      message: "That amount does not look right.",
    }),
  recipientName: z.string().trim().max(160).optional(),
  recipientContact: z.string().trim().max(160).optional(),
  recipientDetails: z.string().trim().max(2000).optional(),
  purpose: z.string().trim().max(400).optional(),
  preferredMethod: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(2000).optional(),
  /** Set by the portal form only; the public form never sends it. */
  customerId: z.string().trim().optional(),
  acceptTerms: acceptTermsField(),
});

const blank = (v: string | undefined) => (v && v.length > 0 ? v : null);

/**
 * A customer asks the money desk for something.
 *
 * Reachable without a session, so it is written the same way the booking form
 * is: narrow input, no operational side effects, and a reference the customer
 * can quote on the phone. The two China-facing types are checked for a
 * recipient here rather than in the schema because a quotation legitimately has
 * none — the same form serves four purposes and only two of them are sending
 * money to somebody.
 */
export async function submitExchangeRequest(
  _prev: ActionResult<{ reference: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ reference: string }>> {
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  if (input.fromCurrency === input.toCurrency) {
    return fail("Choose two different currencies.");
  }
  if (
    (input.type === "SUPPLIER_PAYMENT" || input.type === "SEND_MONEY_CHINA") &&
    !blank(input.recipientName)
  ) {
    return fail("Tell us who the money is going to.");
  }

  try {
    /* The customer's supporting document — a proforma invoice, an order
       screenshot. Optional, and a failed upload must not lose the request:
       a desk can always ask for the file again, and cannot ask for a request
       that was never saved. */
    let documentUrl: string | null = null;
    let documentName: string | null = null;
    const file = formData.get("document");
    if (file instanceof File && file.size > 0) {
      try {
        const stored = await putDocument(file, "exchange");
        documentUrl = stored.url;
        documentName = file.name;
      } catch {
        documentUrl = null;
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const reference = await nextExchangeReference(tx);
      await recordTermsAcceptance(
        "exchange",
        {
          customerId: input.customerId?.length ? input.customerId : null,
          name: input.contactName,
          phone: input.contactPhone,
          email: input.contactEmail ?? null,
        },
        tx
      );

      return tx.exchangeRequest.create({
        data: {
          reference,
          type: input.type,
          status: "NEW",
          customerId: blank(input.customerId),
          contactName: input.contactName,
          contactPhone: normalisePhone(input.contactPhone) ?? input.contactPhone,
          contactEmail: input.contactEmail,
          fromCurrency: input.fromCurrency,
          toCurrency: input.toCurrency,
          amount: input.amount,
          recipientName: blank(input.recipientName),
          recipientContact: blank(input.recipientContact),
          recipientDetails: blank(input.recipientDetails),
          purpose: blank(input.purpose),
          preferredMethod: blank(input.preferredMethod),
          notes: blank(input.notes),
          documentUrl,
          documentName,
        },
        select: { id: true, reference: true, type: true },
      });
    });

    /* Audited with a null actor, exactly like a website booking. "Somebody on
       the internet asked" is a true and useful line in the log; inventing a
       staff actor for it would not be. */
    await recordAudit({
      actor: null,
      action: "exchange.request",
      entity: "ExchangeRequest",
      entityId: created.id,
      summary: `${input.contactName} submitted ${created.reference} (${created.type})`,
    });

    revalidatePath("/app/finance/exchange");
    return ok({ reference: created.reference });
  } catch (error) {
    return fail(toActionError(error));
  }
}

// ---------------------------------------------------------------------------
// Staff: the desk decides
// ---------------------------------------------------------------------------

const decisionSchema = z.object({
  id: z.string().min(1),
  status: z.enum([
    "UNDER_REVIEW",
    "QUOTED",
    "AWAITING_PAYMENT",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
  ]),
  agreedRate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: "The rate should be a positive number.",
    }),
  agreedAmount: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
      message: "That amount does not look right.",
    }),
  feeAmount: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
      message: "That fee does not look right.",
    }),
  decisionNote: z.string().trim().max(1000).optional(),
  customerId: z.string().trim().optional(),
});

/**
 * Move a request along, and record who moved it.
 *
 * Two rules, both enforced here rather than in the form:
 *
 *   A QUOTE MUST CARRY A RATE. Setting status QUOTED with no `agreedRate` would
 *   tell a customer they have been quoted and leave nobody able to say what
 *   the quote was.
 *
 *   A REJECTION MUST CARRY A REASON. A no that nobody explained gets
 *   resubmitted the same afternoon.
 *
 * COMPLETED is deliberately NOT reachable from here. Completing means money
 * moved, and that goes through `completeExchangeRequest` below, which demands
 * an account.
 */
export async function decideExchangeRequest(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const user = await authorize("fx.manage");

    if (input.status === "QUOTED" && input.agreedRate === null) {
      return fail("A quote needs the rate you are quoting.");
    }
    if (input.status === "REJECTED" && !blank(input.decisionNote)) {
      return fail("Say why it was refused — the customer will ask.");
    }

    const existing = await prisma.exchangeRequest.findUnique({
      where: { id: input.id },
      select: { reference: true, status: true },
    });
    if (!existing) return fail("That request no longer exists.");
    if (
      existing.status === "COMPLETED" ||
      existing.status === "REJECTED" ||
      existing.status === "CANCELLED"
    ) {
      return fail("That request is already closed.");
    }

    await prisma.exchangeRequest.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(input.agreedRate !== null ? { agreedRate: input.agreedRate } : {}),
        ...(input.agreedAmount !== null
          ? { agreedAmount: input.agreedAmount }
          : {}),
        ...(input.feeAmount !== null ? { feeAmount: input.feeAmount } : {}),
        ...(blank(input.customerId) ? { customerId: input.customerId } : {}),
        decisionNote: blank(input.decisionNote),
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
    });

    await recordAudit({
      actor: user,
      action: "exchange.decide",
      entity: "ExchangeRequest",
      entityId: input.id,
      summary: `${user.name} moved ${existing.reference} from ${existing.status} to ${input.status}`,
      metadata: { from: existing.status, to: input.status },
    });

    revalidatePath("/app/finance/exchange");
    revalidatePath(`/app/finance/exchange/${input.id}`);
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

const completeSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1, "Say which account the money moved through."),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * The request is finished and the money has moved.
 *
 * Requires an ACCOUNT, and that is the point of it being its own action.
 * "Completed" on a money request means something physically happened to real
 * cash, and a completion with no account behind it is exactly the state the
 * whole finance section of this system exists to make impossible.
 *
 * It does not write the ledger line itself. The movement is recorded through
 * the ordinary Transactions screen against the same account, so there is one
 * path into the register and one place to reverse a mistake — a second writer
 * here would be a second set of books. This marks the request done and names
 * the account so the two can be tied together at reconciliation.
 */
export async function completeExchangeRequest(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = completeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const user = await authorize("payment.record");

    const existing = await prisma.exchangeRequest.findUnique({
      where: { id: input.id },
      select: { reference: true, status: true, agreedRate: true },
    });
    if (!existing) return fail("That request no longer exists.");
    if (existing.status === "COMPLETED") {
      return fail("That request is already completed.");
    }
    if (existing.agreedRate === null) {
      return fail(
        "Quote it first. A completed exchange has to record the rate it settled at."
      );
    }

    let proofUrl: string | null = null;
    let proofName: string | null = null;
    const file = formData.get("proof");
    if (file instanceof File && file.size > 0) {
      const stored = await putDocument(file, "exchange-proof");
      proofUrl = stored.url;
      proofName = file.name;
    }

    await prisma.exchangeRequest.update({
      where: { id: input.id },
      data: {
        status: "COMPLETED",
        accountId: input.accountId,
        completedAt: new Date(),
        reviewedById: user.id,
        reviewedAt: new Date(),
        ...(proofUrl ? { proofUrl, proofName } : {}),
        ...(blank(input.notes) ? { notes: input.notes } : {}),
      },
    });

    await recordAudit({
      actor: user,
      action: "exchange.complete",
      entity: "ExchangeRequest",
      entityId: input.id,
      summary: `${user.name} completed ${existing.reference}`,
      metadata: { accountId: input.accountId },
    });

    revalidatePath("/app/finance/exchange");
    revalidatePath(`/app/finance/exchange/${input.id}`);
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

// ---------------------------------------------------------------------------
// The published board
// ---------------------------------------------------------------------------

const rateSchema = z.object({
  id: z.string().trim().optional(),
  baseCurrency: CURRENCY,
  quoteCurrency: CURRENCY,
  buyRate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: "A buy rate should be a positive number.",
    }),
  sellRate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: "A sell rate should be a positive number.",
    }),
  note: z.string().trim().max(200).optional(),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number.parseInt(v, 10) : 0)),
  active: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

/**
 * Publish or move a rate on the public board.
 *
 * `settings.manage` was the obvious guard and is the wrong one: the board is
 * priced, not configured, and the desk that prices things is Finance. It sits
 * on `fx.manage` — the same permission that already governs the USD→ZMW rate
 * invoices are converted at — so one person's authority over "what a currency
 * is worth here" is expressed once.
 *
 * Upserted on the pair, so a desk correcting this morning's number edits the
 * row rather than stacking a second one behind it. A board is a current
 * statement of price, not a history — and every change is in the audit log,
 * which is where the history belongs.
 */
export async function publishFxRate(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = rateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const user = await authorize("fx.manage");

    if (input.baseCurrency === input.quoteCurrency) {
      return fail("A pair needs two different currencies.");
    }
    if (input.buyRate === null && input.sellRate === null) {
      return fail("Give at least one side of the pair — buy, sell, or both.");
    }
    if (
      input.buyRate !== null &&
      input.sellRate !== null &&
      input.buyRate > input.sellRate
    ) {
      /* Not a hard rule of arithmetic, but always a typo in practice: buying a
         currency for more than you sell it is a loss on every trade. */
      return fail(
        "The buy rate is above the sell rate. Check the two figures are the right way round."
      );
    }

    const row = await prisma.publishedFxRate.upsert({
      where: {
        baseCurrency_quoteCurrency: {
          baseCurrency: input.baseCurrency,
          quoteCurrency: input.quoteCurrency,
        },
      },
      create: {
        baseCurrency: input.baseCurrency,
        quoteCurrency: input.quoteCurrency,
        buyRate: input.buyRate,
        sellRate: input.sellRate,
        note: blank(input.note),
        sortOrder: input.sortOrder,
        active: true,
        setById: user.id,
      },
      update: {
        buyRate: input.buyRate,
        sellRate: input.sellRate,
        note: blank(input.note),
        sortOrder: input.sortOrder,
        active: input.active,
        setById: user.id,
      },
    });

    await recordAudit({
      actor: user,
      action: "fx.publish",
      entity: "PublishedFxRate",
      entityId: row.id,
      summary: `${user.name} published ${input.baseCurrency}/${input.quoteCurrency} at buy ${input.buyRate ?? "—"} / sell ${input.sellRate ?? "—"}`,
      metadata: { buy: input.buyRate, sell: input.sellRate },
    });

    revalidatePath("/");
    revalidatePath("/exchange");
    revalidatePath("/app/finance/exchange-rate");
    return ok();
  } catch (error) {
    return fail(toActionError(error));
  }
}

// ---------------------------------------------------------------------------
// Supplier payments
// ---------------------------------------------------------------------------

const supplierPaymentSchema = z.object({
  requestId: z.string().trim().optional(),
  customerId: z.string().min(1, "Which customer is this for?"),
  supplierName: z.string().trim().min(2, "Name the supplier."),
  supplierContact: z.string().trim().max(160).optional(),
  amount: z
    .string()
    .trim()
    .min(1, "How much was sent?")
    .transform((v) => Number(v.replace(/,/g, "")))
    .refine((v) => Number.isFinite(v) && v > 0, {
      message: "That amount does not look right.",
    }),
  currency: CURRENCY.default("CNY"),
  exchangeRate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0), {
      message: "That rate does not look right.",
    }),
  serviceFeeUsd: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v?.length ? Number(v.replace(/,/g, "")) : null))
    .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
      message: "That fee does not look right.",
    }),
  supplierReference: z.string().trim().max(120).optional(),
  paymentReference: z.string().trim().max(120).optional(),
  shipmentId: z.string().trim().optional(),
  accountId: z.string().min(1, "Which account did the money leave?"),
  status: z
    .enum(["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"])
    .default("PENDING"),
  notes: z.string().trim().max(1000).optional(),
});

/**
 * Record money paid to a supplier in China on a customer's behalf.
 *
 * Gated on `payment.record`, not on `fx.manage`: this is not a quote or a
 * decision, it is a statement that cash left an account, and it is the same
 * authority that records a customer's payment.
 *
 * The account is REQUIRED. Money that left the business without naming where it
 * left from cannot be reconciled, and an unreconcilable payout is precisely the
 * hole this record exists to close. `amountUsd` is stored beside the sent
 * amount at the rate used, so a month of payouts in RMB, USD and ZMW can be
 * totalled — the same discipline LedgerEntry follows.
 */
export async function recordSupplierPayment(
  _prev: ActionResult<{ reference: string }> | undefined,
  formData: FormData
): Promise<ActionResult<{ reference: string }>> {
  const parsed = supplierPaymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const input = parsed.data;

  try {
    const user = await authorize("payment.record");

    let proofUrl: string | null = null;
    let proofName: string | null = null;
    const file = formData.get("proof");
    if (file instanceof File && file.size > 0) {
      const stored = await putDocument(file, "supplier-payment");
      proofUrl = stored.url;
      proofName = file.name;
    }

    /* USD is the currency every company-wide total in this system is summed in.
       Without a rate there is nothing honest to convert with, so the column
       stays null rather than holding a guess — the register shows the amount in
       the currency it was actually sent in either way. */
    const amountUsd =
      input.exchangeRate !== null && input.exchangeRate > 0
        ? input.amount / input.exchangeRate
        : null;

    const created = await prisma.$transaction(async (tx) => {
      const reference = await nextSupplierPaymentReference(tx);
      return tx.supplierPayment.create({
        data: {
          reference,
          requestId: blank(input.requestId),
          customerId: input.customerId,
          supplierName: input.supplierName,
          supplierContact: blank(input.supplierContact),
          amount: input.amount,
          currency: input.currency,
          amountUsd,
          exchangeRate: input.exchangeRate,
          serviceFeeUsd: input.serviceFeeUsd,
          supplierReference: blank(input.supplierReference),
          paymentReference: blank(input.paymentReference),
          shipmentId: blank(input.shipmentId),
          accountId: input.accountId,
          status: input.status,
          notes: blank(input.notes),
          proofUrl,
          proofName,
          handledById: user.id,
          paidAt: input.status === "PAID" ? new Date() : null,
        },
        select: { id: true, reference: true },
      });
    });

    await recordAudit({
      actor: user,
      action: "supplierPayment.record",
      entity: "SupplierPayment",
      entityId: created.id,
      summary: `${user.name} recorded ${created.reference} — ${input.currency} ${input.amount.toLocaleString()} to ${input.supplierName}`,
      metadata: { accountId: input.accountId, status: input.status },
    });

    revalidatePath("/app/finance/supplier-payments");
    return ok({ reference: created.reference });
  } catch (error) {
    return fail(toActionError(error));
  }
}
