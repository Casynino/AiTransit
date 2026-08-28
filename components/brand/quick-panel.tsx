import Link from "next/link";
import {
  Calculator,
  CalendarClock,
  Coins,
  HandCoins,
  Headset,
  ScanLine,
  Store,
} from "lucide-react";

/**
 * The quick-service panel.
 *
 * Seven doors, directly under the hero, because the visitors this site gets are
 * overwhelmingly here to DO one specific thing — look up a box, price a
 * consignment, check a rate — and making them read a marketing page first is
 * how a business loses the customer it already has.
 *
 * It sits half over the hero and half over the section below it. That overlap
 * is the point: it tells you the page continues, and it puts the actions at the
 * fold on a laptop instead of just below it.
 */
const ACTIONS = [
  { href: "/track", label: "Track cargo", hint: "Where is my box?", icon: ScanLine },
  { href: "/calculator", label: "Price calculator", hint: "What will it cost?", icon: Calculator },
  { href: "/exchange#rates", label: "Today's rates", hint: "Buy & sell", icon: Coins },
  { href: "/appointments?service=CARGO_PICKUP", label: "Book pickup", hint: "Collect in Makeni", icon: CalendarClock },
  { href: "/markets", label: "China markets", hint: "Explore & visit", icon: Store },
  { href: "/exchange#pay-supplier", label: "Pay a supplier", hint: "In RMB, today", icon: HandCoins },
  { href: "/contact", label: "Talk to us", hint: "A person answers", icon: Headset },
];

export function QuickPanel({ flush = false }: { flush?: boolean }) {
  /*
    `flush` drops the wrapper and the negative offset so this can sit inside a
    shared container with the route rail above it. The two used to be separate
    overlapping strips and landed on top of one another — two dark bars with a
    seam between them, which read as a mistake rather than as a design.
  */
  const grid = (
    <div
      className={
        "grid grid-cols-2 gap-px sm:grid-cols-4 lg:grid-cols-7" +
        (flush ? "" : " overflow-hidden rounded-[var(--ai-radius-lg)]")
      }
      style={{
        background: "hsl(var(--ai-stone-3))",
        boxShadow: flush ? undefined : "var(--ai-shadow-lg)",
      }}
    >
        {ACTIONS.map(({ href, label, hint, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-2 px-3 py-6 text-center transition-colors"
            style={{ background: "hsl(var(--ai-white))" }}
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-xl transition-colors"
              style={{
                background: "hsl(var(--ai-emerald-soft))",
                color: "hsl(var(--ai-emerald))",
              }}
            >
              <Icon className="h-[1.2rem] w-[1.2rem]" />
            </span>
            <span className="mt-1 text-[0.82rem] font-semibold leading-tight">
              {label}
            </span>
            <span
              className="text-[0.7rem] leading-tight"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {hint}
            </span>
          </Link>
      ))}
    </div>
  );

  if (flush) return grid;
  return <div className="ai-wrap relative z-20 -mt-14 md:-mt-20">{grid}</div>;
}
