import { Wrap } from "@/components/brand/ui";

/**
 * The corridor, step by step.
 *
 * Drawn as a horizontal run on desktop and a vertical one on a phone, because
 * the point being made is SEQUENCE — six things that happen in an order, each
 * one somebody's job — and a grid of six equal cards says "features" instead.
 *
 * The connecting rule is a single absolutely-positioned line behind the row
 * rather than a border on each step: borders leave a gap at every node, and six
 * small gaps read as a broken process.
 */
const STEPS: { n: string; title: string; body: string; who: string }[] = [
  {
    n: "01",
    title: "Your supplier delivers",
    body: "You send them our Guangzhou address. They drop the goods at our counter — that is the whole of your part.",
    who: "You & your supplier",
  },
  {
    n: "02",
    title: "We book it in",
    body: "Weighed on our own scales, counted, photographed, and labelled with the tracking number you follow it by.",
    who: "China warehouse",
  },
  {
    n: "03",
    title: "It flies",
    body: "Loaded onto a sealed batch out of Guangzhou or Hong Kong. Airline, flight and waybill all recorded against your cargo.",
    who: "China warehouse",
  },
  {
    n: "04",
    title: "Cleared into Lusaka",
    body: "Duty is settled by us, not billed to you later. The price you were quoted is the price that lands.",
    who: "AITRANSIT",
  },
  {
    n: "05",
    title: "Checked in at Makeni",
    body: "Every package counted against the manifest. Your tracking page turns to Checked in the moment it is physically on our floor.",
    who: "Zambia warehouse",
  },
  {
    n: "06",
    title: "You pay and collect",
    body: "We confirm your payment or approved credit, issue a pickup note, scan it against your cargo, and hand it over.",
    who: "Finance & counter",
  },
];

export function ProcessTimeline() {
  return (
    <Wrap>
      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-x-8 md:gap-y-14 lg:grid-cols-6 lg:gap-x-5">
        {STEPS.map((step, index) => (
          <li key={step.n} className="relative">
            {/* The rule runs from each node to the next, and is suppressed on
                the last item in every row so it never trails into nothing. */}
            <span
              aria-hidden
              className="absolute left-0 top-[0.72rem] hidden h-px w-full lg:block"
              style={{
                background:
                  index === STEPS.length - 1
                    ? "transparent"
                    : "hsl(var(--ai-stone-3))",
              }}
            />
            <span
              aria-hidden
              className="relative block h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  index === 0
                    ? "hsl(var(--ai-copper))"
                    : "hsl(var(--ai-emerald))",
                boxShadow: "0 0 0 5px hsl(var(--ai-stone))",
              }}
            />
            <p
              className="ai-num mt-5 text-xs font-semibold tracking-widest"
              style={{ color: "hsl(var(--ai-copper))" }}
            >
              {step.n}
            </p>
            <h3 className="ai-display-sm mt-2">{step.title}</h3>
            <p
              className="mt-2 text-[0.92rem] leading-relaxed"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {step.body}
            </p>
            <p
              className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.13em]"
              style={{ color: "hsl(var(--ai-charcoal-soft)/0.75)" }}
            >
              {step.who}
            </p>
          </li>
        ))}
      </ol>
    </Wrap>
  );
}
