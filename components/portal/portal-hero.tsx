import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { banner, IMAGES } from "@/lib/imagery";

/**
 * The band a customer's account opens on.
 *
 * WHY IT EXISTS. Every desk in this business opens on an identity band — the
 * offices on DeskHero, the warehouses on WarehouseHero — and the customer, who
 * is the only person here who chose to be, opened on a line of plain text on a
 * flat background. The portal read as the cheap part of a system whose staff
 * screens look expensive, which is exactly backwards: staff have to use this
 * software, customers do not.
 *
 * IT IS NOT DeskHero. That band is a stock-free gradient with a hairline grid
 * over it, built to read as freight software rather than as marketing. The
 * portal is the other side of that line: it shares `.ai-site` with the public
 * website, so a customer who registers on the marketing site and signs in must
 * not feel handed to a different company. So this is the PUBLIC hero language —
 * a real photograph of the route, an ink scrim over it, the display face — cut
 * down to the height an account page can afford.
 *
 * THE FIGURES ARE IN THE BAND, NOT UNDER IT. The three or four things a
 * customer signs in to find out sit on the photograph itself. A banner that is
 * only a greeting is a banner that costs a scroll and answers nothing, and the
 * fastest way to make a portal feel slow is to put decoration above the news.
 */

export type HeroFact = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  /** Draws attention. Use for the one thing that is actually waiting on them. */
  accent?: boolean;
};

export type HeroAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

export function PortalHero({
  eyebrow,
  title,
  lede,
  code,
  facts = [],
  actions = [],
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Their customer code, set as a chip — it is what the desk asks for. */
  code?: string;
  facts?: HeroFact[];
  actions?: HeroAction[];
}) {
  return (
    <section
      className="ai-on-ink relative isolate mb-8 overflow-hidden rounded-[var(--ai-radius-lg)]"
      style={{ boxShadow: "var(--ai-shadow-lg)" }}
    >
      {/*
        NO NEGATIVE z-index ON THE PHOTOGRAPH.

        `.ai-on-ink` paints its own navy background, and a child at -z sits
        BEHIND that background rather than behind the text — which is how the
        public hero lost its picture entirely once before. The photo is a normal
        child under a scrim instead.
      */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src={banner(IMAGES.cargoLoading, 1600, 21 / 9)}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover"
        />
        {/*
          Two scrims, not one. A flat overlay dark enough for white type over the
          bright apron washes the whole picture out; a gradient that is heavy at
          the left where the words are and light at the right keeps the aircraft
          visible while the greeting stays readable at any window width.
        */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(100deg, hsl(var(--ai-ink) / 0.94) 0%, hsl(var(--ai-ink) / 0.86) 42%, hsl(var(--ai-ink) / 0.55) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 82% 0%, hsl(var(--ai-emerald) / 0.22) 0%, transparent 62%)",
          }}
        />
        {/*
          A third scrim, weighted to the bottom.

          The diagonal above is enough on a desktop, where the band is short and
          the words sit in its dark left third. On a phone the same band is four
          times as tall and the figures and buttons land in the bright half of
          the photograph — the aircraft belly and the loader — where white type
          on a 55% overlay is not readable. This darkens where the content
          actually is at that width and does almost nothing at desktop height.
        */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, hsl(var(--ai-ink) / 0.82) 0%, hsl(var(--ai-ink) / 0.35) 45%, transparent 78%)",
          }}
        />
      </div>

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="text-[0.68rem] font-bold uppercase tracking-[0.18em]"
            style={{ color: "hsl(var(--ai-emerald))" }}
          >
            {eyebrow}
          </span>
          {code ? (
            <span
              className="ai-num rounded-full px-2.5 py-1 text-[0.7rem] font-semibold"
              style={{
                background: "hsl(var(--ai-light) / 0.18)",
                color: "hsl(var(--ai-light))",
              }}
            >
              {code}
            </span>
          ) : null}
        </div>

        <h1 className="ai-display-sm mt-3">{title}</h1>
        {lede ? <p className="ai-lede mt-2 max-w-2xl text-sm sm:text-base">{lede}</p> : null}

        {/* ── the figures, on the photograph ──────────────────────────────── */}
        {facts.length > 0 ? (
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--ai-radius)] sm:grid-cols-4"
              style={{ background: "hsl(var(--ai-light) / 0.14)" }}>
            {facts.map((fact) => {
              const body = (
                <div
                  className="h-full px-4 py-3.5 backdrop-blur-sm transition-colors"
                  style={{ background: "hsl(var(--ai-ink) / 0.74)" }}
                >
                  <dt
                    className="text-[0.6rem] font-bold uppercase tracking-[0.14em]"
                    style={{ color: "hsl(var(--ai-light) / 0.62)" }}
                  >
                    {fact.label}
                  </dt>
                  <dd
                    className="ai-num mt-1 break-words text-lg font-bold leading-tight sm:text-xl"
                    style={{
                      color: fact.accent
                        ? "hsl(var(--ai-copper-ink))"
                        : "hsl(var(--ai-light))",
                    }}
                  >
                    {fact.value}
                  </dd>
                  {fact.hint ? (
                    <p
                      className="mt-0.5 text-[0.7rem] leading-tight"
                      style={{ color: "hsl(var(--ai-light) / 0.58)" }}
                    >
                      {fact.hint}
                    </p>
                  ) : null}
                </div>
              );
              return fact.href ? (
                <Link key={fact.label} href={fact.href} className="block">
                  {body}
                </Link>
              ) : (
                <div key={fact.label}>{body}</div>
              );
            })}
          </dl>
        ) : null}

        {/* ── what to do next ─────────────────────────────────────────────── */}
        {actions.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {actions.map(({ href, label, icon: Icon, primary }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-colors"
                style={
                  primary
                    ? {
                        background: "hsl(var(--ai-emerald))",
                        color: "hsl(var(--ai-ink))",
                      }
                    : {
                        /* Over a photograph, not over a flat panel — 0.12 was
                           a tint you could read the loader through. */
                        background: "hsl(var(--ai-light) / 0.2)",
                        color: "hsl(var(--ai-light))",
                      }
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
