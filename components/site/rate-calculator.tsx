"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Calculator, Info } from "lucide-react";

import { estimateQuote } from "@/lib/actions/quote";
import type { RateCardCategory } from "@/lib/rate-card";

/**
 * The public cargo rate calculator.
 *
 * PRICES THROUGH THE REAL ENGINE. It posts to `estimateQuote`, which calls the
 * same `quote()` in lib/pricing.ts that prices an actual invoice — so the
 * figure a customer sees here is arrived at by the same code, against the same
 * rate book, with the same tier resolution and the same minimum billable
 * weight. A calculator that did its own arithmetic would be a second pricing
 * engine, and the day the two disagreed would be an argument at the counter.
 *
 * It is still an ESTIMATE, and the page says so twice: the customer types a
 * weight they guessed, and the invoice is raised on the weight our Lusaka
 * warehouse puts on the scale. The number is honest about what it is.
 */
export function RateCalculator({
  categories,
  freeDays,
  perDayUsd,
  minBillableKg,
}: {
  categories: RateCardCategory[];
  freeDays: number;
  perDayUsd: number;
  minBillableKg: number;
}) {
  const [state, action] = useActionState(estimateQuote, undefined);

  if (categories.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        Our rate card is being published. Message us on WhatsApp and we will
        quote your cargo directly.
      </p>
    );
  }

  const quote = state?.ok ? state.data : undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form action={action} className="space-y-5 rounded-2xl border bg-card p-6">
        <div>
          <label
            htmlFor="calc-category"
            className="mb-1.5 block text-sm font-medium"
          >
            What are you sending?
          </label>
          <select
            id="calc-category"
            name="category"
            defaultValue={categories[0].category}
            className="h-12 w-full rounded-xl border bg-background px-4 text-[15px]"
          >
            {categories.map((category) => (
              <option key={category.category} value={category.category}>
                {category.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {categories.map((c) => `${c.label}: ${c.examples}`).join(" · ")}
          </p>
        </div>

        <div>
          <label htmlFor="calc-weight" className="mb-1.5 block text-sm font-medium">
            Estimated weight in kilograms
          </label>
          <input
            id="calc-weight"
            name="weightKg"
            inputMode="decimal"
            required
            placeholder="12.5"
            className="h-12 w-full rounded-xl border bg-background px-4 text-[15px]"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            The total weight of the whole consignment, not one box.
          </p>
        </div>

        {state && !state.ok ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-signal px-6 text-sm font-semibold text-signal-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
        >
          <Calculator className="h-4 w-4" />
          Work out the cost
        </button>
      </form>

      <div className="rounded-2xl border bg-muted/30 p-6">
        {!quote ? (
          <div className="flex h-full flex-col justify-center text-sm text-muted-foreground">
            <Info className="mb-3 h-6 w-6" />
            <p>
              Pick a category and a weight and we will show the working — the
              billable weight, the rate per kilogram and the estimated total.
            </p>
          </div>
        ) : quote.ok ? (
          <>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Estimated total
            </p>
            <p className="mt-1 font-display text-4xl font-bold tabular">
              {quote.currency}{" "}
              {quote.total.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <dl className="mt-6 space-y-3 border-t pt-5 text-sm">
              <Row label="Actual weight">
                {quote.actualWeightKg.toFixed(2)} kg
              </Row>
              <Row label="Billable weight">
                {quote.chargeableWeightKg === null
                  ? "—"
                  : `${quote.chargeableWeightKg.toFixed(2)} kg`}
              </Row>
              <Row label="Rate per kg">
                {quote.currency} {quote.rate.toFixed(2)}
              </Row>
              <Row label="Flies via">
                {quote.route === "HONG_KONG" ? "Hong Kong" : "Guangzhou"}
              </Row>
            </dl>

            {/* The engine's own explanation of how it got there, in its words.
                "Priced on this route's minimum billable weight of 1 kg" is the
                sentence that answers the commonest question about a small
                parcel, and it comes from the same place the number does. */}
            <p className="mt-5 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
              {quote.basis}
            </p>

            <ul className="mt-5 space-y-2 border-t pt-5 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">This is an estimate.</strong>{" "}
                Your invoice is raised on the weight our Lusaka warehouse
                confirms on the scale when your cargo is checked in.
              </li>
              <li>
                Cargo under {minBillableKg} kg is billed as {minBillableKg} kg.
              </li>
              <li>
                The rate includes freight and duty to our Lusaka warehouse.
              </li>
              <li>
                Storage is free for {freeDays} days from check-in, then USD{" "}
                {perDayUsd} per day.
              </li>
            </ul>

            <Link
              href="/book"
              className="mt-6 inline-flex h-11 items-center rounded-xl border px-5 text-sm font-medium transition-colors hover:bg-background"
            >
              Book this cargo
            </Link>
          </>
        ) : (
          <div className="text-sm">
            <p className="font-medium">No published rate covers that yet.</p>
            <p className="mt-2 text-muted-foreground">{quote.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono tabular">{children}</dd>
    </div>
  );
}
