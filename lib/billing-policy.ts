/**
 * Billing rules that are not rates.
 *
 * MIN_BILLABLE_KG lives here and not in prisma/price-list.ts, even though that
 * is where it is APPLIED, because price-list.ts is a seed script: importing it
 * into a page would drag the whole product catalogue into the client bundle to
 * read one number.
 *
 * It is not the source of truth for what a customer is charged either — that is
 * `minChargeableKg` on each PricingRule, which Finance can edit per rate. This
 * is what the SITE SAYS the policy is, and the two are seeded from the same
 * constant so the sentence on the website and the arithmetic on the invoice
 * start out agreeing. If Finance ever publishes a rule with a different floor,
 * the calculator still shows the truth: it prices through the real engine and
 * prints the engine's own explanation of how it got there.
 */
export const MIN_BILLABLE_KG = 1;
