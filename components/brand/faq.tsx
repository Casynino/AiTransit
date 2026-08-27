import { Plus } from "lucide-react";

/**
 * Frequently asked questions.
 *
 * Built on <details>/<summary> rather than JavaScript state. It works before
 * hydration, it is keyboard-operable and screen-reader-announced for free, and
 * a customer on a slow connection in a market can open an answer while the rest
 * of the page is still arriving.
 *
 * The questions are the ones the desk answers on WhatsApp all day. Every answer
 * states a number or a rule rather than a reassurance — "seven days, then USD 2
 * a day" is worth more to somebody deciding than "we offer competitive storage".
 */
export type Faq = { q: string; a: React.ReactNode };

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y" style={{ borderColor: "hsl(var(--ai-stone-3))" }}>
      {items.map((item) => (
        <details
          key={item.q}
          className="group border-t first:border-t-0"
          style={{ borderColor: "hsl(var(--ai-stone-3))" }}
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <h3 className="ai-display-sm pr-2">{item.q}</h3>
            <span
              aria-hidden
              className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-transform duration-300 group-open:rotate-45"
              style={{
                borderColor: "hsl(var(--ai-stone-3))",
                color: "hsl(var(--ai-emerald))",
              }}
            >
              <Plus className="h-4 w-4" />
            </span>
          </summary>
          <div
            className="max-w-2xl pb-7 text-[0.98rem] leading-relaxed"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}
