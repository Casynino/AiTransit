import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Boxes,
  MessageCircle,
  Package,
  PackageSearch,
  Scale,
  ShieldCheck,
} from "lucide-react";

import { MediaBand } from "@/components/site/media-card";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { SectionBackdrop } from "@/components/site/section-backdrop";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { IMAGES, img } from "@/lib/imagery";
import { MIN_BILLABLE_KG } from "@/lib/billing-policy";
import { publicRateCard } from "@/lib/rate-card";

export const metadata: Metadata = {
  title: "Cargo rates",
  description:
    "How AITRANSIT prices air cargo from China to Zambia: what is charged by weight, what is charged per item, and how to get a quote for your goods.",
};

/**
 * The published rate card, and how the charge is worked out.
 *
 * TARGET EXPRESS DELIBERATELY DID NOT PUBLISH ITS RATES, on the reasoning that
 * a public price list is a standing offer: it commits to a number that moves
 * with the exchange rate and airline capacity, it is the first thing a
 * competitor copies, and it invites arguments at the counter when the printed
 * figure and the invoice disagree.
 *
 * AITRANSIT has already made the opposite decision. The rates are printed on
 * the company's own flyers and handed to customers, so withholding them here
 * would not protect anything — it would only mean the website knew less than a
 * piece of paper, and the specification asks for them by name.
 *
 * The table is read from the SAME PricingRule rows that price an invoice, so
 * the two cannot drift. The "how you are charged" panels below it stay, because
 * knowing which bucket your goods fall into still matters more than the number.
 */
const BASIS = [
  {
    icon: Scale,
    image: IMAGES.clothingRail,
    title: "Most goods are priced per kilogram",
    body: "Clothes, shoes, bags, car parts, general merchandise. We weigh it on our own scales in Guangzhou, and that weight is what appears on your invoice — not what your supplier told you.",
    note: "Larger consignments are cheaper per kilo than small ones.",
  },
  {
    icon: Package,
    image: IMAGES.electronicsBench,
    title: "Electronics are priced per item",
    body: "Phones, laptops, tablets, cameras. A laptop weighs almost nothing and is worth a great deal, so pricing it by weight would be pricing the box it came in.",
    note: "These fly from Hong Kong under different rules.",
  },
  {
    icon: Boxes,
    image: IMAGES.cargoHold,
    title: "Light and bulky costs more than heavy and dense",
    body: "An aircraft runs out of space long before it runs out of lift. A sack of cushions weighing 5 kg takes the room of 40 kg of hardware, and the price reflects the room.",
    note: "Ask your supplier to pack tightly — air, in a carton, is something you pay to fly.",
  },
];

const AFFECTS = [
  "What the goods actually are — the item decides the rate, so tell us accurately",
  "Total weight, on our scales, at our warehouse",
  "Whether it flies from Guangzhou or Hong Kong",
  "The exchange rate on the day your invoice is raised",
  "Anything needing special handling, permits or separate declaration",
];

