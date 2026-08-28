"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check } from "lucide-react";

import { FormError, Submit } from "@/components/portal/form";
import { acceptTerms } from "@/lib/actions/portal-account";
import {
  TERMS_CONSENT_LABEL,
  TERMS_DRAFT,
  TERMS_SECTIONS,
  TERMS_VERSION,
} from "@/lib/terms";

/**
 * Reading the terms, and agreeing to them, on one screen.
 *
 * THE TERMS ARE ON THIS PAGE, NOT BEHIND A LINK. A gate that says "I agree to
 * the terms" with a link to somewhere else is a gate everybody clicks through
 * without reading, and it is the version a customer most easily says they never
 * saw. The whole document is here, in a panel they scroll.
 *
 * THE BOX DOES NOT UNLOCK UNTIL THEY REACH THE BOTTOM. Not to be difficult —
 * because scrolling to the end is the cheapest honest evidence that the
 * document was in front of somebody. It is a low bar and it is a real one, and
 * the caption says plainly what it is waiting for rather than leaving a
 * disabled control with no explanation.
 *
 * A short viewport can show the whole document without scrolling, so the check
 * also passes when there is nothing to scroll. A gate that cannot be satisfied
 * is a gate that locks customers out of their own account.
 */
export function AcceptTermsForm({
  firstName,
  returning,
  next,
}: {
  firstName: string;
  /** True when they accepted an earlier version — the wording changes. */
  returning: boolean;
  next: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(acceptTerms, undefined);
  const [read, setRead] = useState(false);

  if (state?.ok) {
    /*
      Pushed rather than rendered as a "done" screen. They came here to get
      somewhere, and the somewhere is the whole point of the `next` parameter.
    */
    router.replace(next);
    router.refresh();
    return (
      <div className="ai-card mx-auto max-w-md text-center">
        <Check
          className="mx-auto h-9 w-9"
          style={{ color: "hsl(var(--ai-emerald))" }}
        />
        <p className="mt-4 font-semibold">Thank you — taking you through.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p
        className="text-[0.7rem] font-bold uppercase tracking-[0.18em]"
        style={{ color: "hsl(var(--ai-emerald))" }}
      >
        Before you carry on
      </p>
      <h1 className="ai-display-sm mt-3">
        {returning
          ? `${firstName}, we have updated our terms`
          : `Welcome, ${firstName}`}
      </h1>
      <p className="ai-muted mt-2 max-w-2xl">
        {returning
          ? "We have changed our terms of business since you last agreed to them. Please read them and agree before carrying on."
          : "Before you use your account, please read the terms your cargo is carried on. They cover what we carry, how we price and weigh it, storage, payment, collection, and what happens if something goes wrong."}
      </p>

      {TERMS_DRAFT ? (
        <div
          className="mt-6 flex items-start gap-3 rounded-[var(--ai-radius)] border px-4 py-3 text-sm"
          style={{
            borderColor: "hsl(38 92% 50% / 0.45)",
            background: "hsl(38 92% 50% / 0.08)",
          }}
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: "hsl(32 80% 40%)" }}
          />
          <p>
            These terms are with our lawyers and may change. We are publishing
            them now so that nobody trades with us on terms they have not seen —
            if anything material changes we will ask you again.
          </p>
        </div>
      ) : null}

      {/* ── the document ──────────────────────────────────────────────────── */}
      <div
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) setRead(true);
        }}
        ref={(el) => {
          /* Nothing to scroll — a tall window, or a short document. */
          if (el && el.scrollHeight <= el.clientHeight + 8) setRead(true);
        }}
        className="mt-6 max-h-[26rem] overflow-y-auto rounded-[var(--ai-radius-lg)] border p-6"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-white))",
        }}
      >
        <p
          className="ai-num mb-6 text-xs"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        >
          Version {TERMS_VERSION}
        </p>

        {TERMS_SECTIONS.map((section) => (
          <section key={section.id} className="mb-8 last:mb-0">
            <h2 className="font-semibold">{section.title}</h2>
            {section.clauses.map((clause, i) => (
              <div key={i} className="mt-4">
                {clause.heading ? (
                  <h3 className="mb-1.5 text-sm font-semibold">{clause.heading}</h3>
                ) : null}
                {clause.body.map((paragraph, j) => (
                  <p
                    key={j}
                    className="mt-2 text-sm first:mt-0"
                    style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                  >
                    {paragraph}
                  </p>
                ))}
                {clause.list ? (
                  <ul className="mt-2 space-y-1.5 pl-5 text-sm">
                    {clause.list.map((item, k) => (
                      <li
                        key={k}
                        className="list-disc"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </section>
        ))}
      </div>

      {/* ── the tick ──────────────────────────────────────────────────────── */}
      <form action={action} className="mt-6 space-y-4">
        <FormError state={state} />

        <label
          className="flex items-start gap-3 rounded-[var(--ai-radius)] border px-4 py-3.5"
          style={{
            borderColor: read
              ? "hsl(var(--ai-emerald) / 0.45)"
              : "hsl(var(--ai-stone-3))",
            background: read
              ? "hsl(var(--ai-emerald) / 0.06)"
              : "hsl(var(--ai-stone-2))",
            opacity: read ? 1 : 0.6,
          }}
        >
          <input
            type="checkbox"
            name="acceptTerms"
            required
            disabled={!read}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span className="min-w-0 text-sm font-medium">
            {TERMS_CONSENT_LABEL}
            <span
              className="mt-1 block text-xs font-normal"
              style={{ color: "hsl(var(--ai-charcoal-soft))" }}
            >
              {read
                ? "You can read them again any time from the bottom of any page."
                : "Scroll to the end of the terms above to continue."}
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Submit pending="Saving…">
            Agree and continue
            <ArrowRight className="h-4 w-4" />
          </Submit>
          <Link
            href="/api/auth/signout"
            className="text-sm font-medium underline underline-offset-2"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            Not now — sign out
          </Link>
        </div>

        <p className="ai-hint">
          You need to agree before you can use your account. If there is
          something here you cannot accept, tell us — we would rather talk about
          it than lose you.
        </p>
      </form>
    </div>
  );
}
