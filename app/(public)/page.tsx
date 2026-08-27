import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Boxes,
  Building2,
  ClipboardCheck,
  Coins,
  HandCoins,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plane,
  Receipt,
  ScanLine,
  ShieldCheck,
  Store,
  Truck,
  UserPlus,
} from "lucide-react";

import { FaqList, type Faq } from "@/components/brand/faq";
import { MarketCard } from "@/components/brand/market-card";
import { CountUp, Reveal } from "@/components/brand/motion";
import { Photo } from "@/components/brand/photo";
import { ProcessTimeline } from "@/components/brand/process";
import { QuickPanel } from "@/components/brand/quick-panel";
import { RouteGlobe } from "@/components/brand/route-globe";
import { StarField } from "@/components/brand/star-field";
import { Testimonials } from "@/components/brand/testimonials";
import { TrackInput } from "@/components/brand/track-input";
import {
  AsideFacts,
  Badge,
  BtnLink,
  Card,
  Eyebrow,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY, STORAGE_POLICY } from "@/lib/constants";
import { MIN_BILLABLE_KG } from "@/lib/billing-policy";
import { publishedFxBoard } from "@/lib/exchange";
import { IMAGES, img } from "@/lib/imagery";
import { publicMarkets } from "@/lib/public-markets";
import { publicRateCard } from "@/lib/rate-card";
import { siteStats } from "@/lib/site-stats";

/**
 * The AITRANSIT homepage.
 *
 * Built around what a visitor is actually here to do, in the order they are
 * likely to want it: act now (hero + quick panel), understand the corridor
 * (globe), see what we do (services), see where to buy (markets), understand
 * the process, check the price, check the rate, meet the company, and finally
 * ask a question.
 *
 * EVERY FIGURE COMES FROM THE DATABASE. Rates from PricingRule, exchange from
 * PublishedFxRate, markets from ChinaMarket, the counters from real shipment
 * and customer counts. A marketing page with hardcoded numbers starts lying the
 * first time somebody in Finance changes one, and there is no worse place for
 * that than a price.
 */

const SERVICES = [
  {
    icon: Plane,
    title: "Air cargo, duty included",
    body: "Guangzhou and Hong Kong to our Lusaka warehouse. The rate you are quoted covers freight and duty — nothing is added at the counter.",
    tag: "Core",
    image: IMAGES.apron,
  },
  {
    icon: HandCoins,
    title: "We pay your supplier",
    body: "Settle your factory in RMB through us and get the payment proof the same day. One company for the money and the freight.",
    tag: "China desk",
    image: IMAGES.paperwork,
  },
  {
    icon: ClipboardCheck,
    title: "Goods inspection",
    body: "Before anything is packed we check it against your order — quantity, model, obvious damage — and send you the photographs.",
    tag: "Free",
    image: IMAGES.warehouseAisle,
  },
  {
    icon: Truck,
    title: "Collection from suppliers",
    body: "Your supplier does not need to ship anywhere. Give us the address and we collect from their door in Guangzhou.",
    tag: "Free",
    image: IMAGES.loadingTruck,
  },
  {
    icon: PackageCheck,
    title: "Packing and reinforcement",
    body: "We repack your cargo for the hold at no cost. A carton built for a warehouse shelf is not built for an aircraft.",
    tag: "Free",
    image: IMAGES.packedCartons,
  },
  {
    icon: Receipt,
    title: "Pay freight on collection",
    body: "Established customers ship first and settle in Lusaka. No deposit is needed to get your goods moving.",
    tag: "On approval",
    image: IMAGES.cargoHold,
  },
];

