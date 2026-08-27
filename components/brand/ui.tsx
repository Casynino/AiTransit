import Link from "next/link";

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
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  copper?: boolean;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow ? <Eyebrow copper={copper}>{eyebrow}</Eyebrow> : null}
      <h2 className={cn("ai-display-lg", eyebrow ? "mt-4" : undefined)}>
        {title}
      </h2>
      {lede ? <p className="ai-lede mt-5">{lede}</p> : null}
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
 * Deliberately short. An inside page's job is the thing below the banner, and a
 * full-height hero on a rates page is a screen the reader has to scroll past to
 * reach what they came for.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="ai-on-ink relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-40 h-[30rem] w-[30rem] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: "hsl(var(--ai-emerald))" }}
      />
      <Wrap className="relative">
        <div className="max-w-3xl">
          <Eyebrow copper>{eyebrow}</Eyebrow>
          <h1 className="ai-display-lg mt-5">{title}</h1>
          {lede ? <p className="ai-lede mt-6 max-w-2xl">{lede}</p> : null}
          {children ? <div className="mt-9">{children}</div> : null}
        </div>
      </Wrap>
    </section>
  );
}
