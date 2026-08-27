import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/brand/motion";
import { StarField } from "@/components/brand/star-field";

import { banner } from "@/lib/imagery";
import { cn } from "@/lib/utils";

/**
 * The public site's primitives.
 *
 * Thin on purpose. These wrap the classes declared in app/brand.css rather than
 * carrying styles of their own, so the design system has ONE home and a change
 * to a button reaches every page from the stylesheet instead of from a dozen
 * component files. The staff app has its own set under components/ui — the two
 * are not shared and must not be, because they dress two different products for
 * two different audiences.
 */

export function Wrap({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className={cn("ai-wrap", narrow && "ai-wrap-narrow", className)}>
      {children}
    </div>
  );
}

/**
 * A band of the page.
 *
 * `tone` sets the surface, and everything inside inherits legible colour from
 * it — see `.ai-on-ink` in brand.css. That is why a card or a button dropped
 * into a dark band needs no variant of its own.
 */
export function Section({
  children,
  className,
  tone = "stone",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "stone" | "alt" | "ink" | "emerald" | "white";
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "ai-section",
        tone === "alt" && "ai-band-stone",
        tone === "ink" && "ai-on-ink",
        tone === "emerald" && "ai-on-emerald",
        tone === "white" && "bg-white",
        className
      )}
    >
      {children}
    </section>
  );
}

/** The small caps label that opens a section. */
export function Eyebrow({
  children,
  className,
  copper,
}: {
  children: React.ReactNode;
  className?: string;
  copper?: boolean;
}) {
  return (
    <p className={cn("ai-eyebrow", copper && "ai-eyebrow-copper", className)}>
      {children}
    </p>
  );
}

/**
 * A section's opening: label, headline, and the sentence under it.
 *
 * One component rather than three because the vertical rhythm between the three
 * is the thing that has to stay constant down the page, and it drifts the
 * moment each section spaces its own.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  align = "left",
  className,
  copper,
  aside,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  copper?: boolean;
  /**
   * The right-hand half of the header row.
   *
   * A `max-w-2xl` headline in a 1260px column leaves half the row empty, and
   * on a wide screen that reads as an unfinished page rather than as
   * restraint — it was the single most common complaint about this site. So a
   * section header can now carry something opposite the headline: the CTA it
   * was going to float there anyway, a photograph, a figure worth knowing.
   * Stacks under the headline below `lg`, where the column is the full width
   * and there is no empty half to fill.
   */
  aside?: React.ReactNode;
}) {
  const head = (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Eyebrow copper={copper}>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "ai-display-lg text-balance",
          eyebrow ? "mt-4" : undefined
        )}
      >
        {title}
      </h2>
      {lede ? <p className="ai-lede mt-5">{lede}</p> : null}
    </div>
  );

  if (!aside) return <div className={className}>{head}</div>;

  return (
    <div
      className={cn(
        "grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end lg:gap-16",
        className
      )}
    >
      {head}
      <div className="lg:pb-1">{aside}</div>
    </div>
  );
}

/**
 * A figure and a line about it, for the right-hand side of a section header.
 *
 * Deliberately plain. The headline is the loud thing in that row; this is the
 * evidence beside it, and evidence that shouts stops being evidence.
 */
export function AsideFacts({
  facts,
  children,
}: {
  facts: { value: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div>
      <dl className="grid grid-cols-3 gap-6">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="ai-display-sm leading-none">{fact.value}</dt>
            <dd
              className="mt-2 text-[0.8rem] leading-snug"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {fact.label}
            </dd>
          </div>
        ))}
      </dl>
      {children ? <div className="mt-7">{children}</div> : null}
    </div>
  );
}

type ButtonTone = "primary" | "ink" | "copper" | "outline" | "outline-invert";

const TONE_CLASS: Record<ButtonTone, string> = {
  primary: "ai-btn-primary",
  ink: "ai-btn-ink",
  copper: "ai-btn-copper",
  outline: "ai-btn-outline",
  "outline-invert": "ai-btn-outline-invert",
};

