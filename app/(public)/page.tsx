import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Boxes,
  Building2,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  HandCoins,
  MapPin,
  MessageCircle,
  PackageCheck,
  Phone,
  Plane,
  QrCode,
  Receipt,
  ScanLine,
  Scale,
  ShieldCheck,
  Truck,
  UserPlus,
  Warehouse,
} from "lucide-react";

import { FlightSchedule } from "@/components/site/flight-schedule";
import { Hero } from "@/components/site/hero";
import { LiveStats } from "@/components/site/live-stats";
import { RouteMap } from "@/components/site/route-map";
import { SectionBackdrop } from "@/components/site/section-backdrop";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/constants";
import { publishedFxBoard } from "@/lib/exchange";
import { IMAGES } from "@/lib/imagery";
import { publicRateCard } from "@/lib/rate-card";

/**
 * The AITRANSIT home page.
 *
 * Rewritten from the Target Express original rather than translated. Two
 * structural changes beyond the language:
 *
 *  1. English throughout. Target Express sold into Lusaka es Salaam and its
 *     site was written in Kiswahili, which was correct there and would be
 *     meaningless in Lusaka.
 *
 *  2. AITRANSIT is not only a cargo company. Money exchange and paying
 *     suppliers in China are a second line of business, and the specification
 *     puts them on the home page beside the freight — so there is a rates band
 *     for cargo AND a rates band for currency, and four calls to action rather
 *     than two: track, quote, register, and book an exchange.
 *
 * Every figure on this page is read from the same tables the internal system
 * uses. The cargo rates come from the rate book Finance edits; the exchange
 * rates come from the board Admin publishes. Nothing here is a hardcoded
 * number a customer could be quoted and then billed differently for.
 */

const SERVICES = [
  {
    icon: HandCoins,
    title: "Paying your suppliers",
    body:
      "We settle your supplier in China on your behalf, in RMB, and send you the payment proof. You deal with one company instead of a bank, a broker and a stranger.",
  },
  {
    icon: ClipboardCheck,
    title: "Goods inspection",
    body:
      "Before your goods are packed we check them against your order — quantity, model, obvious damage — and photograph what we find.",
  },
  {
    icon: Truck,
    title: "Collection from suppliers",
    body:
      "You do not need your supplier to ship anywhere. Give us the address and we collect the goods from their door in Guangzhou.",
  },
  {
    icon: PackageCheck,
    title: "Packing, free of charge",
    body:
      "We repack and reinforce your cargo for the flight at no cost. Cartons that survive a warehouse do not always survive a hold.",
  },
  {
    icon: Plane,
    title: "Send in advance, no deposit",
    body:
      "Established customers ship first and settle later. No deposit is required to get your goods moving.",
  },
  {
    icon: Receipt,
    title: "Pay freight on collection",
    body:
      "You can pay the freight when you collect in Lusaka. The price on your invoice includes duty to our warehouse — nothing is added at the counter.",
  },
];

const STEPS = [
  {
    icon: Building2,
    title: "Your supplier delivers in Guangzhou",
    body:
      "Give your supplier our China address. They drop the goods there — that is the whole of your part.",
  },
  {
    icon: Camera,
    title: "We register and photograph it",
    body:
      "We weigh it, count the packages, photograph it and put a QR label on it carrying your tracking number.",
  },
  {
    icon: Plane,
    title: "It flies out on a batch",
    body:
      "Your cargo joins a loading batch — Guangzhou for normal goods and wigs, Hong Kong for the special category. Airline, flight and waybill are recorded.",
  },
  {
    icon: ScanLine,
    title: "We check it in at Lusaka",
    body:
      "Every package is counted against the manifest at our Makeni warehouse. Your tracking page reads Checked in once it is physically on the floor.",
  },
  {
    icon: Receipt,
    title: "You pay and collect",
    body:
      "Finance confirms your payment or approved credit and issues a pickup note. Bring it to Makeni, we scan it, and the cargo is yours.",
  },
];

