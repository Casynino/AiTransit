import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, FileText } from "lucide-react";

import { PageHero, Section, Wrap } from "@/components/brand/ui";
import { IMAGES } from "@/lib/imagery";
import { COMPANY } from "@/lib/constants";
import { TERMS_DRAFT, TERMS_SECTIONS, TERMS_VERSION } from "@/lib/terms";

export const metadata: Metadata = {
  title: "Terms of business — AITRANSIT",
  description:
    "What we carry, how we price and weigh it, storage, payment, collection, and what happens if something goes wrong.",
};

/**
 * The terms, in public, at a stable address.
 *
 * IT HAS TO BE READABLE OR IT IS NOT AGREED TO. Terms nobody can read are terms
 * a customer can say they never saw, and a wall of eight-point grey is the
 * oldest way of achieving that. So: the same type as the rest of the site, real
 * paragraphs, a contents list that jumps, and headings that say what the section
 * is for rather than what it is called in a law book.
 *
 * THE VERSION IS PRINTED AT THE TOP. Every acceptance stores the version it was
 * given, so this page has to show which one a reader is looking at — otherwise
 * "you agreed to the terms" and "these are the terms" are two claims with
 * nothing connecting them.
 */
export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms of business"
        title="What we agree to, and what you agree to"
        lede="These terms cover every consignment we carry and every service we provide. They are written to be read — if anything here is unclear, ask us before you ship."
        photo={IMAGES.paperwork}
      />

      <Section>
        <Wrap>
          {/* ── the draft notice ──────────────────────────────────────────── */}
          {TERMS_DRAFT ? (
            <div
              className="mb-10 flex items-start gap-3 rounded-[var(--ai-radius-lg)] border px-5 py-4"
              style={{
                borderColor: "hsl(38 92% 50% / 0.45)",
                background: "hsl(38 92% 50% / 0.08)",
              }}
            >
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: "hsl(32 80% 40%)" }}
              />
              <div className="text-sm">
                <p className="font-semibold" style={{ color: "hsl(32 80% 32%)" }}>
                  These terms are with our lawyers
                </p>
                <p className="ai-muted mt-1">
                  We are publishing them now so that nobody trades with us on
                  terms they have not seen. They are being reviewed and may
                  change; if anything material changes we will ask you to agree
                  to the new version. Ask us about anything you are unsure of.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-12 lg:grid-cols-[16rem_1fr]">
            {/* ── contents ───────────────────────────────────────────────── */}
            <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
              <p
                className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.16em]"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                Contents
              </p>
              <ol className="space-y-2 text-sm">
                {TERMS_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="hover:underline"
                      style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>

              <div
                className="mt-6 rounded-[var(--ai-radius)] border px-4 py-3 text-xs"
                style={{ borderColor: "hsl(var(--ai-stone-3))" }}
              >
                <p className="flex items-center gap-1.5 font-semibold">
                  <FileText className="h-3.5 w-3.5" />
                  Version {TERMS_VERSION}
                </p>
                <p className="ai-muted mt-1">
                  This is the version currently in force. We will tell you when
                  it changes.
                </p>
              </div>
            </nav>

            {/* ── the terms ──────────────────────────────────────────────── */}
            <div className="min-w-0 max-w-3xl">
              {TERMS_SECTIONS.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  /* scroll-mt clears the sticky header when the contents list
                     jumps here, or the heading lands underneath it. */
                  className="mb-12 scroll-mt-28"
                >
                  <h2 className="ai-display-sm">{section.title}</h2>

                  {section.clauses.map((clause, i) => (
                    <div key={i} className="mt-6">
                      {clause.heading ? (
                        <h3 className="mb-2 font-semibold">{clause.heading}</h3>
                      ) : null}
                      {clause.body.map((paragraph, j) => (
                        <p key={j} className="ai-muted mt-3 first:mt-0">
                          {paragraph}
                        </p>
                      ))}
                      {clause.list ? (
                        <ul className="ai-muted mt-3 space-y-2 pl-5">
                          {clause.list.map((item, k) => (
                            <li key={k} className="list-disc">
                              {item}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                </section>
              ))}

              <div
                className="rounded-[var(--ai-radius-lg)] border p-6"
                style={{ borderColor: "hsl(var(--ai-stone-3))" }}
              >
                <h2 className="font-semibold">Questions before you ship?</h2>
                <p className="ai-muted mt-2 text-sm">
                  Ring us on{" "}
                  <a href={`tel:${COMPANY.phone}`} className="ai-num underline">
                    {COMPANY.phone}
                  </a>{" "}
                  or email{" "}
                  <a href={`mailto:${COMPANY.email}`} className="underline">
                    {COMPANY.email}
                  </a>
                  . We would much rather answer a question now than settle an
                  argument later.
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <Link href="/register" className="ai-btn ai-btn-primary">
                    Open an account
                  </Link>
                  <Link href="/contact" className="ai-btn ai-btn-outline">
                    Talk to us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Wrap>
      </Section>
    </>
  );
}
