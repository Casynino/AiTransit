import type { Metadata } from "next";
import { Banknote, Coins, MessageCircle, ShieldCheck } from "lucide-react";

import {
  CurrencyCalculator,
  ExchangeBookingForm,
  SupplierPaymentRequestForm,
} from "@/components/brand/exchange-forms";
import {
  AsideFacts,
  BtnLink,
  Card,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY } from "@/lib/constants";
import { publishedFxBoard } from "@/lib/exchange";
import { IMAGES } from "@/lib/imagery";
import { PhotoBand } from "@/components/brand/photo-band";
import { PhotoDuo } from "@/components/brand/photo";

export const metadata: Metadata = {
  title: "Money exchange & China payments",
  description:
    "AITRANSIT exchange rates, a currency calculator, and requests to pay your supplier in China — reviewed and confirmed by our finance desk before anything moves.",
};

/**
 * The money desk, as a customer meets it.
 *
 * The page is written around one distinction, repeated wherever it matters: a
 * RATE is published, a REQUEST is submitted, and neither is a transfer. That is
 * not legal caution for its own sake — it is what the workflow behind it
 * actually does. The only row a member of the public can create is a request in
 * status NEW; a person at AITRANSIT moves it from there.
 */
export default async function ExchangePage() {
  const board = await publishedFxBoard();

  return (
    <>
      <PageHero
        eyebrow="Money exchange"
        title="Change money and pay China, at a rate we confirm first"
        lede="The same company that flies your cargo handles the currency behind it. Book a rate here; our finance desk agrees it with you before any money moves."
        media={
          <PhotoDuo
            main={IMAGES.countingCash}
            inset={IMAGES.banknotesFan}
            mainAlt="Banknotes being counted at a desk"
            insetAlt="Assorted currency"
            priority
          />
        }
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="#book" tone="copper">
            <Coins className="h-4 w-4" />
            Book money exchange
          </BtnLink>
          <BtnLink href="#pay-supplier" tone="outline-invert">
            <Banknote className="h-4 w-4" />
            Pay a supplier in China
          </BtnLink>
        </div>
      </PageHero>

      {/* The board */}
      <Section tone="stone" id="rates">
        <Wrap>
          <SectionHead
            eyebrow="Today's rates"
            title="What we buy and sell at"
            lede="Published so you can plan. Confirmed by a person before you commit."
            aside={
              <AsideFacts
                facts={[
                  { value: `${board.length}`, label: "pairs on the board" },
                  { value: "Daily", label: "reviewed by our finance desk" },
                  { value: "Person", label: "confirms before money moves" },
                ]}
              >
                <BtnLink
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  tone="outline"
                  external
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask for a rate
                </BtnLink>
              </AsideFacts>
            }
          />

          {board.length === 0 ? (
            <Card className="mt-12">
              <p style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                We have not published today&rsquo;s board yet. Message us and we
                will quote you directly.
              </p>
            </Card>
          ) : (
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {board.map((pair) => (
                <Card key={pair.id} lift>
                  <p className="ai-display-sm">
                    {pair.base} <span style={{ color: "hsl(var(--ai-copper))" }}>→</span>{" "}
                    {pair.quote}
                  </p>
                  <dl
                    className="mt-5 space-y-2.5 border-t pt-5 text-sm"
                    style={{ borderColor: "hsl(var(--ai-stone-3))" }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <dt style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                        We buy
                      </dt>
                      <dd className="ai-num font-semibold">{pair.buy}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                        We sell
                      </dt>
                      <dd className="ai-num font-semibold">{pair.sell}</dd>
                    </div>
                  </dl>
                  {pair.note ? (
                    <p
                      className="mt-4 text-xs"
                      style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                    >
                      {pair.note}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          )}

          {board[0]?.updatedLabel ? (
            <p className="ai-muted mt-6 text-sm">
              Board last updated{" "}
              <strong style={{ color: "hsl(var(--ai-charcoal))" }}>
                {board[0].updatedLabel}
              </strong>
              .
            </p>
          ) : null}

          <p
            className="mt-4 flex max-w-2xl items-start gap-2.5 text-sm leading-relaxed"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "hsl(var(--ai-emerald))" }}
            />
            Rates are indicative and subject to confirmation by our finance desk
            at the time of your booking. A booking is not a transfer — nothing
            moves until we have confirmed it with you.
          </p>
        </Wrap>
      </Section>

      {/* Calculator */}
      <Section tone="alt" id="calculator">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHead
              eyebrow="Currency calculator"
              title="Work out what you would get"
              lede="Against today's published board. The figure is indicative — your confirmed rate is the one the desk agrees with you when you book."
            />
            <CurrencyCalculator board={board} />
          </div>
        </Wrap>
      </Section>

      {/* Book an exchange */}
      <Section tone="stone" id="book">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>Book an exchange</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                Tell us what you are changing
              </h2>
              <p className="ai-lede mt-5">
                We hold the request, confirm the rate with you, and take the
                money once you agree — in that order, every time.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "No money changes hands until the rate is confirmed.",
                  "You get a reference number to quote at the office or on WhatsApp.",
                  "Cash, bank transfer or mobile money.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <ShieldCheck
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "hsl(var(--ai-emerald))" }}
                    />
                    <span
                      className="text-[0.95rem]"
                      style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <ExchangeBookingForm />
          </div>
        </Wrap>
      </Section>

      {/* Pay a supplier */}
      <Section tone="ink" id="pay-supplier">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow copper>Pay a supplier in China</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                One company for the money and the freight
              </h2>
              <p className="ai-lede mt-5">
                Send us the supplier&rsquo;s details and the amount. We settle
                them in RMB, send you the payment proof, and — if the goods are
                coming with us — file it against your cargo.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "We check the supplier's details before anything is sent.",
                  "Payment proof goes to you and stays on your record.",
                  "Ask us to inspect and collect the goods in the same message.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Banknote
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "hsl(var(--ai-copper))" }}
                    />
                    <span
                      className="text-[0.95rem]"
                      style={{ color: "hsl(var(--ai-stone)/0.7)" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <SupplierPaymentRequestForm />
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.paperwork}
        eyebrow="Next step"
        title="One company for the money and the freight"
        lede="Book the rate here, confirm it with our finance desk, and pay your supplier the same day — with the proof in your portal."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="#book" tone="copper">
            Book money exchange
          </BtnLink>
          <BtnLink href="/contact" tone="outline-invert">
            Talk to finance
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
