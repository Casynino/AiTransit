"use client";

import { useMemo, useState } from "react";
import { geoDistance } from "d3-geo";
import { Plane } from "lucide-react";

/**
 * How a box actually gets from a Chinese market to a Lusaka warehouse.
 *
 * THE QUESTION THIS ANSWERS. Customers ask why one consignment left Guangzhou
 * and another left Hong Kong, and why theirs "went to Dubai" when they are
 * shipping to Zambia. There is no non-stop freighter on this corridor: cargo
 * flies to a hub and connects. Explaining that in a paragraph does not work —
 * people do not read paragraphs about logistics — so it is drawn.
 *
 * A SCHEMATIC, NOT A MAP. The globe beside this one is the map, and it shows
 * where these places are on the earth. This shows the SHAPE of the network:
 * two origins, two hubs, one destination, and which lines actually connect to
 * which. A geographic projection is worse at that, because Dubai and Addis
 * Ababa sit almost on top of each other at this scale and the thing being
 * explained is the topology, not the geography.
 *
 * THE DISTANCES ARE COMPUTED, NOT TYPED. Every figure below is the great-circle
 * distance between two real airport coordinates, worked out at render by
 * d3-geo. Nobody has to maintain them and nobody can mistype one — and, more to
 * the point, they are facts rather than marketing. Flight TIMES are deliberately
 * absent: those depend on the airline, the aircraft and the day, and inventing
 * a number for each leg would be inventing a promise. The end-to-end range the
 * company publishes is stated once, where it belongs.
 */

type Airport = {
  id: string;
  iata: string;
  city: string;
  country: string;
  /** [longitude, latitude], as d3-geo expects. */
  at: [number, number];
  kind: "origin" | "hub" | "destination";
  note: string;
};

const AIRPORTS: Airport[] = [
  {
    id: "can",
    iata: "CAN",
    city: "Guangzhou",
    country: "China",
    at: [113.26, 23.13],
    kind: "origin",
    note: "Our main warehouse. Normal goods and wigs load here.",
  },
  {
    id: "hkg",
    iata: "HKG",
    city: "Hong Kong",
    country: "China",
    at: [114.17, 22.32],
    kind: "origin",
    note: "Electronics and special category load here — more airlines take them.",
  },
  {
    id: "dxb",
    iata: "DXB",
    city: "Dubai",
    country: "UAE",
    at: [55.27, 25.2],
    kind: "hub",
    note: "The busiest connection. Most weeks your cargo changes aircraft here.",
  },
  {
    id: "add",
    iata: "ADD",
    city: "Addis Ababa",
    country: "Ethiopia",
    at: [38.74, 8.98],
    kind: "hub",
    note: "The shorter second leg into Southern Africa, and often the faster one.",
  },
  {
    id: "lun",
    iata: "LUN",
    city: "Lusaka",
    country: "Zambia",
    at: [28.32, -15.39],
    kind: "destination",
    note: "Kenneth Kaunda International. We clear the duty and truck it to Makeni.",
  },
];

const byId = (id: string) => AIRPORTS.find((a) => a.id === id)!;

/** Great-circle kilometres between two airports. Geometry, not a claim. */
function km(a: Airport, b: Airport) {
  return Math.round((geoDistance(a.at, b.at) * 6371) / 10) * 10;
}

/* ─────────────────────────────────────────────────────────── the schematic */

/*
  Node positions in the SVG's own 1000x420 coordinate space.

  Laid out left to right because that is how the journey is read in every other
  surface of this product — the tracking timeline, the guide books, the portal.
  A network diagram that runs a different direction to the timeline beside it
  makes people check whether they are the same thing.
*/
const POS: Record<string, { x: number; y: number }> = {
  can: { x: 90, y: 120 },
  hkg: { x: 90, y: 300 },
  dxb: { x: 500, y: 100 },
  add: { x: 500, y: 320 },
  lun: { x: 910, y: 210 },
};

type Leg = { from: string; to: string };
const LEGS: Leg[] = [
  { from: "can", to: "dxb" },
  { from: "can", to: "add" },
  { from: "hkg", to: "dxb" },
  { from: "hkg", to: "add" },
  { from: "dxb", to: "lun" },
  { from: "add", to: "lun" },
];

