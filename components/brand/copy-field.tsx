"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * A block of text with a copy button.
 *
 * Exists because of one specific job: a customer forwarding our Guangzhou
 * address to their supplier on WeChat. Selecting four lines of Chinese on a
 * phone, by dragging, without dropping a character, is genuinely hard — and a
 * dropped character is a driver at the wrong gate.
 *
 * The confirmation resets itself after two seconds. A button that stays
 * "Copied" forever leaves somebody unsure whether the second tap worked.
 */
export function CopyField({
  label,
  value,
  children,
}: {
  label: string;
  /** What actually goes on the clipboard — may differ from what is displayed. */
  value: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className="rounded-[var(--ai-radius)] border p-5"
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-white))",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <p
          className="text-[0.68rem] font-bold uppercase tracking-[0.14em]"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        >
          {label}
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              /* Clipboard refused — an insecure origin, or permission denied.
                 The text is on screen and selectable, so there is nothing to
                 recover from and nothing worth alarming the visitor about. */
            }
          }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            borderColor: copied
              ? "hsl(var(--ai-emerald))"
              : "hsl(var(--ai-stone-3))",
            color: copied
              ? "hsl(var(--ai-emerald))"
              : "hsl(var(--ai-charcoal-soft))",
          }}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
