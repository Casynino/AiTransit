"use server";

import { z } from "zod";

import { fail, ok, toActionError, type ActionResult } from "@/lib/actions/types";
import { quote, type Quote } from "@/lib/pricing";

const schema = z.object({
  category: z.enum(["NORMAL_GOODS", "WIGS", "SPECIAL_CATEGORY"]),
  cargoTypeId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  weightKg: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : 0))
    .refine((v) => !Number.isNaN(v) && v >= 0, "Weight is not valid."),
  quantity: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : 1))
    .refine((v) => Number.isFinite(v) && v >= 1, "Quantity must be at least 1."),
});

/**
 * Public rate estimate.
 *
 * Unauthenticated on purpose — anyone should be able to price a shipment before
 * they talk to us. It only reads the published rate book, so there is nothing
 * here to leak.
 */
export async function estimateQuote(
  _prev: ActionResult<Quote> | undefined,
  formData: FormData
): Promise<ActionResult<Quote>> {
  const parsed = schema.safeParse(
    Object.fromEntries(formData) as Record<string, string>
  );

  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }

  const input = parsed.data;

  /*
    Every AITRANSIT category is priced by weight, so a weight is always
    required.

    Target Express had a per-item electronics tariff and this branch exempted it
    from needing one. AITRANSIT's published card has no per-item rate at all —
    three categories, two weight tiers each — so the exemption would only ever
    have let somebody submit a weightless quote and get "no rate covers that
    cargo" back. A rule with no cargo behind it is worse than no rule.

    Per-item rules can still exist in the rate book, and lib/pricing.ts still
    resolves them; if Finance publishes one, this asks for a weight that the
    engine then ignores, which is a harmless extra field rather than a refusal.
  */
  if (input.weightKg <= 0) {
    return fail("Enter the weight of your cargo.");
  }

  try {
    return ok(await quote(input));
  } catch (error) {
    return fail(toActionError(error));
  }
}
