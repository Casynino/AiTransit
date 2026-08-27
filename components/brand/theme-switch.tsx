"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

/**
 * Light or dark, for the public site and the portal.
 *
 * MOUNT-GUARDED. `next-themes` cannot know the visitor's stored choice until it
 * has run in the browser, so rendering the real icon on the server guarantees a
 * hydration mismatch and a flash of the wrong one. Until it is mounted this
 * renders a same-sized empty box, which keeps the header from reflowing.
 *
 * The label says what pressing it DOES, not what the theme currently is —
 * "Switch to dark" is unambiguous where a moon icon alone is a coin toss.
 */
export function ThemeSwitch({
  className,
  tone = "auto",
}: {
  className?: string;
  /** "invert" for use over the hero, where the header has no surface yet. */
  tone?: "auto" | "invert";
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={mounted ? (dark ? "Switch to light" : "Switch to dark") : "Theme"}
      title={mounted ? (dark ? "Switch to light" : "Switch to dark") : undefined}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors",
        className
      )}
      style={{
        borderColor:
          tone === "invert"
            ? "hsl(var(--ai-light) / 0.24)"
            : "hsl(var(--ai-stone-3))",
        color:
          tone === "invert"
            ? "hsl(var(--ai-light))"
            : "hsl(var(--ai-charcoal))",
        background: tone === "invert" ? "transparent" : "hsl(var(--ai-white))",
      }}
    >
      {/* Both icons are always mounted and cross-fade, so the button never
          resizes and there is nothing to lay out on first paint. */}
      <span className="relative block h-[1.05rem] w-[1.05rem]">
        <Sun
          className="absolute inset-0 h-full w-full transition-all duration-300"
          style={{
            opacity: mounted && !dark ? 1 : 0,
            transform: mounted && !dark ? "rotate(0deg)" : "rotate(-70deg)",
          }}
        />
        <Moon
          className="absolute inset-0 h-full w-full transition-all duration-300"
          style={{
            opacity: mounted && dark ? 1 : 0,
            transform: mounted && dark ? "rotate(0deg)" : "rotate(70deg)",
          }}
        />
      </span>
    </button>
  );
}
