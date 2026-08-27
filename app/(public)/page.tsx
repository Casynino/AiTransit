import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Boxes,
  ClipboardCheck,
  Coins,
  HandCoins,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plane,
  Receipt,
  ShieldCheck,
  Truck,
  UserPlus,
} from "lucide-react";

import { FaqList, type Faq } from "@/components/brand/faq";
import { ProcessTimeline } from "@/components/brand/process";
import { Testimonials } from "@/components/brand/testimonials";
import { TrackInput } from "@/components/brand/track-input";
import {
  Badge,
  BtnLink,
  Card,
  Eyebrow,
  Section,
  SectionHead,
  Stat,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { MIN_BILLABLE_KG } from "@/lib/billing-policy";
import { publishedFxBoard } from "@/lib/exchange";
import { publicRateCard } from "@/lib/rate-card";

/**
 * The AITRANSIT homepage.
 *
 * Ordered around a decision rather than around the company: what you can do
 * right now (hero), what we actually do (services), how it works (corridor),
 * why us (proof), what it costs (rates), the other half of the business
 * (exchange), where we are (warehouses), what others say, what you are
 * wondering (FAQ), and how to reach a person.
 *
 * Every number on this page is read from the same tables the invoice is priced
 * from — the rate card from PricingRule, the exchange board from
 * PublishedFxRate. A marketing page that hardcodes a price is a page that
 * quietly starts lying the first time Finance changes one.
 */

const SERVICES = [
  {
    icon: Plane,
    title: "Air cargo, duty included",
    body: "Guangzhou and Hong Kong to our Lusaka warehouse. The rate you are quoted covers freight and duty — nothing is added at the counter.",
    tag: "Core service",
  },
  {
    icon: HandCoins,
    title: "We pay your supplier",
    body: "Settle your factory in RMB through us and get the payment proof the same day. One company for the money and the freight.",
    tag: "China desk",
  },
  {
    icon: ClipboardCheck,
    title: "Goods inspection",
    body: "Before anything is packed we check it against your order — quantity, model, obvious damage — and send you the photographs.",
    tag: "Free",
  },
  {
    icon: Truck,
    title: "Collection from suppliers",
    body: "Your supplier does not need to ship anywhere. Give us the address and we collect from their door in Guangzhou.",
    tag: "Free",
  },
  {
    icon: PackageCheck,
    title: "Packing and reinforcement",
    body: "We repack your cargo for the hold at no cost. Cartons that survive a warehouse do not always survive a flight.",
    tag: "Free",
  },
  {
    icon: Receipt,
    title: "Pay freight on collection",
    body: "Established customers ship first and settle in Lusaka. No deposit needed to get your goods moving.",
    tag: "On approval",
  },
];

const REASONS = [
  {
    icon: BadgeCheck,
    title: "The quote is the invoice",
    body: `Duty is settled by us before your cargo lands. There is no clearing bill afterwards, no agent to appoint, and no surprise at the counter.`,
  },
  {
    icon: Boxes,
    title: "Our own warehouses, both ends",
    body: "Guangzhou and Makeni are ours — not agents. The people who weigh your cargo and the people who hand it over work for the same company.",
  },
  {
    icon: ShieldCheck,
    title: "Released only against a scan",
    body: "Every consignment carries a QR label from China. Cargo is handed over when that label scans against a pickup note, and not before.",
  },
  {
    icon: Coins,
    title: "Money handled in the open",
    body: "Exchange and supplier payments are quoted, confirmed with you, and recorded against a named account. A booking is never shown as a completed transfer.",
  },
];

const FAQS: Faq[] = [
  {
    q: "How is my cargo priced?",
    a: (
      <>
        By the weight our Lusaka warehouse puts on the scale at check-in — not
        your supplier&rsquo;s figure and not the estimate on our calculator.
        Anything under {MIN_BILLABLE_KG}&nbsp;kg is billed as{" "}
        {MIN_BILLABLE_KG}&nbsp;kg, and from 10&nbsp;kg the rate per kilo drops.
        Every rate includes freight and duty to our Lusaka warehouse.
      </>
    ),
  },
  {
    q: "How long does it take?",
    a: "Five to twelve days from our Guangzhou counter to our Lusaka warehouse, depending on the route and the airline. Your tracking page shows where the consignment is at each stage rather than a countdown we cannot honour.",
  },
  {
    q: "What does storage cost?",
    a: `Nothing for the first ${STORAGE_POLICY.freeDays} days from the day we check your cargo in at Lusaka. After that it is USD ${STORAGE_POLICY.perDayUsd} per day. Your tracking page shows the check-in date, the days used and any fee, so nobody is surprised by one.`,
  },
  {
    q: "Can you pay my supplier in China?",
    a: "Yes. Send us the supplier's details and the amount; our China desk checks them, confirms the figure with you, pays in RMB and sends you the proof. If the goods are flying with us it is filed against your cargo.",
  },
  {
    q: "Is a money exchange booking a transfer?",
    a: "No, and we are careful about this. Booking puts a request in front of our finance desk, who confirm the rate with you before any money moves. The rates on our exchange page are indicative until that confirmation.",
  },
  {
    q: "What do I need to collect my cargo?",
    a: "A pickup note, which we issue once payment is confirmed or credit is approved. Bring it to the Makeni warehouse — we scan it against your cargo and hand it over.",
  },
];

export default async function HomePage() {
  const [rates, fx] = await Promise.all([publicRateCard(), publishedFxBoard()]);
  const office = COMPANY.offices[0];

  return (
    <>
      {/* ================================================================
          HERO
      ================================================================= */}
      <section className="ai-on-ink relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
        {/* Two soft fields of colour rather than a photograph. A stock cargo
            photo is the single most recognisable thing about a freight template
            and every competitor is using the same three. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full opacity-[0.16] blur-3xl"
          style={{ background: "hsl(var(--ai-emerald))" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-56 -left-32 h-[32rem] w-[32rem] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "hsl(var(--ai-copper))" }}
        />

        <Wrap className="relative">
          <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="ai-rise">
                <Badge tone="ink">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "hsl(var(--ai-copper))" }}
                  />
                  Guangzhou · Hong Kong → Lusaka
                </Badge>
              </div>

              <h1 className="ai-display-xl ai-rise ai-rise-1 mt-7">
                The China–Zambia trade route,
                <br className="hidden sm:block" /> run by{" "}
                <span style={{ color: "hsl(var(--ai-copper))" }}>
                  your own people
                </span>
                .
              </h1>

              <p className="ai-lede ai-rise ai-rise-2 mt-7 max-w-xl">
                Air cargo with duty already included to our Lusaka warehouse. We
                pay your suppliers in RMB, inspect and pack your goods in
                Guangzhou, and change your money at a rate we confirm with you
                first.
              </p>

              <div className="ai-rise ai-rise-3 mt-9">
                <TrackInput />
                <p
                  className="mt-3 text-sm"
                  style={{ color: "hsl(var(--ai-stone)/0.5)" }}
                >
                  Tracking number from your label — or{" "}
                  <Link href="/track" className="ai-link">
                    look it up another way
                  </Link>
                  .
                </p>
              </div>

              <div className="ai-rise ai-rise-4 mt-8 flex flex-wrap gap-2.5">
                <BtnLink href="/calculator" tone="primary">
                  Get a quote
                  <ArrowRight className="h-4 w-4" />
                </BtnLink>
                <BtnLink href="/exchange#rates" tone="outline-invert">
                  <Coins className="h-4 w-4" />
                  Exchange rates
                </BtnLink>
                <BtnLink href="/exchange#book" tone="outline-invert">
                  Book money exchange
                </BtnLink>
              </div>
            </div>

            {/* The corridor, as facts rather than a map. */}
            <div className="ai-rise ai-rise-3">
              <div
                className="rounded-[var(--ai-radius-lg)] border p-7"
                style={{
                  borderColor: "hsl(var(--ai-ink-3))",
                  background: "hsl(var(--ai-ink-2)/0.7)",
                }}
              >
                <Eyebrow copper>The corridor</Eyebrow>
                <dl className="mt-6 space-y-6">
                  {[
                    ["Two loading airports", "Guangzhou and Hong Kong"],
                    ["5–12 days", "Counter in China to our Lusaka floor"],
                    ["Duty included", "Settled by us, before it lands"],
                    [
                      `${STORAGE_POLICY.freeDays} free storage days`,
                      `Then USD ${STORAGE_POLICY.perDayUsd} a day at Makeni`,
                    ],
                  ].map(([term, detail]) => (
                    <div key={term} className="ai-rule pt-6 first:border-0 first:pt-0">
                      <dt className="ai-display-sm">{term}</dt>
                      <dd
                        className="mt-1 text-sm"
                        style={{ color: "hsl(var(--ai-stone)/0.6)" }}
                      >
                        {detail}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </Wrap>
      </section>

      {/* ================================================================
          SERVICES
      ================================================================= */}
      <Section tone="stone" id="services">
        <Wrap>
          <SectionHead
            eyebrow="What we do"
            title="Six things, and five of them cost you nothing extra"
            lede="AITRANSIT is a freight company that also handles the money. Everything below is part of the ordinary service — there is no premium tier."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, body, tag }) => (
              <Card key={title} lift className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl"
                    style={{
                      background: "hsl(var(--ai-emerald-soft))",
                      color: "hsl(var(--ai-emerald))",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge tone={tag === "Free" ? "copper" : "ink"}>{tag}</Badge>
                </div>
                <h3 className="ai-display-sm mt-5">{title}</h3>
                <p
                  className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {body}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-10">
            <Link href="/services" className="ai-link">
              Everything we handle in China
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          PROCESS
      ================================================================= */}
      <Section tone="alt" id="how">
        <Wrap className="mb-14">
          <SectionHead
            eyebrow="How it works"
            title="Six steps, and you only do the first one"
            lede="From your supplier's gate in Guangzhou to your hands in Makeni. Every stage is somebody's named job, and your tracking page moves as they finish it."
          />
        </Wrap>
        <ProcessTimeline />
      </Section>

      {/* ================================================================
          WHY AITRANSIT
      ================================================================= */}
      <Section tone="ink">
        <Wrap>
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHead
              eyebrow="Why AITRANSIT"
              title="Built so you are never surprised"
              lede="Most of what goes wrong with China freight goes wrong after the cargo lands — a duty bill nobody mentioned, a rate that moved, a box handed to the wrong person. Each of these exists to close one of those."
            />
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {REASONS.map(({ icon: Icon, title, body }) => (
                <div key={title}>
                  <Icon
                    className="h-6 w-6"
                    style={{ color: "hsl(var(--ai-copper))" }}
                  />
                  <h3 className="ai-display-sm mt-4">{title}</h3>
                  <p
                    className="mt-2 text-[0.95rem] leading-relaxed"
                    style={{ color: "hsl(var(--ai-stone)/0.66)" }}
                  >
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          RATES
      ================================================================= */}
      <Section tone="stone" id="rates">
        <Wrap>
          <div className="flex flex-wrap items-end justify-between gap-8">
            <SectionHead
              eyebrow="Cargo rates"
              title="Per kilo, duty included, published"
              lede={`Cargo under ${MIN_BILLABLE_KG} kg is billed as ${MIN_BILLABLE_KG} kg. From 10 kg the rate drops. The final figure comes from the weight our Lusaka warehouse confirms.`}
            />
            <BtnLink href="/calculator" tone="ink">
              Price your cargo
              <ArrowRight className="h-4 w-4" />
            </BtnLink>
          </div>

          {rates.length === 0 ? (
            <Card className="mt-12">
              <p style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                Our rate card is being published. Message us on WhatsApp and we
                will quote your cargo directly.
              </p>
            </Card>
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {rates.map((category) => (
                <Card key={category.category} lift className="flex flex-col">
                  <h3 className="ai-display-sm">{category.label}</h3>
                  <p
                    className="mt-2 min-h-[3.25rem] text-sm leading-relaxed"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {category.examples}
                  </p>
                  <dl
                    className="mt-6 space-y-3 border-t pt-6"
                    style={{ borderColor: "hsl(var(--ai-stone-3))" }}
                  >
                    {category.tiers.map((tier) => (
                      <div
                        key={tier.label}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <dt
                          className="text-sm"
                          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                        >
                          {tier.label}
                        </dt>
                        <dd
                          className="ai-num text-lg font-semibold"
                          style={{ color: "hsl(var(--ai-ink))" }}
                        >
                          {tier.price}
                          <span
                            className="ml-1 text-xs font-medium"
                            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                          >
                            /kg
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p
                    className="mt-5 text-xs"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    Flies via {category.route}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </Wrap>
      </Section>

      {/* ================================================================
          MONEY EXCHANGE
      ================================================================= */}
      <Section tone="emerald" id="exchange">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <Eyebrow className="!text-white/70">Money exchange</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                Change money and pay China, without leaving the freight company.
              </h2>
              <p className="ai-lede mt-5">
                Book a rate here and our finance desk confirms it with you before
                anything moves. Nothing on this site presents a booking as a
                completed transfer — because it is not one until a person at
                AITRANSIT says so.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <BtnLink href="/exchange#book" tone="copper">
                  Book money exchange
                </BtnLink>
                <BtnLink href="/exchange#pay-supplier" tone="outline-invert">
                  <Banknote className="h-4 w-4" />
                  Pay a supplier
                </BtnLink>
              </div>
            </div>

            <div>
              {fx.length === 0 ? (
                <div
                  className="rounded-[var(--ai-radius-lg)] border border-white/25 p-8 text-white/80"
                >
                  Today&rsquo;s board is being published. Message us and we will
                  quote you directly.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {fx.map((pair) => (
                    <div
                      key={pair.id}
                      className="rounded-[var(--ai-radius)] border border-white/20 bg-white/[0.08] p-5"
                    >
                      <p className="text-sm font-semibold tracking-wide">
                        {pair.base} → {pair.quote}
                      </p>
                      <dl className="mt-4 space-y-1.5 text-sm">
                        <div className="flex justify-between gap-3">
                          <dt className="text-white/60">Buy</dt>
                          <dd className="ai-num">{pair.buy}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-white/60">Sell</dt>
                          <dd className="ai-num">{pair.sell}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-5 text-xs text-white/60">
                Indicative and subject to confirmation by our finance desk at the
                time of your booking.
              </p>
            </div>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          WAREHOUSES
      ================================================================= */}
      <Section tone="stone" id="warehouses">
        <Wrap>
          <SectionHead
            eyebrow="Where we are"
            title="Two warehouses, both ours"
            lede="Send the Chinese address to your supplier exactly as it appears — it is what their driver reads at our gate."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Card>
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                />
                <Eyebrow>Zambia — collection</Eyebrow>
              </div>
              <h3 className="ai-display mt-5">{office.name}</h3>
              <address
                className="mt-4 not-italic leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {office.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p className="mt-6">
                <Link href="/contact" className="ai-link">
                  Directions and opening hours
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </Card>

            <Card>
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-5 w-5"
                  style={{ color: "hsl(var(--ai-copper))" }}
                />
                <Eyebrow copper>China — supplier drop-off</Eyebrow>
              </div>
              <h3 className="ai-display mt-5">
                {COMPANY.chinaOffice.city} warehouse
              </h3>
              <address className="mt-4 space-y-0.5 not-italic font-medium leading-relaxed">
                {COMPANY.chinaOffice.lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p
                className="mt-3 text-sm"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {COMPANY.chinaOffice.addressEn}
              </p>
              <p className="mt-6">
                <Link href="/china" className="ai-link">
                  Copy the address for your supplier
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </Card>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          TESTIMONIALS
      ================================================================= */}
      <Section tone="alt">
        <Testimonials />
      </Section>

      {/* ================================================================
          FAQ
      ================================================================= */}
      <Section tone="stone" id="faq">
        <Wrap>
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHead
              eyebrow="Questions"
              title="The ones we answer every day"
              lede="If yours is not here, message us — a person replies, usually within the hour during working days."
            />
            <FaqList items={FAQS} />
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          CONTACT
      ================================================================= */}
      <Section tone="ink" id="contact">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Eyebrow copper>Talk to a person</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                Three people, two countries, one company.
              </h2>
              <p className="ai-lede mt-5">
                Ring whoever is closest to your question — Guangzhou for
                suppliers and collection, Lusaka for cargo, money and pickup.
                All three are on WeChat and WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <BtnLink
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  tone="copper"
                  external
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp us
                </BtnLink>
                <BtnLink href="/register" tone="outline-invert">
                  <UserPlus className="h-4 w-4" />
                  Create an account
                </BtnLink>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {COMPANY.contacts.map((contact) => (
                <a
                  key={contact.name}
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="ai-card flex items-center justify-between gap-4 transition-colors hover:border-[hsl(var(--ai-copper)/0.5)]"
                >
                  <span>
                    <span className="block font-semibold">{contact.name}</span>
                    <span
                      className="ai-num mt-0.5 block text-sm"
                      style={{ color: "hsl(var(--ai-stone)/0.66)" }}
                    >
                      {contact.phone}
                    </span>
                    <span
                      className="mt-0.5 block text-xs"
                      style={{ color: "hsl(var(--ai-stone)/0.44)" }}
                    >
                      {contact.channels}
                    </span>
                  </span>
                  <Badge tone="ink">
                    {contact.country === "CHINA" ? "China" : "Zambia"}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
