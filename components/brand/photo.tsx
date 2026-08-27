"use client";

import Image from "next/image";

import { Parallax } from "@/components/brand/parallax";
import { img } from "@/lib/imagery";
import { cn } from "@/lib/utils";

/*
  Photographs, framed.

  Every picture on this site goes through here rather than through a bare
  <Image>, for one reason worth stating: a photograph dropped straight onto a
  page is a rectangle, and a rectangle is what makes a site look like a
  template. What makes it look considered is the treatment — the crop, the
  scrim that carries text, the way it lifts on hover, the way it arrives.

  The scrim matters most. Text over an arbitrary photograph is unreadable at
  some point in that photograph, always; the gradient is not decoration, it is
  what makes the caption legible whichever image the CMS serves.
*/

export type PhotoRatio = "square" | "portrait" | "landscape" | "wide" | "tall";

const RATIO: Record<PhotoRatio, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
  wide: "aspect-[16/10]",
  tall: "aspect-[3/4]",
};

export function Photo({
  src,
  alt = "",
  ratio = "landscape",
  className,
  width = 900,
  priority,
  parallax,
  scrim = "none",
  zoom = true,
  rounded = "lg",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw",
  children,
}: {
  src: string;
  alt?: string;
  ratio?: PhotoRatio;
  className?: string;
  width?: number;
  priority?: boolean;
  /** Decorative depth on scroll. Off by default — see Parallax. */
  parallax?: boolean | number;
  /** A gradient that makes overlaid text readable on any photograph. */
  scrim?: "none" | "soft" | "bottom" | "full" | "side";
  zoom?: boolean;
  rounded?: "lg" | "md" | "none" | "full";
  sizes?: string;
  /** Overlaid content. Wrap it in `ai-on-photo` — see brand.css. */
  children?: React.ReactNode;
}) {
  const strength = typeof parallax === "number" ? parallax : 9;

  const picture = (
    <Image
      src={img(src, width)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      /* Unsplash has already cropped, sized and format-negotiated this; see
         the note in PageHero. Re-optimising it buys nothing and can time out. */
      unoptimized
      className={cn(
        "object-cover",
        zoom &&
          "transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      )}
    />
  );

  return (
    <div
      className={cn(
        "group relative isolate overflow-hidden",
        rounded === "lg" && "rounded-[var(--ai-radius-lg)]",
        rounded === "md" && "rounded-[var(--ai-radius)]",
        rounded === "full" && "rounded-full",
        RATIO[ratio],
        className
      )}
    >
      {parallax ? (
        // Oversized so the travel never exposes an edge inside the clip.
        <div className="absolute -inset-y-[10%] inset-x-0">
          <Parallax strength={strength}>
            <div className="relative h-full w-full">{picture}</div>
          </Parallax>
        </div>
      ) : (
        picture
      )}

      {scrim !== "none" ? (
        <span
          aria-hidden
          className="absolute inset-0 z-10"
          style={{ background: SCRIM[scrim] }}
        />
      ) : null}

      {children ? (
        <div className="ai-on-photo absolute inset-0 z-20">{children}</div>
      ) : null}
    </div>
  );
}

/*
  Hard-coded navy rather than a token, because these sit ON the photograph and
  must be dark in both themes — a scrim that lightens at night would leave the
  caption floating on bare picture. Same reasoning as `.ai-badge-photo`.
*/
const SCRIM: Record<"soft" | "bottom" | "full" | "side", string> = {
  /* For a DECORATIVE photograph carrying no text — it only has to sit on the
     navy band without looking pasted on. A text-carrying scrim here would
     throw away the picture, which is the thing that fills the space. */
  soft: "linear-gradient(to top, hsl(213 62% 7% / 0.45) 0%, hsl(213 62% 7% / 0.10) 45%, hsl(213 62% 7% / 0.02) 100%)",
  bottom:
    "linear-gradient(to top, hsl(213 62% 7% / 0.92) 0%, hsl(213 62% 7% / 0.35) 42%, transparent 72%)",
  full: "linear-gradient(to top, hsl(213 62% 7% / 0.86) 0%, hsl(213 62% 7% / 0.55) 50%, hsl(213 62% 7% / 0.38) 100%)",
  side: "linear-gradient(to right, hsl(213 62% 7% / 0.90) 0%, hsl(213 62% 7% / 0.45) 45%, transparent 80%)",
};

/**
 * Two photographs offset against one another, with room for a floating card.
 *
 * This is the shape that fills the right-hand half of a hero. One picture is
 * never enough there — a single rectangle beside a headline reads as a stock
 * template — but two at different depths and sizes reads as a composition.
 */
export function PhotoDuo({
  main,
  inset,
  mainAlt = "",
  insetAlt = "",
  priority,
  className,
}: {
  main: string;
  inset: string;
  mainAlt?: string;
  insetAlt?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Photo
        src={main}
        alt={mainAlt}
        ratio="portrait"
        width={1000}
        priority={priority}
        parallax={7}
        scrim="soft"
        className="shadow-[0_40px_80px_-30px_hsl(213_62%_4%/0.75)]"
        sizes="(max-width: 1024px) 80vw, 34vw"
      />

      {/* Offset, smaller, and lifted — the overlap is what creates the depth.
          Hidden on the smallest screens, where two stacked photographs would
          push the fold below the first CTA. */}
      <div className="absolute -bottom-8 -left-6 hidden w-[50%] sm:block lg:-bottom-10 lg:-left-10">
        <Photo
          src={inset}
          alt={insetAlt}
          ratio="landscape"
          width={720}
          scrim="soft"
          className="border-[7px] border-[hsl(var(--ai-ink))] shadow-[0_30px_60px_-24px_hsl(213_62%_4%/0.8)]"
          sizes="(max-width: 1024px) 40vw, 18vw"
        />
      </div>
    </div>
  );
}
