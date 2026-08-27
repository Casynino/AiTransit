"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import { MarketCard, type MarketCardData } from "@/components/brand/market-card";

/**
 * The directory, with a search box and category chips.
 *
 * FILTERED ON THE CLIENT, deliberately. There are a dozen markets, the whole
 * set is already on the page, and a round trip per keystroke would make a
 * fifteen-row list feel slower than a thousand-row one. If this ever grows past
 * a hundred markets it should move to the server — the shape of the component
 * would not change.
 *
 * Search matches the name, the Chinese name, the city and every product, so a
 * trader who types "wigs" or "义乌" or "Shenzhen" all find something.
 */
export function MarketFilter({
  markets,
  categories,
}: {
  markets: MarketCardData[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets.filter((market) => {
      if (category && !market.products.some((p) => p === category)) return false;
      if (!q) return true;
      const haystack = [
        market.name,
        market.nameCn ?? "",
        market.city,
        market.district ?? "",
        market.bestFor,
        ...market.products,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [markets, query, category]);

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative lg:max-w-sm lg:flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-[1.05rem] w-[1.05rem] -translate-y-1/2"
            style={{ color: "hsl(var(--ai-charcoal-soft)/0.6)" }}
          />
          <label htmlFor="market-search" className="sr-only">
            Search markets
          </label>
          <input
            id="market-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a market, city or product…"
            className="ai-field pl-11"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All products
          </Chip>
          {categories.slice(0, 10).map((c) => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(category === c ? null : c)}
            >
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <p className="ai-muted mt-6 text-sm">
        {shown.length} of {markets.length} markets
        {category ? ` · ${category}` : ""}
        {query ? ` · “${query}”` : ""}
        {(category || query) && (
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setQuery("");
            }}
            className="ai-link ml-3 text-sm"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </p>

      {shown.length === 0 ? (
        <div className="ai-card mt-8 text-center">
          <p className="ai-display-sm">Nothing matches that yet</p>
          <p className="ai-muted mx-auto mt-3 max-w-md text-[0.95rem]">
            Our directory covers the markets Zambian traders use most. If you are
            looking for something else, ask us — our Guangzhou desk sources
            outside the directory all the time.
          </p>
          <a
            href="/appointments?service=SOURCING_HELP"
            className="ai-btn ai-btn-primary mt-6"
          >
            Ask for sourcing help
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((market, index) => (
            <MarketCard
              key={market.slug}
              market={market}
              priority={index < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors"
      style={
        active
          ? {
              background: "hsl(var(--ai-ink))",
              borderColor: "hsl(var(--ai-ink))",
              color: "hsl(var(--ai-light))",
            }
          : {
              borderColor: "hsl(var(--ai-stone-3))",
              background: "hsl(var(--ai-white))",
              color: "hsl(var(--ai-charcoal-soft))",
            }
      }
    >
      {children}
    </button>
  );
}
