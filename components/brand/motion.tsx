"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll reveal and counters.
 *
 * Both are built on one IntersectionObserver per element and both stop
 * observing the moment they have fired. A page with thirty reveals should not
 * be paying for thirty live observers after the first scroll.
 *
 * BOTH RESPECT prefers-reduced-motion, and they respect it by showing the
 * FINISHED state immediately — not by hiding the content. A reveal that never
 * fires because animation is off is a blank page.
 */

function useInView<T extends HTMLElement>(rootMargin = "-12% 0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setSeen(true);
      return;
    }

    /*
      Already on screen when we mounted? Reveal at once.

      An observer does not fire for something that is ALREADY intersecting in
      some navigation cases — a back-button restore, an anchor jump, a fast
      programmatic scroll — and the failure mode is the worst one available:
      content that stays at opacity 0 forever. Checking the rectangle up front
      costs one layout read and removes that whole class of bug.
    */
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(node);

    /*
      And a backstop.

      If the observer somehow never fires — a browser quirk, a scroll container
      we did not anticipate — the content appears anyway after a moment. A
      marketing page whose copy is invisible is worse in every way than one
      whose animation was skipped, so the failure leans towards showing.
    */
    const backstop = window.setTimeout(() => {
      setSeen(true);
      observer.disconnect();
    }, 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(backstop);
    };
  }, [seen, rootMargin]);

  return { ref, seen };
}

/** Fades and lifts its children in once, when they first come into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds. Use small, increasing values to stagger a row of cards. */
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const { ref, seen } = useInView<HTMLElement>();

  return (
    /* The cast is the honest way through a polymorphic `as`. TypeScript has to
       satisfy every element in the union at once — div, section and li have
       incompatible ref types — and there is no narrowing that helps, because
       `Tag` is only known at runtime. `HTMLElement` is the true common type. */
    <Tag
      ref={ref as React.Ref<never>}
      className={cn(
        "transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        seen ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
        className
      )}
      style={{ transitionDelay: seen ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

/**
 * A number that counts up the first time it is seen.
 *
 * Eased rather than linear — a linear counter reads as a loading bar, an eased
 * one reads as a figure settling. It counts in real time rather than in fixed
 * steps, so the duration is the same whether the target is 8 or 8,000.
 */
export function CountUp({
  to,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { ref, seen } = useInView<HTMLSpanElement>("-20% 0px");
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(to);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo: fast, then settles.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(to * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
