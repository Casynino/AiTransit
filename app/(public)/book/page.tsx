import type { Metadata } from "next";

import { PhotoBand } from "@/components/brand/photo-band";
import { BookingForm } from "@/components/brand/request-forms";
import {
  BtnLink,
  Eyebrow,
  PageHero,
  Section,
  Wrap,
} from "@/components/brand/ui";
import { COMPANY } from "@/lib/constants";
import { IMAGES } from "@/lib/imagery";

export const metadata: Metadata = {
  title: "Book your cargo",
  description:
    "Tell AITRANSIT what is coming and we will confirm the details and where to send it.",
};

export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Book cargo"
        title="Tell us what is coming"
        lede="A booking is not a shipment — it is a heads-up so we know to expect your goods and can tell you exactly where to send them."
        photo={IMAGES.loadingRamp}
      />

      <Section tone="stone">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>What happens next</Eyebrow>
              <ol className="mt-8 space-y-7">
                {[
                  ["We ring you back", "To confirm what is coming and answer anything about the rate."],
                  ["You send us the address", "Or we collect from your supplier — that part is free."],
                  ["We weigh and register it", "Your tracking number is issued the day it reaches our counter."],
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
                      <span
                        className="mt-1 block text-[0.93rem] leading-relaxed"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {body}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
              <p
                className="mt-9 text-sm leading-relaxed"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                In a hurry? Message us on WhatsApp at{" "}
                <a
                  href={`https://wa.me/${COMPANY.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-link"
                >
                  {COMPANY.phone}
                </a>
                .
              </p>
            </div>

            <BookingForm />
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.apronVehicles}
        eyebrow="Next step"
        title="The next step is a tracking number"
        lede="Once your goods reach our Guangzhou counter we weigh them, photograph them and put them on the next flight out."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/track" tone="copper">
            Track your cargo
          </BtnLink>
          <BtnLink href="/china" tone="outline-invert">
            China warehouse address
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
