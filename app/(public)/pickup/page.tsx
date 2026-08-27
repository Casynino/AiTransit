import type { Metadata } from "next";

import { PhotoBand } from "@/components/brand/photo-band";
import { PickupForm } from "@/components/brand/request-forms";
import {
  BtnLink,
  Eyebrow,
  PageHero,
  Section,
  Wrap,
} from "@/components/brand/ui";
import { IMAGES } from "@/lib/imagery";

export const metadata: Metadata = {
  title: "Supplier collection",
  description:
    "AITRANSIT collects your goods from your supplier's door anywhere in Guangzhou, free of charge.",
};

export default function PickupPage() {
  return (
    <>
      <PageHero
        eyebrow="Supplier collection"
        title="We will collect from your supplier"
        lede="Your supplier does not need to arrange shipping or find our warehouse. Give us their address and we go to them — anywhere in Guangzhou, at no cost."
        photo={IMAGES.freightTruck}
        photoAlt="A collection truck on the road"
        stats={[
          { value: "Free", label: "anywhere in Guangzhou" },
          { value: "Photographed", label: "the moment we take them" },
          { value: "Same day", label: "tracking at our counter" },
        ]}
      />

      <Section tone="stone">
        <Wrap>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <Eyebrow>Why this is free</Eyebrow>
              <p className="ai-lede mt-6">
                Because it is the step that most often goes wrong. A supplier who
                has to arrange delivery either does it late, sends it to the
                wrong market, or adds a fee you were not expecting. Collecting it
                ourselves is cheaper for everyone than sorting that out
                afterwards.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "We confirm the address with your supplier before sending anyone.",
                  "The goods are checked and photographed when we take them.",
                  "You get a tracking number the same day they reach our counter.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "hsl(var(--ai-copper))" }}
                    />
                    <span
                      className="text-[0.95rem] leading-relaxed"
                      style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <PickupForm />
          </div>
        </Wrap>
      </Section>

      <PhotoBand
        src={IMAGES.loadingTruck}
        eyebrow="Next step"
        title="We go to your supplier, anywhere in Guangzhou"
        lede="No fee, no arrangement for them to make. We confirm the address first, photograph the goods when we take them, and you get the tracking number the same day."
        height="short"
      >
        <div className="flex flex-wrap gap-2.5">
          <BtnLink href="/book" tone="copper">
            Book your cargo
          </BtnLink>
          <BtnLink href="/contact" tone="outline-invert">
            Ask us first
          </BtnLink>
        </div>
      </PhotoBand>
    </>
  );
}