/** A gentle arc, so four lines out of two points stay tellable apart. */
function arc(from: string, to: string) {
  const a = POS[from]!;
  const b = POS[to]!;
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - Math.abs(b.y - a.y) * 0.18 - 26;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

export function Corridor() {
  /** null = show the whole network. An id = show only what that origin uses. */
  const [origin, setOrigin] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const active = (leg: Leg) =>
    origin === null || leg.from === origin || leg.from === "dxb" || leg.from === "add";

  const routes = useMemo(() => {
    const origins = origin ? [byId(origin)] : AIRPORTS.filter((a) => a.kind === "origin");
    const lun = byId("lun");
    return origins.flatMap((o) =>
      (["dxb", "add"] as const).map((h) => {
        const hub = byId(h);
        return {
          key: `${o.id}-${h}`,
          origin: o,
          hub,
          first: km(o, hub),
          second: km(hub, lun),
          total: km(o, hub) + km(hub, lun),
        };
      })
    );
  }, [origin]);

  const shown = hover ? byId(hover) : null;

  return (
    <div>
      {/* ── the switch ──────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span
          className="mr-1 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        >
          Leaving from
        </span>
        {[
          { id: null, label: "Both airports" },
          { id: "can", label: "Guangzhou" },
          { id: "hkg", label: "Hong Kong" },
        ].map((option) => {
          const on = origin === option.id;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => setOrigin(option.id)}
              aria-pressed={on}
              className="cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              style={
                on
                  ? {
                      background: "hsl(var(--ai-emerald))",
                      borderColor: "hsl(var(--ai-emerald))",
                      color: "hsl(var(--ai-ink))",
                    }
                  : {
                      borderColor: "hsl(var(--ai-stone-3))",
                      background: "hsl(var(--ai-white))",
                      color: "hsl(var(--ai-charcoal))",
                    }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* ── the network ─────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden rounded-[var(--ai-radius-lg)] border"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-white))",
        }}
      >
        <svg
          viewBox="0 0 1000 420"
          className="h-auto w-full"
          role="img"
          aria-label="Cargo leaves Guangzhou or Hong Kong, connects through Dubai or Addis Ababa, and lands in Lusaka."
        >
          <defs>
            {LEGS.map((leg) => (
              <path
                key={`p-${leg.from}-${leg.to}`}
                id={`leg-${leg.from}-${leg.to}`}
                d={arc(leg.from, leg.to)}
                fill="none"
              />
            ))}
          </defs>

          {/* The lines. Drawn before the nodes so they run underneath them. */}
          {LEGS.map((leg) => {
            const on = active(leg);
            return (
              <g key={`${leg.from}-${leg.to}`}>
                <use
                  href={`#leg-${leg.from}-${leg.to}`}
                  stroke={
                    on ? "hsl(var(--ai-emerald))" : "hsl(var(--ai-stone-3))"
                  }
                  strokeWidth={on ? 2.5 : 1.5}
                  strokeDasharray="7 9"
                  strokeLinecap="round"
                  fill="none"
                  opacity={on ? 0.9 : 0.35}
                  className={on ? "ai-corridor-flow" : undefined}
                />

                {/*
                  The aircraft, on the line, moving.

                  <animateMotion> rather than a JS loop: the browser runs it on
                  the compositor, it costs nothing when the tab is hidden, and
                  there is no state to tear down. The reduced-motion case is
                  handled in CSS on the parent — see .ai-corridor-flow in
                  brand.css — and the plane simply is not rendered when the leg
                  is not part of the selected route.
                */}
                {on ? (
                  <g className="ai-corridor-plane">
                    <circle r="5" fill="hsl(var(--ai-copper-fill))">
                      <animateMotion
                        dur={`${leg.to === "lun" ? 7 : 6}s`}
                        repeatCount="indefinite"
                        rotate="auto"
                        begin={`${leg.from === "hkg" ? 1.4 : 0}s`}
                      >
                        <mpath href={`#leg-${leg.from}-${leg.to}`} />
                      </animateMotion>
                    </circle>
                  </g>
                ) : null}
              </g>
            );
          })}

          {/* The airports. */}
          {AIRPORTS.map((a) => {
            const p = POS[a.id]!;
            const dim =
              origin !== null && a.kind === "origin" && a.id !== origin;
            const big = a.kind !== "hub";
            return (
              <g
                key={a.id}
                transform={`translate(${p.x} ${p.y})`}
                onMouseEnter={() => setHover(a.id)}
                onMouseLeave={() => setHover(null)}
                /* TAP, not just hover. There is no hover on a phone, and this
                   diagram is read on a phone as often as not — leaving the notes
                   behind a pointer would hide half the explanation from half the
                   readers. Tapping the same node again closes it. */
                onClick={() => setHover((c) => (c === a.id ? null : a.id))}
                onFocus={() => setHover(a.id)}
                onBlur={() => setHover(null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setHover((c) => (c === a.id ? null : a.id));
                  }
                }}
                tabIndex={0}
                role="button"
                aria-pressed={hover === a.id}
                aria-label={`${a.city}, ${a.country} — ${a.note}`}
                className="cursor-pointer outline-none"
                opacity={dim ? 0.35 : 1}
                style={{ transition: "opacity 250ms" }}
              >
                {/*
                  THE TAP TARGET, which is not the dot.

                  The visible node is 26 units across in a 1000-unit viewBox. On
                  a 360px phone that renders about 9px wide — a quarter of the
                  44px minimum, and unhittable with a thumb. This invisible
                  circle is 88 units, which comes out at roughly 32px there and
                  comfortably more on anything larger, without changing how the
                  diagram looks.
                */}
                <circle r="44" fill="transparent" />
                {/* A halo on the two ends of the journey, so the eye starts and
                    finishes in the right places. */}
                {big ? (
                  <circle
                    r="26"
                    fill="hsl(var(--ai-emerald) / 0.12)"
                    className="ai-corridor-pulse"
                  />
                ) : null}
                {hover === a.id ? (
                  <circle
                    r={big ? 21 : 18}
                    fill="none"
                    stroke="hsl(var(--ai-copper-fill))"
                    strokeWidth="2.5"
                  />
                ) : null}
                <circle
                  r={big ? 13 : 10}
                  fill="hsl(var(--ai-white))"
                  stroke={
                    a.kind === "destination"
                      ? "hsl(var(--ai-copper-fill))"
                      : "hsl(var(--ai-emerald))"
                  }
                  strokeWidth="3"
                />
                <text
                  y={a.kind === "hub" ? -22 : -30}
                  textAnchor="middle"
                  className="ai-num"
                  fontSize="19"
                  fontWeight="800"
                  fill="hsl(var(--ai-charcoal))"
                >
                  {a.iata}
                </text>
                <text
                  y={a.kind === "hub" ? 32 : 38}
                  textAnchor="middle"
                  fontSize="17"
                  fontWeight="600"
                  fill="hsl(var(--ai-charcoal-soft))"
                >
                  {a.city}
                </text>
              </g>
            );
          })}

          {/* Column headings, so the shape is readable without hovering. */}
          {[
            { x: 90, label: "We load here" },
            { x: 500, label: "It connects here" },
            { x: 910, label: "It lands here" },
          ].map((c) => (
            <text
              key={c.label}
              x={c.x}
              y={400}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              letterSpacing="2"
              fill="hsl(var(--ai-charcoal-soft))"
            >
              {c.label.toUpperCase()}
            </text>
          ))}
        </svg>

        {/* What the pointer is on. Reserved height, so nothing jumps. */}
        <div
          className="flex min-h-[4.5rem] items-center border-t px-5 py-3.5"
          style={{ borderColor: "hsl(var(--ai-stone-3))" }}
        >
          {shown ? (
            <p className="text-sm">
              <span className="font-semibold">
                {shown.city}, {shown.country}
              </span>{" "}
              <span style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
                — {shown.note}
              </span>
            </p>
          ) : (
            <p className="text-sm" style={{ color: "hsl(var(--ai-charcoal-soft))" }}>
              Tap an airport — or tab through them — to see what happens at each
              one.
            </p>
          )}
        </div>
      </div>

      {/* ── the routes, as figures ──────────────────────────────────────── */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {routes.map((r) => (
          <div
            key={r.key}
            className="rounded-[var(--ai-radius-lg)] border p-5"
            style={{
              borderColor: "hsl(var(--ai-stone-3))",
              background: "hsl(var(--ai-white))",
            }}
          >
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <span className="ai-num">{r.origin.iata}</span>
              <Plane
                className="h-3.5 w-3.5"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                aria-hidden
              />
              <span className="ai-num">{r.hub.iata}</span>
              <Plane
                className="h-3.5 w-3.5"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                aria-hidden
              />
              <span className="ai-num">LUN</span>
            </p>
            <p className="ai-muted mt-1 text-sm">
              {r.origin.city} → {r.hub.city} → Lusaka
            </p>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {[
                { k: "First leg", v: `${r.first.toLocaleString()} km` },
                { k: "Second leg", v: `${r.second.toLocaleString()} km` },
                { k: "In the air", v: `${r.total.toLocaleString()} km` },
              ].map((f) => (
                <div key={f.k}>
                  <dt
                    className="text-[0.6rem] font-bold uppercase tracking-[0.12em]"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {f.k}
                  </dt>
                  <dd className="ai-num mt-0.5 text-sm font-semibold">{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <p className="ai-muted mt-4 text-xs">
        Distances are great-circle, between the airports themselves. Which hub
        your cargo connects at depends on the space we can get that week — we
        book whichever gets it to you soonest, and your tracking page names the
        flight it actually went on.
      </p>
    </div>
  );
}
