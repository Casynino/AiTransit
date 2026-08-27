import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Languages,
  MessageCircle,
  Plane,
  Truck,
} from "lucide-react";

import { MarketFilter } from "@/components/brand/market-filter";
import { CountUp, Reveal } from "@/components/brand/motion";
import { StarField } from "@/components/brand/star-field";
import {
  BtnLink,
  Card,
  Eyebrow,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY } from "@/lib/constants";
import { IMAGES, img } from "@/lib/imagery";
import { marketCategories, publicMarkets } from "@/lib/public-markets";

export const metadata: Metadata = {
  title: "Explore China markets",
  description:
    "The wholesale markets Zambian traders buy from — Guangzhou, Yiwu, Shenzhen, Foshan and more. Book a guided visit or ask AITRANSIT to source for you.",
};

/**
 * The China markets directory.
 *
 * This is the part of AITRANSIT that is not freight: a Zambian trader deciding
 * whether to fly to China needs to know which market sells what, where it is,
 * and whether somebody can meet them there. The directory answers the first
 * two; the booking buttons on every card answer the third.
 *
 * All of it reads ChinaMarket — the same table Admin edits — so the website and
 * the support desk are never describing a market differently.
 */
export default async function MarketsPage() {
  const [markets, categories] = await Promise.all([
    publicMarkets(),
    marketCategories(),
  ]);

  const cities = new Set(markets.map((m) => m.city.split(",")[0].trim()));
  const productCount = categories.length;

  return (
    <>
      {/* Full-bleed banner. */}
      <section className="ai-on-ink relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
        <div aria-hidden className="absolute inset-0">
          <Image
            src={img(IMAGES.clothingRail, 1800)}
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
                "linear-gradient(105deg, hsl(213 62% 8% / 0.95) 0%, hsl(213 62% 8% / 0.82) 45%, hsl(213 62% 8% / 0.45) 100%)",
            }}
          />
        </div>
        <StarField />

        <Wrap className="relative z-10">
          <div className="max-w-3xl">
            <Eyebrow copper>Explore China</Eyebrow>
            <h1 className="ai-display-xl mt-5">
              Every market worth the trip, in one place.
            </h1>
            <p className="ai-lede mt-6 max-w-2xl">
              Zambian traders buy from a handful of Chinese markets, and each one
              is enormous. This is where they are, what they sell and when they
              trade — and if you would rather not go yourself, we will go for you.
            </p>
            <div className="mt-9 flex flex-wrap gap-2.5">
              <BtnLink href="#directory" tone="copper">
                Browse the markets
                <ArrowRight className="h-4 w-4" />
              </BtnLink>
              <BtnLink
                href="/appointments?service=MARKET_VISIT"
                tone="outline-invert"
              >
                Book a guided visit
              </BtnLink>
            </div>

            <dl className="ai-rule mt-12 grid max-w-xl grid-cols-3 gap-6 pt-8">
              {[
                [markets.length, "markets", "in the directory"],
                [cities.size, "cities", "across China"],
                [productCount, "product types", "covered"],
              ].map(([value, label, hint]) => (
                <div key={label as string}>
                  <dt className="sr-only">{label as string}</dt>
                  <dd>
                    <CountUp
                      to={value as number}
                      className="ai-display block"
                      // The display serif carries statistics on this site.
                    />
                    <span className="mt-1 block text-sm font-semibold">
                      {label as string}
                    </span>
                    <span
                      className="block text-xs"
                      style={{ color: "hsl(var(--ai-stone)/0.5)" }}
                    >
                      {hint as string}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Wrap>
      </section>

      {/* The three ways to use the directory. */}
      <Section tone="stone">
        <Wrap>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Plane,
                title: "Go yourself",
                body: "Book a guided visit and we will meet you there — someone who knows the building, the traders and the language.",
                cta: ["Book a visit", "/appointments?service=MARKET_VISIT"],
              },
              {
                icon: ClipboardCheck,
                title: "Send us instead",
                body: "Tell us the product and the budget. We source it, compare suppliers, send you photographs and prices.",
                cta: ["Ask for sourcing", "/appointments?service=SOURCING_HELP"],
              },
              {
                icon: Truck,
                title: "Buy and ship in one",
                body: "Whatever you buy goes straight to our Guangzhou warehouse and onto the next flight to Lusaka.",
                cta: ["See cargo rates", "/calculator"],
              },
            ].map(({ icon: Icon, title, body, cta }, index) => (
              <Reveal key={title} delay={index * 90}>
                <Card lift className="flex h-full flex-col">
                  <span
                    className="grid h-11 w-11 place-items-center rounded-xl"
                    style={{
                      background: "hsl(var(--ai-emerald-soft))",
                      color: "hsl(var(--ai-emerald))",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="ai-display-sm mt-5">{title}</h2>
                  <p className="ai-muted mt-2.5 flex-1 text-[0.95rem] leading-relaxed">
                    {body}
                  </p>
                  <Link href={cta[1]} className="ai-link mt-5 text-sm">
                    {cta[0]}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Card>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </Section>

      {/* The directory itself. */}
      <Section tone="alt" id="directory">
        <Wrap>
          <SectionHead
            eyebrow="The directory"
            title="Search by market, city or what you are buying"
            lede="Every entry is kept by our Guangzhou desk. Hours and building numbers change — we mark anything worth reconfirming before you travel."
          />
          <div className="mt-12">
            <MarketFilter
              markets={markets.map((m) => ({
                slug: m.slug,
                name: m.name,
                nameCn: m.nameCn,
                city: m.city,
                district: m.district,
                bestFor: m.bestFor,
                products: m.products,
                route: m.route,
              }))}
              categories={categories}
            />
          </div>
        </Wrap>
      </Section>

      {/* Concierge. */}
      <Section tone="ink">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <Eyebrow copper>Travelling to China?</Eyebrow>
              <h2 className="ai-display-lg mt-4">
                You should not walk into Yiwu alone.
              </h2>
              <p className="ai-lede mt-5">
                These markets are the size of towns, most traders speak no
                English, and prices move depending on who is asking. Our people
                live there. They will meet you at the building, translate, hold
                the negotiation and get what you buy back to our warehouse the
                same day.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  [Languages, "Mandarin, and Cantonese where it matters"],
                  [Building2, "We know which floor sells what"],
                  [Truck, "Whatever you buy goes straight to our warehouse"],
                ].map(([Icon, text]) => {
                  const I = Icon as typeof Languages;
                  return (
                    <li key={text as string} className="flex items-start gap-3">
                      <I
                        className="mt-0.5 h-[1.1rem] w-[1.1rem] shrink-0"
                        style={{ color: "hsl(var(--ai-copper))" }}
                      />
                      <span
                        className="text-[0.95rem]"
                        style={{ color: "hsl(var(--ai-stone)/0.7)" }}
                      >
                        {text as string}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-9 flex flex-wrap gap-2.5">
                <BtnLink href="/appointments" tone="copper">
                  Book a visit or a factory tour
                </BtnLink>
                <BtnLink
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  tone="outline-invert"
                  external
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask a question
                </BtnLink>
              </div>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--ai-radius-lg)]">
              <Image
                src={img(IMAGES.warehouseAisle, 1200)}
                alt="Inside a Chinese wholesale market"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
