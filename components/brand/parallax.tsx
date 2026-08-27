"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/*
  Depth on scroll.

  Deliberately NOT a library. GSAP + ScrollTrigger is ~60 kB for an effect that
  is four lines of transform maths, and this site is read on Zambian mobile
  data — the budget is better spent on the photographs themselves.

  Three rules this obeys, and they are the ones that separate parallax that
  feels expensive from parallax that makes people seasick:

    1. DECORATIVE LAYERS ONLY. Never body copy, never a control. Moving text
       while somebody is reading it is actively unpleasant and it defeats the
       point, which is to make the background feel further away than the words.
    2. SMALL DELTAS. 5–15% of the element's height, no more. Past that the
       foreground and background visibly desync and the illusion breaks.
    3. CLIPPED. The parent must hide its overflow or the layer slides out from
       under its frame and leaves a gap at the edge.

  One shared listener and one rAF for every layer on the page, rather than a
  listener each: thirty photographs on the markets page would otherwise mean
  thirty scroll handlers competing for the same frame.
*/

type Layer = { el: HTMLElement; strength: number };

const layers = new Set<Layer>();
let ticking = false;
let listening = false;

function apply() {
  ticking = false;
  const vh = window.innerHeight;

  for (const layer of layers) {
    const rect = layer.el.getBoundingClientRect();

    // Skip anything off screen. On a long page this is most of them, and the
    // cheapest transform is the one that is never written.
    if (rect.bottom < -vh * 0.5 || rect.top > vh * 1.5) continue;

    /*
      -1 when the element is entering from below, +1 when it is leaving at the
      top, 0 when it is centred. Driving from the element's own centre rather
      than from raw scrollY means the effect is identical whether the section
      is at the top of the page or eight screens down.
    */
    const centre = rect.top + rect.height / 2;
    const progress = (centre - vh / 2) / (vh / 2 + rect.height / 2);
    const offset = progress * layer.strength;

    layer.el.style.transform = `translate3d(0, ${offset.toFixed(2)}%, 0)`;
  }
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(apply);
}

function subscribe(layer: Layer) {
  layers.add(layer);
  if (!listening) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    listening = true;
  }
  onScroll();

  return () => {
    layers.delete(layer);
    if (layers.size === 0 && listening) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      listening = false;
    }
  };
}

/**
 * Moves its children slowly against the scroll.
 *
 * `strength` is the total travel as a percentage of the element's own height,
 * split either side of centre. The default of 9 is the subtle end of the range
 * — enough to read as depth, not enough to notice as motion.
 *
 * The child should be oversized (e.g. `-inset-y-[12%]`) so the movement never
 * exposes an edge, and the parent must clip.
 */
export function Parallax({
  children,
  strength = 9,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Somebody who has asked for less motion gets none of this. The photograph
    // is still there; it simply holds still.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Coarse pointers skip it too. On a phone the scroll is already inertial
    // and the extra transform buys jank rather than depth.
    if (window.matchMedia?.("(pointer: coarse)").matches) return;

    el.style.willChange = "transform";
    const unsubscribe = subscribe({ el, strength });

    return () => {
      unsubscribe();
      el.style.willChange = "";
      el.style.transform = "";
    };
  }, [strength]);

  return (
    <div ref={ref} className={cn("h-full w-full", className)}>
      {children}
    </div>
  );
}