export function BtnLink({
  href,
  children,
  tone = "primary",
  size,
  className,
  external,
}: {
  href: string;
  children: React.ReactNode;
  tone?: ButtonTone;
  size?: "sm";
  className?: string;
  external?: boolean;
}) {
  const cls = cn("ai-btn", TONE_CLASS[tone], size === "sm" && "ai-btn-sm", className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
  lift,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
}) {
  return (
    <div className={cn("ai-card", lift && "ai-card-lift", className)}>
      {children}
    </div>
  );
}

/**
 * Tones a badge understands.
 *
 * The three brand names, plus the SEMANTIC ones the data layer already speaks —
 * `success`, `warning`, `muted` and so on come straight out of
 * SHIPMENT_STATUS_META and the status maps in the portal, and those live in
 * lib/ where they are shared with the staff app. Teaching this component the
 * semantic vocabulary is a five-line map; renaming the tones at forty call
 * sites would fork a shared table so two products could dress a badge
 * differently, which is exactly the drift worth avoiding.
 */
export type BadgeTone =
  | "emerald"
  | "copper"
  | "ink"
  | "photo"
  | "success"
  | "warning"
  | "info"
  | "muted"
  | "brand"
  | "destructive";

const BADGE_CLASS: Record<BadgeTone, string> = {
  emerald: "ai-badge-emerald",
  copper: "ai-badge-copper",
  ink: "ai-badge-ink",
  photo: "ai-badge-photo",
  // Semantic → brand. Anything that means "good" is emerald, anything that
  // means "needs attention" is copper, and everything neutral is ink.
  success: "ai-badge-emerald",
  brand: "ai-badge-emerald",
  warning: "ai-badge-copper",
  destructive: "ai-badge-copper",
  info: "ai-badge-ink",
  muted: "ai-badge-ink",
};

export function Badge({
  children,
  tone = "emerald",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span className={cn("ai-badge", BADGE_CLASS[tone], className)}>
      {children}
    </span>
  );
}

/**
 * A figure and the words under it.
 *
 * The number leads and is set in the display serif — a statistic is the one
 * thing on a marketing page a reader actually stops on, and setting it in body
 * type buries it in the paragraph it is meant to interrupt.
 */