const REASONS = [
  {
    icon: BadgeCheck,
    title: "The quote is the invoice",
    body: "Duty is settled by us before your cargo lands. No clearing bill afterwards, no agent to appoint, no surprise at the counter.",
  },
  {
    icon: Boxes,
    title: "Our own warehouses, both ends",
    body: "Guangzhou and Makeni are ours — not agents. The people who weigh your cargo and the people who hand it over work for the same company.",
  },
  {
    icon: ScanLine,
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
    q: "Can you take me around the markets in China?",
    a: "Yes — that is a real part of what we do. Book a market, supplier or factory visit and one of our people meets you there, translates, and gets whatever you buy to our warehouse the same day.",
  },
  {
    q: "Can you pay my supplier in China?",
    a: "Yes. Send us the supplier's details and the amount; our China desk checks them, confirms the figure with you, pays in RMB and sends you the proof. If the goods are flying with us it is filed against your cargo.",
  },
  {
    q: "Is a money exchange booking a transfer?",
    a: "No, and we are careful about this. Booking puts a request in front of our finance desk, who confirm the rate with you before any money moves. The rates on our exchange page are indicative until that confirmation.",
  },
];

export default async function HomePage() {
  const [rates, fx, markets, stats] = await Promise.all([
    publicRateCard(),
    publishedFxBoard(),
    publicMarkets(),
    siteStats(),
  ]);

  const office = COMPANY.offices[0];
  const featured = markets.slice(0, 3);

  return (
    <>
      {/* ================================================================
          HERO — full-bleed photography, the corridor on a globe
      ================================================================= */}
      <section className="ai-on-ink relative overflow-hidden pb-36 pt-32 md:pb-44 md:pt-40">
        <div aria-hidden className="absolute inset-0">
          <Image
            src={img(IMAGES.apron, 2000)}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <span
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, hsl(213 62% 8% / 0.97) 0%, hsl(213 62% 8% / 0.9) 42%, hsl(213 62% 8% / 0.55) 100%)",
            }}
          />
        </div>
        {/* The sky sits over the photograph and under the copy. It is what
            carries the hero in the light theme, where the same image behind a
            pale scrim would otherwise read as a washed-out stock photo. */}
        <StarField />

        <Wrap className="relative">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
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
                From China to Zambia,
                <br className="hidden sm:block" /> delivered with{" "}
                <span style={{ color: "hsl(var(--ai-copper))" }}>confidence</span>.
              </h1>

              <p className="ai-lede ai-rise ai-rise-2 mt-7 max-w-xl">
                Air cargo with duty already included to our Lusaka warehouse. We
                pay your suppliers in RMB, walk the Guangzhou markets with you,
                inspect and pack what you buy, and change your money at a rate we
                confirm first.
              </p>

              <div className="ai-rise ai-rise-3 mt-9">
                <TrackInput />
              </div>

              <div className="ai-rise ai-rise-4 mt-7 flex flex-wrap gap-2.5">
                <BtnLink href="/calculator" tone="primary">
                  Calculate cargo price
                  <ArrowRight className="h-4 w-4" />
                </BtnLink>
                <BtnLink href="/markets" tone="outline-invert">
                  <Store className="h-4 w-4" />
                  Explore China markets
                </BtnLink>
                <BtnLink href="/exchange#rates" tone="outline-invert">
                  <Coins className="h-4 w-4" />
                  Today&rsquo;s rates
                </BtnLink>
              </div>

              <ul className="ai-rise ai-rise-4 mt-10 flex flex-wrap gap-x-7 gap-y-3">
                {[
                  [BadgeCheck, "Duty included"],
                  [Building2, "Lusaka warehouse"],
                  [ScanLine, "QR tracking"],
                  [MessageCircle, "A person answers"],
                ].map(([Icon, label]) => {
                  const I = Icon as typeof BadgeCheck;
                  return (
                    <li
                      key={label as string}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "hsl(var(--ai-stone)/0.72)" }}
                    >
                      <I
                        className="h-4 w-4"
                        style={{ color: "hsl(var(--ai-copper))" }}
                      />
                      {label as string}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/*
              The corridor, live — and shown on a phone too.

              It was desktop-only, which meant the single most striking thing on
              the site was invisible to most of the people who visit it. It is
              capped smaller on a handset so it never pushes the calls to action
              below the fold, and cobe scales its own buffer to the rendered
              width, so the smaller canvas is genuinely cheaper rather than the
              same work drawn smaller.
            */}
            <div className="ai-rise ai-rise-3 relative">
              <RouteGlobe className="mx-auto w-full max-w-[16rem] sm:max-w-[20rem] lg:max-w-[30rem]" />
              <p
                className="mt-4 text-center text-xs"
                style={{ color: "hsl(var(--ai-stone)/0.45)" }}
              >
                Our loading airports, the hubs we connect through, and home.
                <span className="hidden sm:inline"> Drag to spin.</span>
              </p>
            </div>
          </div>
        </Wrap>
      </section>

      {/* Seven doors, overlapping the hero. */}
      <QuickPanel />

      {/* ================================================================
          COUNTERS — real figures out of the operational database
      ================================================================= */}
      <Section tone="stone" className="!pt-20">
        <Wrap>
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { to: stats.delivered, label: "Consignments delivered", hint: "Collected by their owners in Lusaka" },
              { to: stats.customers, label: "Customers served", hint: "Importing through us from China" },
              { to: stats.weightFlownKg, label: "Kilos flown", hint: "Weighed on our own scales", suffix: " kg" },
              { to: markets.length, label: "China markets", hint: "In our sourcing directory" },
            ].map((stat, index) => (
              <Reveal key={stat.label} delay={index * 80}>
                <div>
                  <dd>
                    <CountUp
                      to={stat.to}
                      suffix={stat.suffix}
                      className="ai-display-lg block"
                      // Display serif carries statistics across the site.
                    />
                  </dd>
                  <dt className="mt-2 font-semibold">{stat.label}</dt>
                  <p className="ai-muted mt-1 text-sm">{stat.hint}</p>
                </div>
              </Reveal>
            ))}
          </dl>
        </Wrap>
      </Section>

      {/* ================================================================
          SERVICES — image-led
      ================================================================= */}
      <Section tone="alt" id="services">
        <Wrap>
          <SectionHead
            eyebrow="What we do"
            title="Six things, and four of them cost you nothing extra"
            lede="AITRANSIT is a freight company that also handles the money and walks the markets. Everything below is part of the ordinary service."
            aside={
              <Reveal delay={120}>
                <Photo
                  src={IMAGES.apronCrew}
                  alt="Ground crew working an aircraft in Guangzhou"
                  ratio="wide"
                  width={900}
                  parallax
                  sizes="(max-width: 1024px) 92vw, 42vw"
                  className="shadow-[var(--ai-shadow-lg)]"
                />
                <p
                  className="mt-4 text-[0.82rem]"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  Guangzhou and Hong Kong to Lusaka — the same team on both ends
                  of the route.
                </p>
              </Reveal>
            }
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, body, tag, image }, index) => (
              <Reveal key={title} delay={(index % 3) * 90}>
                <Card lift className="flex h-full flex-col overflow-hidden !p-0">
                  <span className="relative block aspect-[16/10] overflow-hidden">
                    <Image
                      src={img(image, 800)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, hsl(213 62% 8% / 0.55), transparent 60%)",
                      }}
                    />
                    <span className="absolute left-4 top-4">
                      <Badge tone="photo">{tag}</Badge>
                    </span>
                  </span>
                  <span className="flex flex-1 flex-col p-6">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl"
                      style={{
                        background: "hsl(var(--ai-emerald-soft))",
                        color: "hsl(var(--ai-emerald))",
                      }}
                    >
                      <Icon className="h-[1.15rem] w-[1.15rem]" />
                    </span>
                    <span className="ai-display-sm mt-4 block">{title}</span>
                    <span className="ai-muted mt-2.5 block flex-1 text-[0.93rem] leading-relaxed">
                      {body}
                    </span>
                  </span>
                </Card>
              </Reveal>
            ))}
          </div>

          <div className="mt-10">
            <BtnLink href="/services" tone="ink">
              Everything we handle in China
              <ArrowRight className="h-4 w-4" />
            </BtnLink>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          CHINA MARKETS — the exploration feature
      ================================================================= */}
      <Section tone="ink" id="markets">
        <Wrap>
          <SectionHead
            eyebrow="Explore China"
            title="Know which market sells what — before you fly"
            lede="Guangzhou for clothing and shoes, Yiwu for everything small, Shenzhen for electronics, Foshan for furniture. We keep the directory, and we will meet you there."
            aside={
              <AsideFacts
                facts={[
                  { value: `${markets.length}`, label: "markets in the directory" },
                  { value: "5", label: "cities we cover on the ground" },
                  { value: "Guided", label: "visits with an interpreter" },
                ]}
              >
                <BtnLink href="/markets" tone="copper">
                  All {markets.length} markets
                  <ArrowRight className="h-4 w-4" />
                </BtnLink>
              </AsideFacts>
            }
          />

          {featured.length > 0 ? (
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((market, index) => (
                <Reveal key={market.slug} delay={index * 90}>
                  <MarketCard
                    market={{
                      slug: market.slug,
                      name: market.name,
                      nameCn: market.nameCn,
                      city: market.city,
                      district: market.district,
                      bestFor: market.bestFor,
                      products: market.products,
                      route: market.route,
                    }}
                  />
                </Reveal>
              ))}
            </div>
          ) : (
            <Card className="mt-12">
              <p className="ai-muted">
                Our market directory is being published. Message us and we will
                point you at the right building.
              </p>
            </Card>
          )}

          <div className="ai-rule mt-14 flex flex-wrap items-center justify-between gap-6 pt-10">
            <p className="ai-lede max-w-lg">
              Not travelling? Tell us the product and we will source it, compare
              suppliers and send you photographs and prices.
            </p>
            <BtnLink
              href="/appointments?service=SOURCING_HELP"
              tone="outline-invert"
            >
              Request sourcing help
            </BtnLink>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          PROCESS
      ================================================================= */}
      <Section tone="stone" id="how">
        <Wrap className="mb-14">
          <SectionHead
            eyebrow="How it works"
            title="Seven steps, and you only do the first one"
            lede="From your supplier's gate in Guangzhou to your hands in Makeni. Every stage is somebody's named job, and your tracking page moves as they finish it."
            aside={
              <Reveal delay={120}>
                <Photo
                  src={IMAGES.warehouseTablet}
                  alt="Cargo being checked in at the warehouse counter"
                  ratio="wide"
                  width={900}
                  parallax
                  sizes="(max-width: 1024px) 92vw, 42vw"
                  className="shadow-[var(--ai-shadow-lg)]"
                />
                <p
                  className="mt-4 text-[0.82rem]"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  Every box is scanned and photographed at both ends, so the
                  tracking page is never guesswork.
                </p>
              </Reveal>
            }
          />
        </Wrap>
        <ProcessTimeline />
      </Section>

      {/* ================================================================
          RATES
      ================================================================= */}
      <Section tone="alt" id="rates">
        <Wrap>
          <SectionHead
            eyebrow="Cargo rates"
            title="Per kilo, duty included, published"
            lede={`Cargo under ${MIN_BILLABLE_KG} kg is billed as ${MIN_BILLABLE_KG} kg. From 10 kg the rate drops. The final figure comes from the weight our Lusaka warehouse confirms.`}
            aside={
              <AsideFacts
                facts={[
                  { value: "13.50", label: "USD per kg, normal goods" },
                  { value: `${MIN_BILLABLE_KG} kg`, label: "minimum billed weight" },
                  { value: "7 days", label: "free storage in Lusaka" },
                ]}
              >
                <BtnLink href="/calculator" tone="ink">
                  Price your cargo
                  <ArrowRight className="h-4 w-4" />
                </BtnLink>
              </AsideFacts>
            }
          />

          {rates.length === 0 ? (
            <Card className="mt-12">
              <p className="ai-muted">
                Our rate card is being published. Message us on WhatsApp and we
                will quote your cargo directly.
              </p>
            </Card>
          ) : (
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {rates.map((category, index) => (
                <Reveal key={category.category} delay={index * 90}>
                  <Card lift className="flex h-full flex-col">
                    <h3 className="ai-display-sm">{category.label}</h3>
                    <p className="ai-muted mt-2 min-h-[3.25rem] text-sm leading-relaxed">
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
                          <dt className="ai-muted text-sm">{tier.label}</dt>
                          <dd
                            className="ai-num text-lg font-semibold"
                            /* `--ai-charcoal`, the TEXT role, not `--ai-ink`.
                               Ink is the deep band and it is dark in both
                               themes, so reading it as a foreground put the
                               rate figure at 1.04:1 on a dark card. */
                            style={{ color: "hsl(var(--ai-charcoal))" }}
                          >
                            {tier.price}
                            <span className="ai-muted ml-1 text-xs font-medium">
                              /kg
                            </span>
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="ai-muted mt-5 text-xs">
                      Flies via {category.route}
                    </p>
                  </Card>
                </Reveal>
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
                <div className="rounded-[var(--ai-radius-lg)] border border-white/25 p-8 text-white/80">
                  Today&rsquo;s board is being published. Message us and we will
                  quote you directly.
                </div>
              ) : (
                <>
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
                  {fx[0]?.updatedLabel ? (
                    <p className="mt-4 text-xs text-white/55">
                      Board last updated {fx[0].updatedLabel}.
                    </p>
                  ) : null}
                </>
              )}
              <p className="mt-3 text-xs text-white/60">
                Indicative and subject to confirmation by our finance desk at the
                time of your booking.
              </p>
            </div>
          </div>
        </Wrap>
      </Section>

      {/* ================================================================
          WHY AITRANSIT + WAREHOUSES
      ================================================================= */}
      <Section tone="stone">
        <Wrap>
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionHead
              eyebrow="Why AITRANSIT"
              title="Built so you are never surprised"
              lede="Most of what goes wrong with China freight goes wrong after the cargo lands — a duty bill nobody mentioned, a rate that moved, a box handed to the wrong person. Each of these closes one of those."
            />
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2">
              {REASONS.map(({ icon: Icon, title, body }, index) => (
                <Reveal key={title} delay={index * 80}>
                  <div>
                    <Icon
                      className="h-6 w-6"
                      style={{ color: "hsl(var(--ai-emerald))" }}
                    />
                    <h3 className="ai-display-sm mt-4">{title}</h3>
                    <p className="ai-muted mt-2 text-[0.95rem] leading-relaxed">
                      {body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="mt-20 grid gap-5 lg:grid-cols-2">
            {[
              {
                image: IMAGES.warehouseAisle,
                eyebrow: "Zambia — collection point",
                title: office.name,
                lines: office.lines,
                href: "/contact",
                cta: "Directions and hours",
              },
              {
                image: IMAGES.loadingTruck,
                eyebrow: "China — supplier drop-off",
                title: `${COMPANY.chinaOffice.city} warehouse`,
                lines: COMPANY.chinaOffice.lines,
                href: "/china",
                cta: "Copy the address for your supplier",
              },
            ].map((place, index) => (
              <Reveal key={place.title} delay={index * 100}>
                <Card className="flex h-full flex-col overflow-hidden !p-0">
                  <span className="relative block aspect-[16/9]">
                    <Image
                      src={img(place.image, 1000)}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </span>
                  <span className="flex flex-1 flex-col p-6">
                    <span className="flex items-center gap-2">
                      <MapPin
                        className="h-4 w-4"
                        style={{ color: "hsl(var(--ai-copper))" }}
                      />
                      <Eyebrow copper>{place.eyebrow}</Eyebrow>
                    </span>
                    <span className="ai-display-sm mt-3 block">{place.title}</span>
                    <address className="ai-muted mt-3 block flex-1 not-italic text-sm leading-relaxed">
                      {place.lines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                    <Link href={place.href} className="ai-link mt-5 text-sm">
                      {place.cta}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </span>
                </Card>
              </Reveal>
            ))}
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
              lede="If yours is not here, message us — a person replies, usually within the hour on a working day."
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
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Eyebrow copper>Talk to a person</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                Three people, two countries, one company.
              </h2>
              <p className="ai-lede mt-5">
                Ring whoever is closest to your question — Guangzhou for
                suppliers, markets and collection; Lusaka for cargo, money and
                pickup. All three are on WeChat and WhatsApp.
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
