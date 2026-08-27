"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Info, Scale } from "lucide-react";

import { estimateQuote } from "@/lib/actions/quote";
import type { RateCardCategory } from "@/lib/rate-card";

/**
 * The cargo quote calculator.
 *
 * PRICED BY THE REAL ENGINE. The form posts to `estimateQuote`, which calls the
 * same `quote()` in lib/pricing.ts that prices an actual invoice — same rate
 * book, same tier resolution, same minimum billable weight. A calculator doing
 * its own arithmetic is a second pricing engine, and the day the two disagree
 * is an argument at the counter with a customer holding a screenshot.
 *
 * THE INTERACTION. Category is a set of cards rather than a dropdown: there are
 * three, each needs a line of explanation to be chosen correctly, and a select
 * hides both the choice and the reason for it. Weight is a plain number field
 * with a few common weights beside it, because most people are estimating
 * rather than reading a scale.
 *
 * The result shows the WORKING, not just the total — actual weight, billable
 * weight, rate, route. "USD 13.50" is a figure to be trusted; "1 kg × USD 13.50
 * because anything under a kilo bills as one" is a figure that survives a phone
 * call.
 */
const COMMON_WEIGHTS = [0.5, 3, 8, 15, 30, 60];

export function QuoteCalculator({
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
  const [category, setCategory] = useState(categories[0]?.category ?? "NORMAL_GOODS");
  const [weight, setWeight] = useState("");

  if (categories.length === 0) {
    return (
      <div className="ai-card">
        <p style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
          Our rate card is being published. Message us on WhatsApp and we will
          quote your cargo directly.
        </p>
      </div>
    );
  }

  const quote = state?.ok ? state.data : undefined;
  const chosen = categories.find((c) => c.category === category);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
      <form action={action} className="ai-card">
        <input type="hidden" name="category" value={category} />

        <fieldset>
          <legend className="ai-label mb-3">What are you sending?</legend>
          <div className="grid gap-2.5">
            {categories.map((c) => {
              const active = c.category === category;
              return (
                <button
                  key={c.category}
                  type="button"
                  onClick={() => setCategory(c.category)}
                  aria-pressed={active}
                  className="rounded-[var(--ai-radius)] border p-4 text-left transition-all"
                  style={{
                    borderColor: active
                      ? "hsl(var(--ai-emerald))"
                      : "hsl(var(--ai-stone-3))",
                    background: active
                      ? "hsl(var(--ai-emerald-soft))"
                      : "hsl(var(--ai-white))",
                    boxShadow: active
                      ? "0 0 0 3px hsl(var(--ai-emerald)/0.12)"
                      : undefined,
                  }}
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{c.label}</span>
                    <span
                      className="ai-num text-sm"
                      style={{ color: "hsl(var(--ai-emerald))" }}
                    >
                      {c.tiers[0]?.price ?? ""}
                      <span className="text-[0.7rem]">/kg</span>
                    </span>
                  </span>
                  <span
                    className="mt-1.5 block text-[0.82rem] leading-snug"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {c.examples}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-7">
          <label htmlFor="q-weight" className="ai-label">
            Roughly how much does it weigh?
          </label>
          <div className="relative">
            <input
              id="q-weight"
              name="weightKg"
              inputMode="decimal"
              required
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="12.5"
              className="ai-field ai-num pr-12"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              kg
            </span>
          </div>
          <p className="ai-hint">
            The total for the whole consignment, not one box.
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {COMMON_WEIGHTS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeight(String(w))}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  borderColor: "hsl(var(--ai-stone-3))",
                  color: "hsl(var(--ai-charcoal-soft))",
                }}
              >
                {w} kg
              </button>
            ))}
          </div>
        </div>

        {state && !state.ok ? (
          <p className="ai-notice ai-notice-error mt-6">{state.error}</p>
        ) : null}

        <button type="submit" className="ai-btn ai-btn-primary mt-7 w-full">
          <Scale className="h-4 w-4" />
          Work out the cost
        </button>
      </form>

      {/* The answer, and how it was reached. */}
      <div
        className="rounded-[var(--ai-radius-lg)] p-7 md:p-8"
        style={{ background: "hsl(var(--ai-ink))", color: "hsl(var(--ai-stone))" }}
      >
        {!quote ? (
          <div className="flex h-full flex-col justify-center">
            <Info
              className="h-7 w-7"
              style={{ color: "hsl(var(--ai-copper))" }}
            />
            <p className="ai-display-sm mt-5">Your estimate appears here</p>
            <p
              className="mt-3 text-[0.95rem] leading-relaxed"
              style={{ color: "hsl(var(--ai-stone)/0.6)" }}
            >
              Pick a category and a weight. We will show the billable weight, the
              rate per kilogram and the total — with duty to our Lusaka warehouse
              already in it.
            </p>
            {chosen ? (
              <dl
                className="mt-8 space-y-2.5 border-t pt-6 text-sm"
                style={{ borderColor: "hsl(var(--ai-ink-3))" }}
              >
                {chosen.tiers.map((t) => (
                  <div key={t.label} className="flex justify-between gap-3">
                    <dt style={{ color: "hsl(var(--ai-stone)/0.6)" }}>
                      {t.label}
                    </dt>
                    <dd className="ai-num">{t.price}/kg</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        ) : quote.ok ? (
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--ai-copper))" }}
            >
              Estimated total
            </p>
            <p
              className="ai-num mt-3 text-[2.75rem] font-semibold leading-none"
              style={{ letterSpacing: "-0.02em" }}
            >
              {quote.currency}{" "}
              {quote.total.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <dl
              className="mt-8 space-y-3 border-t pt-6 text-sm"
              style={{ borderColor: "hsl(var(--ai-ink-3))" }}
            >
              {[
                ["Actual weight", `${quote.actualWeightKg.toFixed(2)} kg`],
                [
                  "Billable weight",
                  quote.chargeableWeightKg === null
                    ? "—"
                    : `${quote.chargeableWeightKg.toFixed(2)} kg`,
                ],
                ["Rate per kg", `${quote.currency} ${quote.rate.toFixed(2)}`],
                [
                  "Flies via",
                  quote.route === "HONG_KONG" ? "Hong Kong" : "Guangzhou",
                ],
              ].map(([term, value]) => (
                <div key={term} className="flex justify-between gap-3">
                  <dt style={{ color: "hsl(var(--ai-stone)/0.6)" }}>{term}</dt>
                  <dd className="ai-num font-medium">{value}</dd>
                </div>
              ))}
            </dl>

            {/* The engine's own words for how it got there. */}
            <p
              className="mt-6 rounded-[var(--ai-radius-sm)] p-3.5 text-[0.82rem] leading-relaxed"
              style={{
                background: "hsl(var(--ai-stone)/0.07)",
                color: "hsl(var(--ai-stone)/0.72)",
              }}
            >
              {quote.basis}
            </p>

            <ul
              className="mt-6 space-y-2 border-t pt-6 text-[0.8rem] leading-relaxed"
              style={{
                borderColor: "hsl(var(--ai-ink-3))",
                color: "hsl(var(--ai-stone)/0.56)",
              }}
            >
              <li>
                <strong style={{ color: "hsl(var(--ai-stone))" }}>
                  This is an estimate.
                </strong>{" "}
                Your invoice is raised on the weight our Lusaka warehouse
                confirms on the scale at check-in.
              </li>
              <li>Cargo under {minBillableKg} kg is billed as {minBillableKg} kg.</li>
              <li>Freight and duty to our Lusaka warehouse are included.</li>
              <li>
                Storage is free for {freeDays} days from check-in, then USD{" "}
                {perDayUsd} a day.
              </li>
            </ul>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/book" className="ai-btn ai-btn-copper ai-btn-sm">
                Book this cargo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="ai-btn ai-btn-outline-invert ai-btn-sm"
              >
                Create an account
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="ai-display-sm">No published rate covers that yet.</p>
            <p
              className="mt-3 text-[0.95rem] leading-relaxed"
              style={{ color: "hsl(var(--ai-stone)/0.6)" }}
            >
              {quote.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
