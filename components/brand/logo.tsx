import { cn } from "@/lib/utils";

/**
 * The AITRANSIT mark.
 *
 * ORIGINAL, and deliberately nothing like the artwork this project was forked
 * from. That was a globe with an aeroplane crossing it — the single commonest
 * freight logo there is, and reusing it would have made AITRANSIT read as the
 * same company under a new name.
 *
 * WHAT IT MEANS. A route, drawn as one continuous gesture: an origin node in
 * Guangzhou, a path that runs flat before it climbs, and an arrowhead at the
 * Lusaka end still travelling. The flat opening matters — cargo sits in a
 * warehouse before it flies, and a mark that launches straight off the baseline
 * would be claiming a speed no freight company has. The climb settles at about
 * 42°, which reads as confident rather than aggressive.
 *
 * The arrowhead is computed on the curve's tangent rather than drawn by eye. A
 * head a few degrees off its path looks like a mistake at poster size and like
 * a smudge on a QR label, and this mark has to survive both.
 *
 * TWO INKS, never one: emerald for the route, copper for the head. On the rare
 * surface that can only take a single colour — a rubber stamp, a fax — pass
 * `tone="mono"` and the whole mark prints in the current text colour.
 */

/** The route: flat out of the warehouse, then climbing. */
const ROUTE = "M6.00 48.00 Q34.00 48.00 57.00 27.00";
/** The head, sitting on that curve's tangent. See the note above. */
const HEAD = "M61.87 22.55 L58.23 34.28 L49.87 25.12 Z";

export function AitransitMark({
  className,
  tone = "brand",
}: {
  className?: string;
  /** "mono" prints the whole mark in the inherited text colour. */
  tone?: "brand" | "mono" | "invert";
}) {
  const route =
    tone === "brand"
      ? "hsl(var(--ai-emerald))"
      : tone === "invert"
        ? "hsl(var(--ai-stone))"
        : "currentColor";
  const head =
    tone === "brand"
      ? "hsl(var(--ai-copper))"
      : tone === "invert"
        ? "hsl(var(--ai-copper))"
        : "currentColor";
  const node =
    tone === "brand"
      ? "hsl(var(--ai-ink))"
      : tone === "invert"
        ? "hsl(var(--ai-stone))"
        : "currentColor";

  return (
    <svg
      /*
        Cropped to the artwork, not to a square.

        The mark is naturally about 2:1 — a route is a horizontal idea — and
        centring it in a square box left a third of the frame empty above the
        origin, which reads as a mark that has slipped downwards. Size it by
        HEIGHT and let the width follow. The square lock-up needed for an app
        icon is drawn separately, in app/icon.svg, with its own padding.
      */
      viewBox="0 18 64 38"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto", className)}
      aria-hidden="true"
      focusable="false"
    >
      {/* Origin. Solid, because the cargo is really there before it moves. */}
      <circle cx="6" cy="48" r="4.6" fill={node} />
      <path
        d={ROUTE}
        fill="none"
        stroke={route}
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path d={HEAD} fill={head} />
    </svg>
  );
}

/**
 * The mark with the name set beside it — the lockup used in the header, the
 * footer and on documents.
 *
 * "AI" is set in the display serif and "TRANSIT" in the sans, at the same
 * optical size. The company is read as one word and pronounced as two, and
 * splitting the type is how the wordmark says that without a hyphen or a
 * colour change doing the work.
 */
export function AitransitLockup({
  className,
  tagline = false,
  tone = "brand",
}: {
  className?: string;
  /** Adds the strapline beneath. For footers and title pages, not navigation. */
  tagline?: boolean;
  tone?: "brand" | "mono" | "invert";
}) {
  const ink =
    tone === "invert" ? "hsl(var(--ai-stone))" : "hsl(var(--ai-ink))";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AitransitMark className="h-7 w-auto shrink-0" tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className="text-[1.22rem] leading-none tracking-[-0.01em]"
          style={{ color: ink }}
        >
          <span
            style={{ fontFamily: "var(--ai-display)", fontWeight: 600 }}
          >
            AI
          </span>
          <span
            style={{
              fontFamily: "var(--ai-sans)",
              fontWeight: 700,
              letterSpacing: "0.012em",
            }}
          >
            TRANSIT
          </span>
        </span>
        {tagline ? (
          <span
            className="mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: "hsl(var(--ai-copper))" }}
          >
            Cargo &amp; Exchange
          </span>
        ) : null}
      </span>
    </span>
  );
}
