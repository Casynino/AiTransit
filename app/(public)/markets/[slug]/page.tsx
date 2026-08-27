import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Plane,
  ShoppingBag,
} from "lucide-react";

import { StarField } from "@/components/brand/star-field";
import { Badge, BtnLink, Card, Eyebrow, Section, Wrap } from "@/components/brand/ui";
import { COMPANY } from "@/lib/constants";
import { img, marketImage } from "@/lib/imagery";
import { publicMarketBySlug, publicMarkets } from "@/lib/public-markets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const market = await publicMarketBySlug(slug);
  if (!market) return { title: "Market" };
  return {
    title: `${market.name} — market guide`,
    description: market.summary.slice(0, 180),
  };
}

/**
 * One market's guide.
 *
 * Written for somebody deciding whether to get on a plane: what is sold, when
 * it trades, and what to know before going. The `verify` field is surfaced
 * prominently rather than tucked at the bottom — a market that has moved
 * building is the single most expensive thing to find out on arrival.
 */
export default async function MarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await publicMarketBySlug(slug);
  if (!market) notFound();

  const all = await publicMarkets();
  const others = all.filter((m) => m.slug !== market.slug).slice(0, 3);

  return (
    <>
      <section className="ai-on-ink relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-40">
        <div aria-hidden className="absolute inset-0">
          <Image
          unoptimized
            src={img(marketImage(market.slug), 1800)}
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
                "linear-gradient(100deg, hsl(213 62% 8% / 0.95) 0%, hsl(213 62% 8% / 0.8) 50%, hsl(213 62% 8% / 0.5) 100%)",
            }}
          />
        </div>
        <StarField />

        <Wrap className="relative z-10">
          <Link
            href="/markets"
            className="ai-link mb-6 inline-flex text-sm"
            style={{ color: "hsl(var(--ai-stone)/0.7)" }}
          >
            <ArrowLeft className="h-4 w-4" />
            All markets
          </Link>
          <div className="max-w-3xl">
            <Eyebrow copper>
              <MapPin className="mr-1 inline h-3 w-3" />
              {market.city}
              {market.district ? ` · ${market.district}` : ""}
            </Eyebrow>
            <h1 className="ai-display-lg mt-4">{market.name}</h1>
            {market.nameCn ? (
              <p
                className="mt-2 text-xl"
                style={{ color: "hsl(var(--ai-stone)/0.66)" }}
              >
                {market.nameCn}
              </p>
            ) : null}
            <p className="ai-lede mt-6">{market.bestFor}</p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              <BtnLink
                href={`/appointments?service=MARKET_VISIT&market=${market.slug}`}
                tone="copper"
              >
                Book a visit
                <ArrowRight className="h-4 w-4" />
              </BtnLink>
              <BtnLink
                href={`/appointments?service=SOURCING_HELP&market=${market.slug}`}
                tone="outline-invert"
              >
                Request sourcing help
              </BtnLink>
            </div>
          </div>
        </Wrap>
      </section>

      <Section tone="stone">
        <Wrap>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <div>
              <h2 className="ai-display">About this market</h2>
              <p className="ai-lede mt-5">{market.summary}</p>

              {market.tips.length > 0 ? (
                <div className="mt-10">
                  <Eyebrow>Before you go</Eyebrow>
                  <ul className="mt-5 space-y-4">
                    {market.tips.map((tip) => (
                      <li key={tip} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: "hsl(var(--ai-copper))" }}
                        />
                        <span className="ai-muted text-[0.97rem] leading-relaxed">
                          {tip}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {market.verify ? (
                <div
                  className="mt-10 rounded-[var(--ai-radius-lg)] border p-5"
                  style={{
                    borderColor: "hsl(38 92% 50% / 0.4)",
                    background: "hsl(38 92% 50% / 0.07)",
                  }}
                >
                  <p
                    className="flex items-start gap-2.5 text-sm leading-relaxed"
                    style={{ color: "hsl(28 45% 28%)" }}
                  >
                    <AlertTriangle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "hsl(28 72% 40%)" }}
                    />
                    <span>
                      <strong>Confirm before you travel.</strong> {market.verify}{" "}
                      Message us and we will check it the same day.
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <Card>
                <Eyebrow>What is sold here</Eyebrow>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {market.products.map((product) => (
                    <li key={product}>
                      <Badge tone="emerald">
                        <ShoppingBag className="h-3 w-3" />
                        {product}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card>
                <dl className="space-y-5">
                  {market.hours ? (
                    <div>
                      <dt className="ai-muted flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                        <Clock className="h-3.5 w-3.5" />
                        Trading hours
                      </dt>
                      <dd className="mt-1.5 font-medium">{market.hours}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="ai-muted flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                      <Plane className="h-3.5 w-3.5" />
                      Cargo route
                    </dt>
                    <dd className="mt-1.5 font-medium">
                      Flies via{" "}
                      {market.route === "HONG_KONG" ? "Hong Kong" : "Guangzhou"}{" "}
                      to Lusaka
                    </dd>
                  </div>
                  <div>
                    <dt className="ai-muted flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                      <MapPin className="h-3.5 w-3.5" />
                      Our warehouse
                    </dt>
                    <dd className="ai-muted mt-1.5 text-sm leading-relaxed">
                      {COMPANY.chinaOffice.addressEn}
                    </dd>
                  </div>
                </dl>
                <Link href="/china" className="ai-link mt-6 text-sm">
                  Send the address to your supplier
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Card>
            </div>
          </div>
        </Wrap>
      </Section>

      {others.length > 0 ? (
        <Section tone="alt">
          <Wrap>
            <h2 className="ai-display">Other markets worth a day</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/markets/${other.slug}`}
                  className="ai-card ai-card-lift group flex flex-col overflow-hidden !p-0"
                >
                  <span className="relative block aspect-[16/10] overflow-hidden">
                    <Image
                    unoptimized
                      src={img(marketImage(other.slug), 640)}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  </span>
                  <span className="block p-5">
                    <span className="ai-muted block text-[0.68rem] font-bold uppercase tracking-[0.14em]">
                      {other.city}
                    </span>
                    <span className="ai-display-sm mt-1.5 block">
                      {other.name}
                    </span>
                    <span className="ai-muted mt-2 block text-sm">
                      {other.bestFor}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </Wrap>
        </Section>
      ) : null}
    </>
  );
}
