import { MessageCircle, Quote } from "lucide-react";

import { COMPANY } from "@/lib/constants";
import { Card, Wrap } from "@/components/brand/ui";

/**
 * Customer stories.
 *
 * DELIBERATELY EMPTY UNTIL REAL ONES EXIST.
 *
 * The obvious thing to do here was to write three plausible quotes from three
 * plausible Zambian traders and set them in nice type. That would be inventing
 * testimonials — a customer reading them would reasonably believe other people
 * had said those words about this company, and nobody has. It is the one kind
 * of filler on a marketing site that is a lie rather than a placeholder, and it
 * is not worth a section.
 *
 * So the list ships empty and the section renders an honest invitation instead.
 * Paste real quotes into TESTIMONIALS — with the customer's permission — and the
 * section switches to showing them with no other change.
 */
export type Testimonial = { quote: string; name: string; detail: string };

export const TESTIMONIALS: Testimonial[] = [
  // Example of the shape, kept commented so nothing unverified can ship:
  // { quote: "…", name: "Grace B.", detail: "Wigs & hair, Lusaka" },
];

export function Testimonials() {
  if (TESTIMONIALS.length === 0) {
    return (
      <Wrap>
        <Card className="mx-auto max-w-3xl text-center">
          <Quote
            aria-hidden
            className="mx-auto h-7 w-7"
            style={{ color: "hsl(var(--ai-copper))" }}
          />
          <h2 className="ai-display mt-5">Shipped with us?</h2>
          <p className="ai-lede mx-auto mt-4 max-w-xl">
            We would rather show you real customers than invented ones, so this
            space stays empty until people who have actually used AITRANSIT fill
            it. If we have moved your cargo, tell us how it went — good or bad,
            we read all of it.
          </p>
          <a
            href={`https://wa.me/${COMPANY.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ai-btn ai-btn-outline mt-7"
          >
            <MessageCircle className="h-4 w-4" />
            Send us a note
          </a>
        </Card>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <div className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <Card key={item.name} className="flex flex-col">
            <Quote
              aria-hidden
              className="h-6 w-6"
              style={{ color: "hsl(var(--ai-copper))" }}
            />
            <blockquote className="mt-5 flex-1 text-[1.02rem] leading-relaxed">
              “{item.quote}”
            </blockquote>
            <footer className="mt-6">
              <p className="font-semibold">{item.name}</p>
              <p
                className="text-sm"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {item.detail}
              </p>
            </footer>
          </Card>
        ))}
      </div>
    </Wrap>
  );
}
