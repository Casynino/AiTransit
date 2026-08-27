"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ScanLine } from "lucide-react";

import { normaliseCode } from "@/lib/format";

/**
 * The tracking box.
 *
 * A FIELD, NOT A LINK TO A FIELD. Looking up a consignment is the single most
 * common reason anyone opens this site, and sending somebody to another page to
 * type a number they are already holding is a step that buys nothing.
 *
 * The code is normalised before it is navigated to — `normaliseCode` puts the
 * dash back into AT000123 and uppercases it — because people read these off a
 * label, out loud, over a bad phone line. A lookup that fails on a missing dash
 * tells a customer their cargo does not exist.
 */
export function TrackInput({
  tone = "ink",
  autoFocus,
}: {
  tone?: "ink" | "stone";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const code = normaliseCode(value);
        if (code) router.push(`/track?q=${encodeURIComponent(code)}`);
      }}
      className="flex w-full max-w-lg flex-col gap-2.5 sm:flex-row"
    >
      <label htmlFor="ai-track" className="sr-only">
        Tracking or batch number
      </label>
      <div className="relative flex-1">
        <ScanLine
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2"
          style={{
            color:
              tone === "ink"
                ? "hsl(var(--ai-stone)/0.42)"
                : "hsl(var(--ai-charcoal-soft)/0.6)",
          }}
        />
        <input
          id="ai-track"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => setValue(event.target.value)}
          placeholder="AT-000123"
          autoComplete="off"
          spellCheck={false}
          className="ai-field ai-num pl-11 uppercase"
          style={{ letterSpacing: "0.04em" }}
        />
      </div>
      <button type="submit" className="ai-btn ai-btn-copper shrink-0">
        Track
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
