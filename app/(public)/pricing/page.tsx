import { redirect } from "next/navigation";

/**
 * The rate card and the calculator are one page now.
 *
 * Target Express kept them apart — an essay about how pricing works at
 * /pricing, and no calculator at all. AITRANSIT publishes its rates, so the
 * table and the tool that uses it belong together; two pages would have been
 * two places for the same numbers to drift.
 *
 * Kept as a redirect because /pricing is linked from older messages and is what
 * people guess at.
 */
export default function PricingPage() {
  redirect("/calculator");
}
