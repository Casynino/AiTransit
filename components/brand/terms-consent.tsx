import Link from "next/link";

import {
  TERMS_CONSENT_HINT,
  TERMS_CONSENT_LABEL,
  TERMS_DRAFT,
  TERMS_VERSION,
} from "@/lib/terms";

/**
 * The tick that has to be ticked.
 *
 * ONE COMPONENT FOR EVERY FORM THAT STARTS A RELATIONSHIP — registration, the
 * booking form, the pickup request, the sourcing enquiry, the exchange forms.
 * Written once because the wording is the thing being agreed to: five forms
 * each with their own sentence is five different agreements, and only one of
 * them would ever get updated.
 *
 * NOT PRE-TICKED, AND IT NEVER WILL BE. A pre-ticked consent box is not
 * consent — it is a box the person did not untick — and it is the first thing
 * anybody disputing an agreement points at. `required` on the input means the
 * browser refuses to submit without it; the action re-checks server-side,
 * because a browser is not a place to enforce anything.
 *
 * The version is on the page next to the link, so the record of what somebody
 * agreed to matches what they could see when they agreed to it.
 */
export function TermsConsent({
  name = "acceptTerms",
  compact = false,
}: {
  name?: string;
  /** Drops the hint line, for forms where space is tight. */
  compact?: boolean;
}) {
  return (
    <label
      className="flex items-start gap-3 rounded-[var(--ai-radius)] border px-4 py-3.5"
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-stone-2))",
      }}
    >
      <input
        type="checkbox"
        name={name}
        required
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">
          {TERMS_CONSENT_LABEL}{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
            style={{ color: "hsl(var(--ai-emerald))" }}
          >
            Read them
          </Link>
          <span
            className="ai-num ml-1.5 text-[0.7rem]"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            v{TERMS_VERSION}
          </span>
        </span>

        {compact ? null : (
          <span
            className="mt-1 block text-xs"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            {TERMS_CONSENT_HINT}
            {TERMS_DRAFT
              ? " These terms are currently with our lawyers and may change; we will ask you again if anything material does."
              : ""}
          </span>
        )}
      </span>
    </label>
  );
}
