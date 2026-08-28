import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * The portal's own small vocabulary.
 *
 * Built on the public site's tokens — `.ai-card`, `--ai-emerald`, `.ai-num` —
 * rather than on the staff app's components, so a customer moving from the
 * marketing site to their account stays inside one design. What is here is only
 * what a records-and-requests product needs and the brochure did not: a page
 * header with an action, a row that turns into a card on a phone, a status
 * pill, an empty state that tells you what to do next.
 *
 * Nothing here fetches. These are shapes; the pages own the data.
 */

/* ------------------------------------------------------------------ header */

export function PageHead({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="ai-display-sm">{title}</h1>
        {lede ? <p className="ai-muted mt-2 max-w-2xl">{lede}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ panels */

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[var(--ai-radius-lg)] border ${className}`}
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-white))",
      }}
    >
      {title ? (
        <header
          className="flex items-center justify-between gap-3 border-b px-5 py-3.5"
          style={{ borderColor: "hsl(var(--ai-stone-3))" }}
        >
          <h2 className="text-sm font-bold uppercase tracking-[0.1em]">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* --------------------------------------------------------------- one figure */

/**
 * A number worth looking at, with somewhere to go.
 *
 * The `hint` is not decoration — it is what stops a bare figure being useless.
 * "3" answers nothing; "3 — arriving on GZ-SHIP-2026-004" is the whole point.
 */
export function Metric({
  icon: Icon,
  label,
  value,
  hint,
  href,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  href?: string;
  tone?: "emerald" | "copper" | "amber";
}) {
  const accent =
    tone === "emerald"
      ? "hsl(var(--ai-emerald))"
      : tone === "copper"
        ? "hsl(var(--ai-copper))"
        : tone === "amber"
          ? "hsl(38 92% 38%)"
          : undefined;

  const body = (
    <div
      className="h-full rounded-[var(--ai-radius-lg)] border p-5 transition-colors"
      style={{
        borderColor: accent ? `${accent.slice(0, -1)} / 0.35)` : "hsl(var(--ai-stone-3))",
        background: accent
          ? `${accent.slice(0, -1)} / 0.06)`
          : "hsl(var(--ai-white))",
      }}
    >
      <Icon className="h-5 w-5" style={{ color: accent ?? "hsl(var(--ai-charcoal-soft))" }} />
      <p
        className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.14em]"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        {label}
      </p>
      {/*
        break-words, and smaller until there is room.

        On a 390px phone these sit two to a row, which makes each about 170px
        wide — and "USD 1,415.50" at text-2xl does not fit in that. It ran off
        the card rather than wrapping, because a figure has no space to break at.
      */}
      <p
        className="ai-num mt-1 break-words text-xl font-bold sm:text-2xl"
        style={{ color: accent }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/* ------------------------------------------------------------------- pills */

export type Tone = "neutral" | "emerald" | "copper" | "amber" | "rose" | "ink";

const TONE: Record<Tone, { fg: string; bg: string }> = {
  neutral: { fg: "hsl(var(--ai-charcoal-soft))", bg: "hsl(var(--ai-stone-2))" },
  emerald: { fg: "hsl(var(--ai-emerald))", bg: "hsl(var(--ai-emerald) / 0.12)" },
  copper: { fg: "hsl(var(--ai-copper))", bg: "hsl(var(--ai-copper) / 0.12)" },
  amber: { fg: "hsl(32 80% 34%)", bg: "hsl(38 92% 50% / 0.14)" },
  rose: { fg: "hsl(348 70% 40%)", bg: "hsl(348 80% 55% / 0.12)" },
  ink: { fg: "hsl(var(--ai-white))", bg: "hsl(var(--ai-ink))" },
};

export function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}) {
  const t = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color: t.fg, background: t.bg }}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------- rows */

/**
 * A record in a list.
 *
 * A CARD, NOT A TABLE ROW, at every width. The portal's lists are read on a
 * phone as often as not, and a table with eight columns on a 390px screen is
 * either a horizontal scroll nobody discovers or a font nobody can read. This
 * stacks: a title line that always fits, then facts that wrap.
 */
export function RecordRow({
  href,
  title,
  subtitle,
  media,
  facts,
  right,
}: {
  href?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  media?: React.ReactNode;
  facts?: { label: string; value: React.ReactNode }[];
  right?: React.ReactNode;
}) {
  const inner = (
    <div
      className="flex gap-4 rounded-[var(--ai-radius-lg)] border p-4 transition-colors sm:p-5"
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-white))",
      }}
    >
      {media ? <div className="shrink-0">{media}</div> : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <div className="font-semibold leading-tight">{title}</div>
            {subtitle ? (
              <div
                className="mt-0.5 truncate text-sm"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>

        {facts?.length ? (
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {facts.map((f) => (
              <div key={f.label}>
                <dt
                  className="text-[0.62rem] font-bold uppercase tracking-[0.12em]"
                  style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                >
                  {f.label}
                </dt>
                <dd className="ai-num mt-0.5 text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/* ------------------------------------------------------------------- empty */

/**
 * Nothing here — and what to do about it.
 *
 * Every empty state in the portal takes an action, because a customer who opens
 * "Supplier payments" and reads "No supplier payments" has learnt nothing they
 * did not know. The section exists to be used; the empty state is where it
 * explains itself.
 */
export function Empty({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[var(--ai-radius-lg)] border border-dashed px-6 py-14 text-center"
      style={{ borderColor: "hsl(var(--ai-stone-3))" }}
    >
      <Icon
        className="mx-auto h-8 w-8"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="ai-muted mx-auto mt-1.5 max-w-md text-sm">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------------- notes */

/** A statement of fact from us, on the page it applies to. */
export function Note({
  tone = "neutral",
  title,
  children,
}: {
  tone?: "neutral" | "amber" | "emerald";
  title?: string;
  children: React.ReactNode;
}) {
  const colour =
    tone === "amber"
      ? { border: "hsl(38 92% 50% / 0.4)", bg: "hsl(38 92% 50% / 0.08)", fg: "hsl(32 80% 30%)" }
      : tone === "emerald"
        ? {
            border: "hsl(var(--ai-emerald) / 0.35)",
            bg: "hsl(var(--ai-emerald) / 0.07)",
            fg: "hsl(var(--ai-emerald))",
          }
        : {
            border: "hsl(var(--ai-stone-3))",
            bg: "hsl(var(--ai-stone-2))",
            fg: "hsl(var(--ai-charcoal))",
          };

  return (
    <div
      className="rounded-[var(--ai-radius)] border px-4 py-3 text-sm"
      style={{ borderColor: colour.border, background: colour.bg }}
    >
      {title ? (
        <p className="font-semibold" style={{ color: colour.fg }}>
          {title}
        </p>
      ) : null}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ fields */

/** A label-and-value pair, for detail pages. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt
        className="text-[0.62rem] font-bold uppercase tracking-[0.12em]"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  );
}
