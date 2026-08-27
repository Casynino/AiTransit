import type { Metadata } from "next";
import Image from "next/image";
import {
  CalendarCheck,
  ClipboardCheck,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

import { PhotoBand } from "@/components/brand/photo-band";
import { BookingForm } from "@/components/brand/booking-form";
import { Reveal } from "@/components/brand/motion";
import {
  BtnLink,
  Card,
  Eyebrow,
  PageHero,
  Section,
  SectionHead,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY } from "@/lib/constants";
import { IMAGES, img } from "@/lib/imagery";
import { publicMarketBySlug } from "@/lib/public-markets";

export const metadata: Metadata = {
  title: "Book an appointment",
  description:
    "Book a cargo pickup at our Lusaka warehouse, or a market, supplier or factory visit in China with an AITRANSIT guide.",
};

const SERVICES = [
  "CARGO_PICKUP",
  "MARKET_VISIT",
  "SUPPLIER_VISIT",
  "FACTORY_VISIT",
  "GOODS_INSPECTION",
  "SOURCING_HELP",
  "CONSULTATION",
] as const;

type Service = (typeof SERVICES)[number];

function isService(value: string | undefined): value is Service {
  return !!value && (SERVICES as readonly string[]).includes(value);
}

/**
 * The booking page.
 *
 * Deep-linkable: the market cards and the homepage quick panel arrive here with
 * `?service=…&market=…` already set, so somebody who pressed "Book a visit" on
 * Yiwu does not have to pick the service and type the market name again. An
 * unknown or missing service just falls back to cargo pickup, which is the
 * commonest booking.
 */
export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; market?: string }>;
}) {
  const { service, market: marketSlug } = await searchParams;
  const defaultService: Service = isService(service) ? service : "CARGO_PICKUP";

  // Resolve the market so the form can show its real name rather than a slug.
  const market = marketSlug ? await publicMarketBySlug(marketSlug) : null;

  return (
    <>
      <PageHero
        eyebrow="Appointments"
        title="Book a pickup, a market day, or a factory tour"
        lede="One form for everything with a date on it — collecting your cargo in Makeni, or meeting a supplier in Guangzhou with someone who speaks the language."
        photo={IMAGES.clothingRail}
      />

      <Section tone="stone">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>How it works</Eyebrow>
              <ol className="mt-8 space-y-7">
                {[
                  [
                    "You request a slot",
                    "Pick the service and the day that suits you. Nothing is charged and nothing is committed.",
                  ],
                  [
                    "We confirm it",
                    "For a pickup we check your cargo is actually ready. For a visit we check the market or factory is open and put someone with you.",
                  ],
                  [
                    "You get a reference",
                    "Quote it at the counter or to your guide. You can follow the booking in your portal.",
                  ],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-4">
                    <span
                      className="ai-num grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold"
                      style={{
                        background: "hsl(var(--ai-emerald-soft))",
                        color: "hsl(var(--ai-emerald))",
                      }}
                    >
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold">{title}</span>
                      <span className="ai-muted mt-1 block text-[0.93rem] leading-relaxed">
                        {body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <p
                className="ai-muted mt-9 flex items-start gap-2.5 rounded-[var(--ai-radius)] p-4 text-sm leading-relaxed"
                style={{ background: "hsl(var(--ai-emerald-soft))" }}
              >
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "hsl(var(--ai-emerald))" }}
                />
                A request is not a confirmed appointment. We will always come
                back to you before the date.
              </p>

              <p className="ai-muted mt-6 text-sm leading-relaxed">
                Prefer to talk?{" "}
                <a
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-link"
                >
                  Message us on WhatsApp
                </a>
                .
              </p>
            </div>

            <BookingForm
              defaultService={defaultService}
              presetLocation={market?.name}
              presetMarketSlug={market?.slug}
            />
          </div>
        </Wrap>
      </Section>

      {/* Where the two kinds of appointment happen. */}
      <Section tone="alt">
        <Wrap>
          <SectionHead
            eyebrow="Where we meet you"
            title="Two countries, one company"
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {[
              {
                image: IMAGES.warehouseAisle,
                eyebrow: "Zambia — collections",
                title: COMPANY.offices[0].name,
                lines: COMPANY.offices[0].lines,
                note: "Bring your pickup note or tracking number. We scan it against your cargo before handing it over.",
              },
              {
                image: IMAGES.clothingRail,
                eyebrow: "China — visits and sourcing",
                title: `${COMPANY.chinaOffice.city} warehouse & markets`,
                lines: COMPANY.chinaOffice.lines,
                note: "We meet you at the market or the factory, translate, and take whatever you buy straight to our warehouse.",
              },
            ].map((place, index) => (
              <Reveal key={place.title} delay={index * 100}>
                <Card className="flex h-full flex-col overflow-hidden !p-0">
                  <span className="relative block aspect-[16/9]">
                    <Image
                    unoptimized
                      src={img(place.image, 900)}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </span>
                  <span className="flex flex-1 flex-col p-6">
                    <Eyebrow>{place.eyebrow}</Eyebrow>
                    <span className="ai-display-sm mt-3 block">
                      {place.title}
                    </span>
                    <address className="ai-muted mt-3 block not-italic text-sm leading-relaxed">
                      {place.lines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                    <span className="ai-muted mt-4 block flex-1 text-sm leading-relaxed">
                      {place.note}
                    </span>
                  </span>
                </Card>
              </Reveal>
            ))}
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.pearlRiver}
        eyebrow="Next step"
        title="We will meet you at the market"
        lede="An interpreter, a driver and somebody who knows which building sells what — booked the same way you book a pickup in Makeni."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/markets" tone="copper">
            Explore the markets
          </BtnLink>
          <BtnLink href="/contact" tone="outline-invert">
            Ask a question first
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