export default async function HomePage() {
  /* Both bands read the published figures rather than repeating them. A rate
     printed on the home page that disagrees with the rate on the invoice is
     the single most expensive kind of mistake this site can make. */
  const [rates, fx] = await Promise.all([publicRateCard(), publishedFxBoard()]);

  return (
    <>
      <Hero />

      {/* What the company has actually done, counted from the records */}
      <LiveStats />

      {/* The route, with the only moving thing on the site. */}
      <RouteMap />

      {/* ------------------------------------------------------------------
          CARGO RATES. On the home page because it is the first question every
          customer asks, and because the flyer leads with it.
      ------------------------------------------------------------------- */}
      <section id="rates" className="section relative isolate border-y">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-wider text-signal">
                  Air cargo service
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Our rates, duty included
                </h2>
                <p className="mt-4 text-muted-foreground">
                  {COMPANY.dutyNote} Cargo under 1&nbsp;kg is billed as
                  1&nbsp;kg; from 1&nbsp;kg upwards you pay for the weight our
                  Lusaka warehouse confirms on the scale.
                </p>
              </div>
              <Button asChild variant="signal" className="rounded-xl">
                <Link href="/calculator">
                  Get a cargo quote
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {rates.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Our rate card is being published. Message us on WhatsApp for a
                quote in the meantime.
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rates.map((category) => (
                  <div
                    key={category.category}
                    className="rounded-xl border bg-card p-6 shadow-soft"
                  >
                    <h3 className="font-display text-xl font-semibold">
                      {category.label}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {category.examples}
                    </p>
                    <ul className="mt-5 space-y-2 border-t pt-4">
                      {category.tiers.map((tier) => (
                        <li
                          key={tier.label}
                          className="flex items-baseline justify-between gap-3"
                        >
                          <span className="text-sm text-muted-foreground">
                            {tier.label}
                          </span>
                          <span className="font-display text-lg font-bold tabular">
                            {tier.price}
                            <span className="ml-1 text-xs font-medium text-muted-foreground">
                              /kg
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Flies via {category.route}.
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/pricing">
                  Full rate card
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/track">
                  <QrCode className="mr-2 h-4 w-4" />
                  Track cargo
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/register">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------
          MONEY EXCHANGE. The second line of business, given the same weight
          as the freight rather than buried on an inside page.
      ------------------------------------------------------------------- */}
      <section
        id="exchange"
        className="section relative isolate border-y bg-[hsl(var(--ink))] text-white"
      >
        <SectionBackdrop variant="photo" image={IMAGES.airportNight} />
        <div className="container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-wider text-gold">
                  Money exchange
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Change money, and pay China from Lusaka
                </h2>
                <p className="mt-4 text-white/70">
                  We exchange currency and settle supplier payments in China for
                  our customers. Book a rate here and our finance desk confirms
                  it with you before any money moves.
                </p>
              </div>
              <Link
                href="/exchange"
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
              >
                <Coins className="h-4 w-4" />
                Book money exchange
              </Link>
            </div>

            {fx.length === 0 ? (
              <p className="mt-8 rounded-xl border border-dashed border-white/20 p-6 text-sm text-white/60">
                Today&rsquo;s rates are being published. Message us and we will
                quote you directly.
              </p>
            ) : (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {fx.map((pair) => (
                  <div
                    key={pair.id}
                    className="rounded-xl border border-white/15 bg-white/5 p-5"
                  >
                    <p className="font-display text-lg font-bold">
                      {pair.base} → {pair.quote}
                    </p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex items-baseline justify-between">
                        <dt className="text-white/55">We buy at</dt>
                        <dd className="font-mono tabular">{pair.buy}</dd>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <dt className="text-white/55">We sell at</dt>
                        <dd className="font-mono tabular">{pair.sell}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}

            {/* Said once, plainly, and repeated on the exchange page itself. A
                published rate is an indication, not a contract — the desk
                confirms before anything is transferred. */}
            <p className="mt-6 text-xs text-white/50">
              Rates are indicative and subject to confirmation by our finance
              desk at the time of your booking.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/exchange#pay-supplier"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-medium transition-colors hover:bg-white/10"
              >
                <Banknote className="h-4 w-4" />
                Pay a supplier in China
              </Link>
              <Link
                href="/exchange#calculator"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-medium transition-colors hover:bg-white/10"
              >
                <Scale className="h-4 w-4" />
                Currency calculator
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The next planes out. Nothing else on the page has a deadline on it. */}
      <section className="section relative isolate border-b">
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Next flights out
              </h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Get your cargo to our Guangzhou warehouse before the cut-off and
                it goes on that batch.
              </p>
            </div>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              Full schedule
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <FlightSchedule className="mt-8" />

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="signal" className="rounded-xl">
              <Link href="/book">
                Book your cargo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/pickup">We collect from your supplier</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* China — the address a supplier actually needs */}
      <section id="china" className="section relative isolate border-b bg-muted/30">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-signal">
                  Address in China
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Send your supplier this address
                </h2>
                <p className="mt-4 text-muted-foreground">
                  This is our Guangzhou warehouse. Send it to your supplier in
                  Chinese exactly as it appears — that is what their driver
                  reads at the gate.
                </p>

                <div className="mt-6 rounded-xl border-2 border-signal/30 bg-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    地址 / Address
                  </p>
                  <div className="mt-2 space-y-1 text-lg font-semibold leading-relaxed">
                    {COMPANY.chinaOffice.lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {COMPANY.chinaOffice.addressEn}
                    <br />
                    {COMPANY.chinaOffice.rooms}
                  </p>

                  <div className="mt-4 border-t pt-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      电话 / Phone — WeChat &amp; WhatsApp
                    </p>
                    <ul className="mt-2 space-y-1">
                      {COMPANY.chinaOffice.phones.map((phone) => (
                        <li key={phone}>
                          <a
                            href={`tel:${phone.replace(/\s/g, "")}`}
                            className="font-mono text-sm tabular hover:text-signal"
                          >
                            {phone}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="signal" className="rounded-xl">
                    <Link href="/china">
                      Get the China address
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <a
                      href={`https://wa.me/${COMPANY.whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Ask on WhatsApp
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border shadow-lift">
                <Image
                  src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=70"
                  alt="Cargo stacked and labelled inside the warehouse"
                  width={1200}
                  height={900}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Services — the six on the flyer, in the flyer's own words */}
      <section id="services" className="section relative isolate">
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-signal">
                Our air cargo services
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Everything between your supplier and your shop
              </h2>
              <p className="mt-4 text-muted-foreground">
                One route, one price, one tracking number. Everything below is
                part of the ordinary service — there is no extra charge for any
                of it.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border bg-card p-6 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-signal/10 text-signal">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-semibold">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              ))}
            </div>

            <Button asChild variant="outline" className="mt-10 rounded-xl">
              <Link href="/services">
                All cargo services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="process" className="section relative isolate border-t bg-muted/30">
        <div className="container">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-wider text-signal">
                How it works
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Five steps, and you only do the first one
              </h2>
            </div>

            <ol className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map(({ icon: Icon, title, body }, index) => (
                <li
                  key={title}
                  className="rounded-xl border bg-card p-5 shadow-soft"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-semibold">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Storage terms, said before a customer is billed for them */}
      <section className="section relative isolate border-t">
        <div className="container">
          <Reveal>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-signal">
                  Collection &amp; storage
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Seven free days, then USD&nbsp;2 a day
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Storage is free for the first seven days from the moment our
                  Lusaka warehouse checks your cargo in. After that a storage
                  fee of USD&nbsp;2 per day applies. Your tracking page shows
                  the check-in date, the days used and any fee, so nobody is
                  ever surprised by one.
                </p>
                <ul className="mt-6 space-y-2 text-sm">
                  {[
                    "The clock starts at check-in in Lusaka, not at dispatch.",
                    "It stops the moment you collect.",
                    "Cargo is released only against a valid pickup note.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border bg-card p-8 shadow-soft">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                  <MapPin className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold">
                  {COMPANY.offices[0].name}
                </h3>
                <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                  {COMPANY.offices[0].lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <ul className="mt-5 space-y-2 border-t pt-5 text-sm">
                  {COMPANY.contacts.map((contact) => (
                    <li key={contact.name} className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-signal" />
                      <span className="font-medium">{contact.name}</span>
                      <a
                        href={`tel:${contact.phone.replace(/\s/g, "")}`}
                        className="font-mono tabular hover:text-signal"
                      >
                        {contact.phone}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild variant="signal" className="rounded-xl">
                    <Link href="/track">Track cargo</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link href="/contact">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Contact us
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Close: the four things a visitor can do */}
      <section className="section relative isolate border-t bg-brand text-brand-foreground">
        <div className="container text-center">
          <Warehouse className="mx-auto h-10 w-10 text-gold" />
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {COMPANY.tagline}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-brand-foreground/75">
            Air cargo from China to Lusaka, supplier payments, and money
            exchange — from one company, with one number to ring.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="signal" className="rounded-xl">
              <Link href="/track">Track cargo</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/calculator">Get a cargo quote</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-brand-foreground/25 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
            >
              <Link href="/register">Register</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl border-brand-foreground/25 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground"
            >
              <Link href="/exchange">Book money exchange</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
