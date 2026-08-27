import { AlertTriangle, Check } from "lucide-react";

import type { PublicTimelineEntry } from "@/lib/tracking";

/**
 * The journey, as a vertical run.
 *
 * VERTICAL AT EVERY WIDTH. A horizontal stepper is the reflex for this, and it
 * fails on the device most of these are read on: five labels across a 360px
 * screen either truncate or stack into something that no longer reads as a
 * sequence. Down the page, each step gets a full line for its name, its place
 * and its timestamp.
 *
 * A HOLD IS NOT A STEP. When cargo is under investigation the data layer inserts
 * an entry with tone "hold" between two real steps — it is the journey stopping
 * rather than advancing, so it is drawn in warning colour with a different
 * marker and the connecting rule above it stops being "done".
 */
export function TrackingTimeline({ entries }: { entries: PublicTimelineEntry[] }) {
  return (
    <ol className="relative">
      {entries.map((entry, index) => {
        const hold = entry.tone === "hold";
        const last = index === entries.length - 1;

        const markerBg = hold
          ? "hsl(38 92% 50%)"
          : entry.done || entry.current
            ? "hsl(var(--ai-emerald))"
            : "hsl(var(--ai-stone-3))";

        return (
          <li key={`${entry.status}-${index}`} className="relative flex gap-5 pb-9 last:pb-0">
            {/* The rule that joins this step to the next. Drawn from the marker
                downwards and suppressed on the last row so it never trails off
                into nothing. */}
            {!last ? (
              <span
                aria-hidden
                className="absolute left-[0.6875rem] top-6 h-[calc(100%-1.5rem)] w-px"
                style={{
                  background: entry.done
                    ? "hsl(var(--ai-emerald)/0.35)"
                    : "hsl(var(--ai-stone-3))",
                }}
              />
            ) : null}

            <span
              aria-hidden
              className="relative z-10 mt-0.5 grid h-[1.375rem] w-[1.375rem] shrink-0 place-items-center rounded-full"
              style={{
                background: markerBg,
                boxShadow: entry.current
                  ? `0 0 0 4px ${hold ? "hsl(38 92% 50% / 0.18)" : "hsl(var(--ai-emerald) / 0.18)"}`
                  : undefined,
              }}
            >
              {hold ? (
                <AlertTriangle className="h-3 w-3 text-white" />
              ) : entry.done ? (
                <Check className="h-3 w-3 text-white" />
              ) : null}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p
                  className="font-semibold"
                  style={{
                    color:
                      entry.done || entry.current
                        ? "hsl(var(--ai-charcoal))"
                        : "hsl(var(--ai-charcoal-soft))",
                  }}
                >
                  {entry.label}
                </p>
                {entry.at ? (
                  <time
                    className="ai-num text-xs"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {entry.at}
                  </time>
                ) : null}
              </div>
              <p
                className="mt-0.5 text-sm"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {entry.location}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
