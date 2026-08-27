import Link from "next/link";

import { Reveal } from "@/components/brand/motion";
import { Photo } from "@/components/brand/photo";
import { StarField } from "@/components/brand/star-field";

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
  media,
  photo,
  photoAlt = "",
  stats,
  align = "split",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  /** A composition for the right column. Wins over `photo`. */
  media?: React.ReactNode;
  /** A single photograph, framed and given depth by this component. */
  photo?: string;
  photoAlt?: string;
  stats?: { value: string; label: string }[];
  /**
   * `split` puts the copy in a column beside the media. `wide` lets the copy
   * run the full width — for a page whose own first section is the visual,
   * where a hero picture would be the second photograph in one screen.
   */
  align?: "split" | "wide";
}) {
  const hasMedia = Boolean(media || photo);
  const split = align === "split" && hasMedia;

  return (
    <section className="ai-on-ink relative isolate overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40">
      <StarField />

      {/* A wash of brand colour across the band so the navy is never flat.
          Sits under the content and over the stars. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(58% 55% at 88% 12%, hsl(var(--ai-emerald) / 0.16) 0%, transparent 70%), radial-gradient(44% 44% at 6% 92%, hsl(var(--ai-copper) / 0.13) 0%, transparent 68%)",
        }}
      />

      <Wrap className="relative z-10">
        <div
          className={cn(
            split &&
              "grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20"
          )}
        >
          <div className={cn(!split && "max-w-3xl")}>
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
                  style={{ borderColor: "hsl(var(--ai-light) / 0.16)" }}
                >
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      {/* The display serif, not the mono. These read as
                          headlines rather than as readings off an instrument,
                          and half of them are words ("Free", "Same day") that
                          a monospace face makes look like console output. */}
                      <dt className="ai-display-sm leading-none">{stat.value}</dt>
                      <dd
                        className="mt-1.5 text-[0.82rem] leading-snug"
                        style={{ color: "hsl(var(--ai-light) / 0.62)" }}
                      >
                        {stat.label}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ) : null}
          </div>

          {split ? (
            <Reveal delay={140} className="lg:pl-4">
              {media ?? (
                <PageHeroPhoto src={photo as string} alt={photoAlt} />
              )}
            </Reveal>
          ) : null}
        </div>
      </Wrap>
    </section>
  );
}

/**
 * The default treatment for a hero's single photograph.
 *
 * A plain rectangle beside a headline reads as a stock template, so it gets a
 * ring, a deep shadow and a slow parallax — the three things that make a
 * picture look placed rather than pasted.
 */
function PageHeroPhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute -inset-4 -z-10 rounded-[calc(var(--ai-radius-lg)+1rem)] opacity-70 blur-2xl"
        style={{
          background:
            "linear-gradient(140deg, hsl(var(--ai-emerald) / 0.35), transparent 55%, hsl(var(--ai-copper) / 0.28))",
        }}
      />
      <Photo
        src={src}
        alt={alt}
        ratio="wide"
        width={1100}
        priority
        parallax={7}
        scrim="soft"
        sizes="(max-width: 1024px) 92vw, 46vw"
        className="ring-1 ring-[hsl(var(--ai-light)/0.14)] shadow-[0_46px_90px_-34px_hsl(213_62%_3%/0.85)]"
      />
    </div>
  );
}
