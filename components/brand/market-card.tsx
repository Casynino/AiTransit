import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Plane } from "lucide-react";

import { Badge } from "@/components/brand/ui";
import { img, marketImage } from "@/lib/imagery";

/**
 * One market, as a card.
 *
 * The photograph carries most of the weight, so it gets a 4:3 frame and a
 * gradient scrim rather than a flat crop — a market card without an image is a
 * paragraph, and this section exists to make China feel reachable.
 *
 * Two actions on every card, because the two things a trader wants from a
 * market are different: go and see it, or have somebody buy from it for them.
 * Offering only "read more" is what makes a directory feel like a brochure.
 */
export type MarketCardData = {
  slug: string;
  name: string;
  nameCn: string | null;
  city: string;
  district: string | null;
  bestFor: string;
  products: string[];
  route: string;
};

export function MarketCard({
  market,
  priority,
}: {
  market: MarketCardData;
  /** True for the first row only — the rest load lazily. */
  priority?: boolean;
}) {
  return (
    <article className="group ai-card ai-card-lift flex flex-col overflow-hidden !p-0">
      <Link
        href={`/markets/${market.slug}`}
        className="relative block aspect-[4/3] overflow-hidden"
      >
        <Image
        unoptimized
          src={img(marketImage(market.slug), 800)}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, hsl(213 62% 8% / 0.86) 0%, hsl(213 62% 8% / 0.25) 45%, transparent 75%)",
          }}
        />
        {/* `ai-on-photo` flips the colour roles for this caption only: it sits
            over the scrim above, which is dark in both themes, so the page's
            light/dark tokens would get it exactly backwards half the time. */}
        <span className="ai-on-photo absolute inset-x-0 bottom-0 p-5">
          <span
            className="block text-[0.68rem] font-bold uppercase tracking-[0.16em]"
            style={{ color: "hsl(var(--ai-copper))" }}
          >
            <MapPin className="mr-1 inline h-3 w-3" />
            {market.city}
            {market.district ? ` · ${market.district}` : ""}
          </span>
          <span
            className="ai-display-sm mt-1.5 block"
            style={{ color: "hsl(var(--ai-charcoal))" }}
          >
            {market.name}
          </span>
          {market.nameCn ? (
            <span
              className="mt-0.5 block text-sm"
              style={{ color: "hsl(var(--ai-charcoal)/0.66)" }}
            >
              {market.nameCn}
            </span>
          ) : null}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="ai-muted text-[0.92rem] leading-relaxed">
          {market.bestFor}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {market.products.slice(0, 3).map((product) => (
            <Badge key={product} tone="ink">
              {product}
            </Badge>
          ))}
          {market.products.length > 3 ? (
            <Badge tone="ink">+{market.products.length - 3}</Badge>
          ) : null}
        </div>

        <p
          className="ai-muted mt-4 flex items-center gap-1.5 text-xs"
          style={{ marginTop: "auto", paddingTop: "1rem" }}
        >
          <Plane className="h-3.5 w-3.5" />
          Flies via {market.route === "HONG_KONG" ? "Hong Kong" : "Guangzhou"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/appointments?service=MARKET_VISIT&market=${market.slug}`}
            className="ai-btn ai-btn-primary ai-btn-sm"
          >
            Book a visit
          </Link>
          <Link
            href={`/appointments?service=SOURCING_HELP&market=${market.slug}`}
            className="ai-btn ai-btn-outline ai-btn-sm"
          >
            Sourcing help
          </Link>
        </div>

        <Link
          href={`/markets/${market.slug}`}
          className="ai-link mt-4 text-sm"
        >
          Market guide
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
