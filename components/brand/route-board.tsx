import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { RateCardCategory } from "@/lib/rate-card";
import { cn } from "@/lib/utils";

/*
  THE ROUTE BOARD.

  What sits opposite the headline, and it is deliberately not a picture.

  The hero used to be a dark photograph of an airport apron with a globe in the
  right-hand column. That composition is the source system's, down to the same
  stock photograph, and a customer who has seen both would read this as the same
  company with a different logo. The photograph is gone and the globe has moved
  behind the whole band, where it is atmosphere rather than an illustration in a
  box.

  In its place, the thing an air cargo company actually has that nobody else
  does: its routes, on a board. Two lines out of China, what each one carries,
  what each one costs. It borrows the one piece of visual language that belongs
  to aviation and to nothing else — the departure board — which is why it reads
  as an airline rather than as a freight template, and it is built out of the
  brand's own monospace numerals rather than an image, so it costs nothing to
  load and is legible at any width.

  It is also, unlike a photograph, TRUE and CURRENT: the figures come from the
  same rate card Finance edits, so the board cannot drift from the price list.
*/

type Lane = {
  /** IATA, because a board reads in IATA. */
  from: string;
  fromCity: string;
  carries: string;
  /** The rate-card category whose headline price this lane advertises. */
  match: (category: RateCardCategory) => boolean;
};

const LANES: Lane[] = [
  {
    from: "CAN",
    fromCity: "Guangzhou",
    carries: "Normal goods · wigs",
    match: (c) => /normal/i.test(c.label),
  },
  {
    from: "HKG",
    fromCity: "Hong Kong",
    carries: "Electronics · special",
    match: (c) => /special/i.test(c.label),
  },
];

export function RouteBoard({
  categories,
  className,
  variant = "panel",
}: {
  categories: RateCardCategory[];
  className?: string;
  /**
   * `panel` is the boxed board. `rail` lays the same lanes out horizontally,
   * for the foot of a full-bleed hero where a box floating over the picture
   * would fight it.
   */
  variant?: "panel" | "rail";
}) {
  const lanes = LANES.map((lane) => {
    const category = categories.find(lane.match);
    /* NOT `from`. Spreading a key of that name over the lane overwrote the IATA
       code with the price, and the board rendered "USD 13.50 ——— LUN". */
    const fromPrice = category?.tiers[0]?.price ?? null;
    return { ...lane, fromPrice };
  });

  if (variant === "rail") {
    return (
      <div
        className={cn(
          "ai-on-photo grid gap-px overflow-hidden rounded-[var(--ai-radius-lg)] border backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-3",
          className
        )}
        style={{
          borderColor: "hsl(var(--ai-light) / 0.14)",
          background: "hsl(var(--ai-light) / 0.14)",
          boxShadow: "0 30px 70px -40px hsl(213 62% 3% / 0.9)",
        }}
      >
        {lanes.map((lane) => (
          <div
            key={lane.from}
            className="px-6 py-5"
            style={{ background: "hsl(213 62% 7% / 0.72)" }}
          >
            <div className="flex items-baseline gap-3">
              <span className="ai-num text-base font-semibold tracking-[0.06em]">
                {lane.from}
              </span>
              <span
                aria-hidden
                className="h-px flex-1"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--ai-emerald) / 0.7), hsl(var(--ai-light) / 0.16))",
                }}
              />
              <span className="ai-num text-base font-semibold tracking-[0.06em]">
                LUN
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4">
              <span
                className="text-[0.8rem]"
                style={{ color: "hsl(var(--ai-light) / 0.66)" }}
              >
                {lane.fromCity} — {lane.carries}
              </span>
              {lane.fromPrice ? (
                <span className="ai-num text-[0.85rem] font-semibold">
                  {lane.fromPrice}
                </span>
              ) : null}
            </div>
          </div>
        ))}

        <Link
          href="/calculator"
          className="flex items-center justify-between px-6 py-5 transition-colors hover:bg-[hsl(var(--ai-light)/0.06)] sm:col-span-2 lg:col-span-1"
          style={{ background: "hsl(213 62% 7% / 0.72)" }}
        >
          <span>
            <span
              className="ai-num block text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
              style={{ color: "hsl(var(--ai-light) / 0.55)" }}
            >
              Every rate
            </span>
            <span
              className="mt-1 block text-[0.9rem] font-semibold"
              style={{ color: "hsl(var(--ai-copper))" }}
            >
              Duty included · 5–12 days
            </span>
          </span>
          <ArrowUpRight
            className="h-5 w-5"
            style={{ color: "hsl(var(--ai-copper))" }}
          />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ai-on-photo overflow-hidden rounded-[var(--ai-radius-lg)] border backdrop-blur-xl",
        className
      )}
      style={{
        borderColor: "hsl(var(--ai-light) / 0.16)",
        background: "hsl(213 62% 7% / 0.62)",
        boxShadow: "0 40px 90px -40px hsl(213 62% 3% / 0.9)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-3.5"
        style={{ borderColor: "hsl(var(--ai-light) / 0.12)" }}
      >
        <span
          className="ai-num text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
          style={{ color: "hsl(var(--ai-light) / 0.62)" }}
        >
          Departures
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="ai-pulse h-1.5 w-1.5 rounded-full"
            style={{ background: "hsl(var(--ai-emerald))" }}
          />
          <span
            className="ai-num text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "hsl(var(--ai-emerald))" }}
          >
            Weekly
          </span>
        </span>
      </div>

      <ul>
        {lanes.map((lane, index) => (
          <li
            key={lane.from}
            className={cn("px-5 py-5", index > 0 && "border-t")}
            style={index > 0 ? { borderColor: "hsl(var(--ai-light) / 0.1)" } : undefined}
          >
            <div className="flex items-baseline gap-3">
              <span className="ai-num text-lg font-semibold tracking-[0.04em]">
                {lane.from}
              </span>
              <span
                aria-hidden
                className="h-px flex-1"
                style={{
                  background:
                    "linear-gradient(to right, hsl(var(--ai-emerald) / 0.65), hsl(var(--ai-light) / 0.15))",
                }}
              />
              <span className="ai-num text-lg font-semibold tracking-[0.04em]">
                LUN
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span
                className="text-[0.82rem]"
                style={{ color: "hsl(var(--ai-light) / 0.66)" }}
              >
                {lane.fromCity} — {lane.carries}
              </span>
              {lane.fromPrice ? (
                <span className="ai-num text-[0.9rem] font-semibold">
                  <span
                    className="mr-1 text-[0.68rem] font-medium uppercase tracking-[0.14em]"
                    style={{ color: "hsl(var(--ai-light) / 0.5)" }}
                  >
                    from
                  </span>
                  {lane.fromPrice}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/calculator"
        className="flex items-center justify-between border-t px-5 py-3.5 text-[0.8rem] font-semibold transition-colors hover:bg-[hsl(var(--ai-light)/0.06)]"
        style={{
          borderColor: "hsl(var(--ai-light) / 0.12)",
          color: "hsl(var(--ai-copper))",
        }}
      >
        Duty included · 5–12 days to Lusaka
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
