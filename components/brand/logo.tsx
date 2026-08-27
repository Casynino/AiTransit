import { cn } from "@/lib/utils";

/**
 * The AITRANSIT mark: an A crossed by a flight path.
 *
 * Taken from the company's own flyer rather than invented — the A is the
 * initial, and the path that crosses it where a crossbar would sit is the
 * China-to-Zambia route leaving to the right. It is redrawn here rather than
 * traced: the arrowhead is computed on the path's own axis, the A's strokes are
 * evened out so they hold at 20px, and the whole thing is painted with tokens
 * so one file works on stone, on navy and on a printed invoice.
 *
 * Nothing about it is shared with the mark this project was forked from, which
 * was a globe with an aeroplane crossing it.
 */

/**
 * The A, as two subpaths: the letter, then its counter.
 *
 * Even-odd fill knocks the second out of the first, so the triangular opening
 * near the apex is a genuine hole rather than a stone-coloured shape painted on
 * top. That matters because the mark sits on navy, on stone and on photographs,
 * and a painted counter would show as a patch on all but one of them.
 */
const A_MARK =
  "M24.60 6.00 L35.40 6.00 L54.00 58.00 L40.50 58.00 L34.80 30.00 " +
  "L25.20 30.00 L19.50 58.00 L6.00 58.00 Z " +
  "M30.00 17.20 L33.30 30.00 L26.70 30.00 Z";
/** The route, crossing the A and leaving to the right. */
const PATH = "M14.00 41.00 L58.00 33.00";
/** Its head, on the path's own axis. */
const HEAD = "M65.28 31.68 L54.48 39.33 L52.47 28.31 Z";

type Tone = "brand" | "invert" | "mono";

export function AitransitMark({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: Tone;
}) {
  /*
    The letter follows the TEXT role, not the ink one.

    It was painted with `--ai-ink` — the navy of the dark bands — which is dark
    in both themes, so the moment the site gained a dark mode the wordmark
    disappeared into the header. `--ai-charcoal` is the body-text role: near-
    black on a light page, warm off-white on a dark one. The mark is the one
    thing that must be legible on every surface, so it borrows the token whose
    entire job is being legible.
  */
  const letter =
    tone === "brand"
      ? "hsl(var(--ai-charcoal))"
      : tone === "invert"
        ? "hsl(var(--ai-light))"
        : "currentColor";
  const route =
    tone === "mono" ? "currentColor" : "hsl(var(--ai-emerald-bright))";
  const head = tone === "mono" ? "currentColor" : "hsl(var(--ai-copper))";

  return (
    <svg
      /* Cropped to the artwork. The mark is naturally wider than tall — a route
         is a horizontal idea — so size it by height and let width follow. */
      viewBox="2 2 68 60"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-8 w-auto", className)}
      aria-hidden="true"
      focusable="false"
    >
      <path d={A_MARK} fill={letter} fillRule="evenodd" />
      {/* The route is drawn over the A and under its head, so the crossing
          reads as one continuous line passing behind the letter's strokes. */}
      <path
        d={PATH}
        fill="none"
        stroke={route}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d={HEAD} fill={head} />
    </svg>
  );
}

/**
 * The mark with the name beside it.
 *
 * "AI" is set in the display serif and "TRANSIT" in the sans at the same
 * optical size: the company is read as one word and said as two, and splitting
 * the type carries that without a hyphen or a second colour doing the work.
 */
export function AitransitLockup({
  className,
  tagline = false,
  tone = "brand",
}: {
  className?: string;
  tagline?: boolean;
  tone?: Tone;
}) {
  // Same reasoning as the mark above: the wordmark reads as text, so it uses
  // the text token and inverts with the theme.
  const ink =
    tone === "invert" ? "hsl(var(--ai-light))" : "hsl(var(--ai-charcoal))";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <AitransitMark className="h-[1.85rem] w-auto shrink-0" tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className="text-[1.2rem] leading-none tracking-[-0.005em]"
          style={{ color: ink }}
        >
          <span style={{ fontFamily: "var(--ai-display)", fontWeight: 600 }}>
            AI
          </span>
          <span
            style={{
              fontFamily: "var(--ai-sans)",
              fontWeight: 700,
              letterSpacing: "0.015em",
            }}
          >
            TRANSIT
          </span>
        </span>
        {tagline ? (
          <span
            className="mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "hsl(var(--ai-copper))" }}
          >
            Cargo &amp; Exchange
          </span>
        ) : null}
      </span>
    </span>
  );
}

/**
 * The full lockup as a file, for documents that leave the building.
 *
 * Fixed inks: an invoice prints on white in any theme, and a colour that
 * brightened for a dark screen would put pale green on a page somebody is about
 * to photocopy.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    // A plain img on purpose: next/image refuses SVG without
    // dangerouslyAllowSVG, and there is nothing here for it to optimise.
    <img
      src="/brand/aitransit-logo.svg"
      alt="AITRANSIT Cargo"
      className={cn("h-12 w-auto", className)}
    />
  );
}
