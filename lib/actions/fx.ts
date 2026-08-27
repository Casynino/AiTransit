"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { BASE_CURRENCY, LOCAL_CURRENCY, currentRateValue } from "@/lib/fx";
import { t } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { authorize, type SessionUser } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";
import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";

const schema = z.object({
  rate: z
    .string()
    .trim()
    .min(1, "Enter the new rate.")
    .refine((v) => !Number.isNaN(Number(v)), "The rate must be a number.")
    .transform(Number)
    .refine((v) => v > 0, "The rate must be greater than zero.")
    /*
      A KWACHA range, not a shilling one.

      This guard was inherited as 100–100,000, which is right for USD→TZS at
      roughly 2,700 and catches a fat-fingered extra zero. The kwacha trades
      near 27, so that same guard rejected every correct Zambian rate — the
      Finance desk could not save a rate at all. The band below is wide enough
      to survive a real devaluation and still narrow enough to catch the
      decimal-point error it exists for.
    */
    .refine(
      (v) => v >= 5 && v <= 500,
      "That rate looks wrong for USD→ZMW. Check the decimal point."
    ),
  buyRate: z.string().trim().optional(),
  sellRate: z.string().trim().optional(),
  source: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

/** Optional numeric field: blank means "not stated", not zero. */
function decimalOrNull(value: string | undefined) {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? new Prisma.Decimal(n) : null;
}

/**
 * Publishes a new USD→ZMW rate.
 *
 * Inserts a row rather than editing one: the old rate has to stay readable
 * because invoices raised under it reference it. Guarded to Finance and above.
 */
export async function setExchangeRate(
  _prev: ActionResult<{ rate: number }> | undefined,
  formData: FormData
): Promise<ActionResult<{ rate: number }>> {
  const locale = await viewerLocale();
  let user: SessionUser;
  try {
    user = await authorize("fx.manage");
  } catch (error) {
    return fail(t(locale, toActionError(error)));
  }

  const parsed = schema.safeParse(
    Object.fromEntries(formData) as Record<string, string>
  );
  if (!parsed.success) {
    // The schema's messages are written in English and translated here, at the
    // one point where they stop being a validation rule and become something a
    // person reads.
    return fail(
      t(locale, parsed.error.issues[0]?.message ?? "Check the rate.")
    );
  }

  const previous = await currentRateValue();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.exchangeRate.create({
        data: {
          fromCurrency: BASE_CURRENCY,
          toCurrency: LOCAL_CURRENCY,
          rate: new Prisma.Decimal(parsed.data.rate),
          buyRate: decimalOrNull(parsed.data.buyRate),
          sellRate: decimalOrNull(parsed.data.sellRate),
          notes: parsed.data.notes || null,
          /*
            CONFIRMED, because a person with `fx.manage` typed it and pressed
            save — that is what confirmation is. Rates that arrive any other
            way (the seed, an import, a provider) land as INDICATIVE and have
            to be accepted here before anything settles at them.
          */
          status: "CONFIRMED",
          source: parsed.data.source?.trim() || "Entered by hand",
          confirmedById: user.id,
          confirmedAt: new Date(),
          setById: user.id,
        },
      });

      await recordAudit(
        {
          actor: user,
          action: "fx.setRate",
          entity: "ExchangeRate",
          summary:
            previous === null
              ? `Published the first USD→ZMW rate: ${parsed.data.rate.toLocaleString()}`
              : `Changed USD→ZMW from ${previous.toLocaleString()} to ${parsed.data.rate.toLocaleString()}`,
          metadata: { previous, next: parsed.data.rate },
        },
        tx
      );
    });

    // Invoices already raised keep their own rate, so only forward-looking
    // screens need refreshing.
    revalidatePath("/app/finance");
    revalidatePath("/app/finance/exchange-rate");
    revalidatePath("/app/admin/pricing");
    return ok({ rate: parsed.data.rate });
  } catch (error) {
    return fail(t(locale, toActionError(error)));
  }
}