export default async function PricingPage() {
  const categories = await publicRateCard();

  return (
    <>
      <PageHero
        image={IMAGES.cargoHold}
        size="tall"
        eyebrow="Bei zetu"
        title="What it costs depends on what you are sending."
        body={
          <>
            Tuambie unachotuma na tunakupa bei — hakuna gharama za kujificha.
            <span className="mt-2 block text-base text-white/45">
              Tell us what you are sending and we will quote you. Once your
              cargo reaches our warehouse and is weighed, you see the exact
              charge against your own tracking number.
            </span>
          </>
        }
      >
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${COMPANY.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-3 text-sm font-semibold text-signal-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
          >
            <MessageCircle className="h-4 w-4" />
            Get a quote on WhatsApp
          </a>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:bg-white/10"
          >
            Book your cargo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageHero>

      {/* The card itself, first. It is what the page is opened for. */}
      <section id="rates" className="section relative isolate border-b">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <h2 className="rule-gold font-display text-3xl font-bold tracking-tight">
            Our rates
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {COMPANY.dutyNote} Cargo under {MIN_BILLABLE_KG}&nbsp;kg is billed as{" "}
            {MIN_BILLABLE_KG}&nbsp;kg; above that you pay for the weight our
            Lusaka warehouse confirms on the scale.
          </p>

          {categories.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              Our rate card is being published. Message us on WhatsApp for a
              quote in the meantime.
            </p>
          ) : (
            <div className="mt-8 overflow-x-auto">
              <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-brand text-left text-xs uppercase tracking-[0.08em] text-brand-foreground">
                    <th className="rounded-l-lg px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Weight</th>
                    <th className="px-4 py-3 text-right font-semibold">Price per kg</th>
                    <th className="rounded-r-lg px-4 py-3 font-semibold">Route</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.flatMap((category) =>
                    category.tiers.map((tier, index) => (
                      <tr
                        key={`${category.category}-${tier.label}`}
                        className="border-b last:border-0"
                      >
                        {index === 0 ? (
                          <th
                            scope="row"
                            rowSpan={category.tiers.length}
                            className="border-b px-4 py-3 text-left align-top font-display text-base font-semibold"
                          >
                            {category.label}
                            <span className="mt-1 block text-xs font-normal text-muted-foreground">
                              {category.examples}
                            </span>
                          </th>
                        ) : null}
                        <td className="border-b px-4 py-3">{tier.label}</td>
                        <td className="border-b px-4 py-3 text-right font-mono font-semibold tabular">
                          {tier.price}
                        </td>
                        {index === 0 ? (
                          <td
                            rowSpan={category.tiers.length}
                            className="border-b px-4 py-3 align-top text-muted-foreground"
                          >
                            {category.route}
                          </td>
                        ) : null}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Storage is free for {STORAGE_POLICY.freeDays} days from check-in at
            our Lusaka warehouse, then USD {STORAGE_POLICY.perDayUsd} per day.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/calculator"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-signal px-5 text-sm font-semibold text-signal-foreground"
            >
              <Scale className="h-4 w-4" />
              Work out your own cargo
            </Link>
            <Link
              href="/book"
              className="inline-flex h-11 items-center rounded-xl border px-5 text-sm font-medium hover:bg-muted"
            >
              Book your cargo
            </Link>
          </div>
        </div>
      </section>

      <section className="section relative isolate">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <h2 className="rule-gold font-display text-3xl font-bold tracking-tight">
            How you are charged
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Knowing which of these your goods fall into tells you more than a
            price list would.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {BASIS.map((item, index) => (
              <Reveal
                key={item.title}
                delay={index * 70}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lift motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={img(item.image, 700)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--ink)/0.92)] via-[hsl(var(--ink)/0.3)] to-transparent"
                  />
                  <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg border border-gold/40 bg-[hsl(var(--ink)/0.6)] text-gold backdrop-blur">
                    <item.icon className="h-5 w-5" />
                  </span>
                  <h3 className="absolute inset-x-5 bottom-4 font-display text-lg font-bold leading-snug text-white drop-shadow">
                    {item.title}
                  </h3>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="flex-1 text-sm text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
                    {item.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section relative isolate border-y bg-muted/30">
        <SectionBackdrop variant="stars" />
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <h2 className="rule-gold font-display text-3xl font-bold tracking-tight">
              What moves the number
            </h2>
            <ul className="mt-6 space-y-3">
              {AFFECTS.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span
                    aria-hidden
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-signal"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-7 shadow-soft">
            <PackageSearch className="h-7 w-7 text-brand" />
            <h2 className="mt-4 font-display text-xl font-bold">
              Your own price is on your tracking page
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              As soon as we receive your cargo in Guangzhou it is weighed and
              priced against your goods. Enter your tracking number and you see
              the estimate; once Finance raises the invoice, you see the exact
              amount and what is still owed.
            </p>
            <Link
              href="/track"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            >
              Track your cargo
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-6 flex items-start gap-3 border-t pt-5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>
                We quote before you commit. Nothing is charged until your cargo
                is at our warehouse and on our scales.
              </span>
            </div>
          </div>
        </div>
      </section>

      <MediaBand
        image={IMAGES.airportNight}
        title="Not sure what your goods count as?"
        body="Send us a photo on WhatsApp. We will tell you the category, the airport it flies from, and what it will cost — before you buy."
      >
        <a
          href={`https://wa.me/${COMPANY.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-signal px-5 py-3 text-sm font-semibold text-signal-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
        >
          <MessageCircle className="h-4 w-4" />
          {COMPANY.phone}
        </a>
      </MediaBand>
    </>
  );
}
