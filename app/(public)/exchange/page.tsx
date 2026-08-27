import type { Metadata } from "next";
import Link from "next/link";
import { Banknote, Coins, HandCoins, MessageCircle, Phone, ShieldCheck } from "lucide-react";

import {
  CurrencyCalculator,
  ExchangeBookingForm,
  SupplierPaymentRequestForm,
} from "@/components/site/exchange-forms";
import { PageHero } from "@/components/site/page-hero";
import { SectionBackdrop } from "@/components/site/section-backdrop";
import { COMPANY } from "@/lib/constants";
import { publishedFxBoard } from "@/lib/exchange";
import { IMAGES } from "@/lib/imagery";

export const metadata: Metadata = {
  title: "Money exchange & China payments",
  description:
    "AITRANSIT exchange rates, currency calculator, and requests to pay your supplier in China from Lusaka.",
};

/**
 * The money desk, as a customer sees it.
 *
 * The whole page is written to keep one distinction visible: a RATE is
 * published, a REQUEST is submitted, and neither is a transfer. The board says
 * "subject to confirmation", the calculator says "indicative", and both forms
 * end on a reference number and a sentence explaining that the finance desk
 * confirms before money moves.
 *
 * That is not legal caution for its own sake — it is what the internal workflow
 * actually does. Nothing here can produce a completed transaction, because the
 * only row the public action can write is an ExchangeRequest in status NEW.
 */
export default async function ExchangePage() {
  const board = await publishedFxBoard();

  return (
    <>
      <PageHero
        image={IMAGES.airportNight}
        eyebrow="Money exchange"
        title="Change money, and pay China from Lusaka"
        body="Published rates, a calculator, and one desk that handles both your currency and your supplier — the same desk that flies your cargo."
      />

      {/* ---------------------------------------------------------------- */}
      {/* The board                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="rates"
        className="relative isolate border-b bg-[hsl(var(--ink))] py-14 text-white md:py-20"
      >
        <SectionBackdrop variant="photo" image={IMAGES.airportNight} />
        <div className="container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Today&rsquo;s rates
              </h2>
              <p className="mt-2 max-w-xl text-white/65">
                What we buy and sell at. Our finance desk confirms the exact rate
                with you when you book.
              </p>
            </div>
            <a
              href={`https://wa.me/${COMPANY.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" />
              Ask for a rate
            </a>
          </div>

          {board.length === 0 ? (
            <p className="mt-8 rounded-xl border border-dashed border-white/20 p-6 text-sm text-white/60">
              We have not published today&rsquo;s board yet. Message us and we
              will quote you directly.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {board.map((pair) => (
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
                  {pair.note ? (
                    <p className="mt-3 border-t border-white/10 pt-3 text-xs text-white/50">
                      {pair.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 flex items-start gap-2 text-xs text-white/50">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Rates are indicative and subject to confirmation by our finance desk
            at the time of your booking. A booking is not a transfer — nothing
            moves until we have confirmed it with you.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Calculator                                                        */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="calculator"
        className="relative isolate border-b bg-[hsl(var(--ink))] py-14 text-white md:py-20"
      >
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-gold">
              Currency calculator
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">
              Work out what you would get
            </h2>
            <p className="mt-3 text-white/65">
              Against today&rsquo;s published board. The figure is indicative —
              your confirmed rate is the one the desk agrees with you.
            </p>
            <div className="mt-8">
              <CurrencyCalculator board={board} />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Book an exchange                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="book"
        className="relative isolate border-b bg-[hsl(var(--ink))] py-14 text-white md:py-20"
      >
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Coins className="h-5 w-5" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">
                Book a money exchange
              </h2>
              <p className="mt-3 text-white/65">
                Tell us what you are changing and how much. We hold the request,
                confirm the rate with you, and take the money once you agree.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-white/70">
                {[
                  "No money changes hands until we have confirmed the rate.",
                  "You get a reference number to quote on WhatsApp or at the office.",
                  "Cash, bank transfer or mobile money.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 space-y-2 border-t border-white/10 pt-6 text-sm">
                {COMPANY.contacts.map((contact) => (
                  <p key={contact.name} className="flex items-center gap-2 text-white/70">
                    <Phone className="h-4 w-4 shrink-0 text-gold" />
                    <span className="font-medium text-white">{contact.name}</span>
                    <a
                      href={`tel:${contact.phone.replace(/\s/g, "")}`}
                      className="font-mono tabular hover:text-gold"
                    >
                      {contact.phone}
                    </a>
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <ExchangeBookingForm />
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Pay a supplier                                                    */}
      {/* ---------------------------------------------------------------- */}
      <section
        id="pay-supplier"
        className="relative isolate bg-[hsl(var(--ink))] py-14 text-white md:py-20"
      >
        <SectionBackdrop variant="aurora" />
        <div className="container">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <HandCoins className="h-5 w-5" />
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">
                Pay your supplier in China
              </h2>
              <p className="mt-3 text-white/65">
                Send us the supplier&rsquo;s details and the amount. We settle
                them in China, send you the payment proof, and — if the goods are
                coming with us — file it against your cargo.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-white/70">
                {[
                  "One company for the payment and the freight.",
                  "Payment proof sent to you, and kept on your record.",
                  "We check the supplier's details before anything is sent.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/55">
                Already a customer?{" "}
                <Link href="/portal" className="text-gold underline">
                  Sign in to your portal
                </Link>{" "}
                and your request arrives with your account and cargo already
                attached.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <SupplierPaymentRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