export function Stat({
  value,
  label,
  hint,
  className,
}: {
  value: React.ReactNode;
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="ai-display" style={{ fontFamily: "var(--ai-display)" }}>
        {value}
      </p>
      <p className="mt-1.5 text-sm font-semibold">{label}</p>
      {hint ? (
        <p className="mt-1 text-sm" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The banner every page that is not the homepage opens with.
 *
 * Navy, so the transparent header has something to sit on, and padded to clear
 * it — the header is pulled out of flow (see the note in site-header.tsx), so
 * each page owns its own top clearance rather than the layout guessing.
 *
 * TWO COLUMNS, and that is the whole point of this component.
 *
 * It used to be a single `max-w-3xl` block. On a phone that is correct and on a
 * laptop it is fine, but on any wide screen it left the entire right-hand half
 * of every interior page as bare navy — eight pages that each opened with a
 * paragraph floating in an empty field. A headline needs something to be
 * beside. So each page now passes either `media` (a composition of its own) or
 * `photo` (a single picture, which this frames), and the column is filled.
 *
 * `stats` is the third option and the cheapest: three figures in a row under
 * the copy. Proof directly beneath the promise is the pattern trust-led sites
 * converge on, and it fills the space with something a customer actually wants
 * rather than with decoration.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  photo,
  media,
  stats,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  /** The full-bleed photograph behind the whole banner. */
  photo?: string;
  /** Something in the right-hand half — a globe, a card. Optional. */
  media?: React.ReactNode;
  stats?: { value: string; label: string }[];
}) {
  return (
    <section className="ai-on-ink relative isolate flex min-h-[clamp(34rem,74vh,46rem)] items-center overflow-hidden pb-20 pt-36 md:pb-28 md:pt-44">
      {/*
        FULL-BLEED, like the homepage and the market directory.

        This used to be a photograph in a rounded card floating in the right
        half of a navy band, which filled the space but did not look like the
        landing page — the landing page is rich because the picture IS the
        banner, edge to edge, with the copy sitting on it. A card in a field of
        flat navy reads as a section; a photograph the width of the screen
        reads as a cover.

        A plain <Image fill> rather than the Photo component, deliberately.
        Photo wraps its picture in an oversized absolutely-positioned layer for
        parallax, and nesting that inside another absolute layer is what made
        two of these heroes render an empty rectangle. A banner background does
        not need parallax; it needs to be there.
      */}
      {photo ? (
        /* No negative z-index. `.ai-on-ink` paints the section's own navy
           background, and a child at -z sits BEHIND that background rather
           than behind the content — which rendered a flat navy banner with an
           invisible photograph under it. Positioned children at auto z paint
           above the parent's background, which is what this wants. */
        <div aria-hidden className="absolute inset-0">
          {/*
            `unoptimized` — straight to Unsplash, no Next image proxy.

            Unsplash already returns exactly what the optimizer would produce:
            the crop we asked for, at the width we asked for, negotiated to
            WebP or AVIF by `auto=format` against the browser's own Accept
            header. Proxying that through Next re-decodes and re-encodes it for
            no gain, and adds a failure mode — the optimizer aborts an upstream
            fetch at seven seconds, and Unsplash regularly takes longer the
            first time it is asked for a particular crop. Every one of those
            aborts rendered a hero as flat navy with the photograph missing.
          */}
          <Image
            src={banner(photo)}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {/* Heavy where the words are, clear where the picture should show. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          /* The same weights the market directory uses, because that banner
             is the one that reads right: opaque enough under the words to
             carry them at any brightness in the picture, and light enough on
             the far side that the photograph is unmistakably a photograph
             rather than a texture. */
          background: photo
            ? "linear-gradient(105deg, hsl(213 62% 8% / 0.95) 0%, hsl(213 62% 8% / 0.82) 45%, hsl(213 62% 8% / 0.42) 100%)"
            : "linear-gradient(105deg, hsl(213 62% 8% / 0.6) 0%, transparent 70%)",
        }}
      />

      <StarField />

      {/* The brand wash that stops the navy reading as flat. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(58% 55% at 88% 10%, hsl(var(--ai-emerald) / 0.20) 0%, transparent 70%), radial-gradient(46% 46% at 4% 94%, hsl(var(--ai-copper) / 0.16) 0%, transparent 68%)",
        }}
      />

      <Wrap className="relative z-10 w-full">
        <div
          className={cn(
            media && "grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"
          )}
        >
          <div className={cn(!media && "max-w-3xl")}>
            <Reveal>
              <Eyebrow copper>{eyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="ai-display-lg mt-5 text-balance">{title}</h1>
            </Reveal>
            {lede ? (
              <Reveal delay={120}>
                <p className="ai-lede mt-6 max-w-2xl">{lede}</p>
              </Reveal>
            ) : null}
            {children ? (
              <Reveal delay={180}>
                <div className="mt-9">{children}</div>
              </Reveal>
            ) : null}

            {stats?.length ? (
              <Reveal delay={240}>
                <dl
                  className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-7 border-t pt-8 sm:grid-cols-3"
                  style={{ borderColor: "hsl(var(--ai-light) / 0.18)" }}
                >
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      {/* The display serif, not the mono. Half of these are
                          words ("Free", "Same day") that a monospace face
                          makes look like console output. */}
                      <dt className="ai-display-sm leading-none">{stat.value}</dt>
                      <dd
                        className="mt-2 text-[0.82rem] leading-snug"
                        style={{ color: "hsl(var(--ai-light) / 0.66)" }}
                      >
                        {stat.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ) : null}
          </div>

          {media ? <Reveal delay={140}>{media}</Reveal> : null}
        </div>
      </Wrap>
    </section>
  );
}
