import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Scale, ShieldCheck, Timer } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { RateCalculator } from "@/components/site/rate-calculator";
import { SectionBackdrop } from "@/components/site/section-backdrop";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { IMAGES } from "@/lib/imagery";
import { MIN_BILLABLE_KG } from "@/lib/billing-policy";
import { publicRateCard } from "@/lib/rate-card";

export const metadata: Metadata = {
  title: "Cargo rate calculator",
  description:
    "Work out what your cargo will cost from China to Lusaka — billable weight, rate per kilogram and the estimated total, with freight and duty included.",
};

/**
 * The public rate calculator.
 *
 * Target Express deleted this page on the reasoning that a calculator is the
 * rate book published one line at a time, and its rate book was private.
 * AITRANSIT's is not: the rates are on the company's own flyers, on the home
 * page and on /pricing, so there is nothing here for a calculator to leak — and
 * the specification asks for it by name.
 *
 * What it adds over the rate table is the two things a table cannot tell you
 * about YOUR parcel: which side of the 10 kg tier it falls on, and what the
 * minimum billable weight does to it. A customer with a 700 g parcel reads
 * "USD 13.50 per kg" and expects to pay USD 9.45; this tells them the truth
 * before they are surprised by it on an invoice.
 */
export default async function CalculatorPage() {
  const categories = await publicRateCard();

  return (
    <>
      <PageHero
        image={IMAGES.warehouseAisle}
        eyebrow="Cargo rate calculator"
        title="What will your cargo cost?"
        body="Pick what you are sending and roughly what it weighs. We will show you the billable weight, the rate and the estimated total — freight and duty to our Lusaka warehouse included."
      />

      <section className="relative isolate border-b py-14 md:py-20">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <RateCalculator
            categories={categories}
            freeDays={STORAGE_POLICY.freeDays}
            perDayUsd={STORAGE_POLICY.perDayUsd}
            minBillableKg={MIN_BILLABLE_KG}
          />
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: Scale,
                title: "We weigh it ourselves",
                body: `Your invoice is raised on the weight our Lusaka warehouse confirms on the scale at check-in — not on your supplier's figure, and not on the estimate above. Anything under ${MIN_BILLABLE_KG} kg is billed as ${MIN_BILLABLE_KG} kg.`,
              },
              {
                icon: ShieldCheck,
                title: "Duty is already in the price",
                body: COMPANY.dutyNote,
              },
              {
                icon: Timer,
                title: `${STORAGE_POLICY.freeDays} free storage days`,
                body: `Storage is free for ${STORAGE_POLICY.freeDays} days from the day your cargo is checked in at Lusaka. After that a fee of USD ${STORAGE_POLICY.perDayUsd} per day applies until you collect. Your tracking page shows the count and the fee, so nobody is surprised by one.`,
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border bg-card p-6 shadow-soft">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-signal/10 text-signal">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="inline-flex h-11 items-center rounded-xl border px-5 text-sm font-medium hover:bg-muted"
            >
              Full rate card
            </Link>
            <a
              href={`https://wa.me/${COMPANY.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-medium hover:bg-muted"
            >
              <MessageCircle className="h-4 w-4" />
              Ask for a firm quote
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
