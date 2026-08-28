import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ClaimReplyForm } from "@/components/portal/claim-forms";
import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import { formatDateTime, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { ownedClaim } from "@/lib/portal-data";
import { CLAIM_LABEL, CLAIM_TYPE, labelFor } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Claim — AITRANSIT" };

/**
 * One claim, and the part of its investigation the customer may read.
 *
 * THE TIMELINE IS FILTERED, NOT SUMMARISED. `ownedClaim` returns only events
 * flagged `customerVisible`, so what appears here is exactly what a member of
 * staff chose to tell them — the desk's own working notes sit on the same
 * timeline and never reach this page. See ExceptionEvent in schema.prisma.
 *
 * That also means a quiet claim looks quiet, which is honest: if nobody has
 * written a customer-facing update in a week, the customer should see that
 * rather than a page of internal activity they cannot interpret.
 */
export default async function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const claim = await ownedClaim(viewer.customerId, id);

  const meta = labelFor(CLAIM_LABEL, claim.status);
  const closed = ["CLOSED", "RESOLVED", "WRITTEN_OFF"].includes(claim.status);

  return (
    <div>
      <Link
        href="/portal/claims"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Issues & claims
      </Link>

      <PageHead
        title={CLAIM_TYPE[claim.type] ?? claim.type}
        lede={`On ${claim.shipment.trackingNumber} — ${claim.shipment.description}`}
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />

      {claim.status === "WAITING_CUSTOMER" ? (
        <Note tone="amber" title="We are waiting on you">
          We have asked you something on this claim. Reply below and we will pick
          it straight back up.
        </Note>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <Panel title="What you told us">
            <p className="whitespace-pre-wrap text-sm">{claim.description}</p>
          </Panel>

          {claim.photos.length > 0 ? (
            <Panel title="Photographs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {claim.photos.map((photo) => (
                  <a
                    key={photo.id}
                    href={photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-[var(--ai-radius)]"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? "Claim photograph"}
                      width={320}
                      height={240}
                      unoptimized
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title="What has happened">
            {claim.events.length === 0 ? (
              <p className="ai-muted text-sm">
                Nothing to report yet. We will write every update here.
              </p>
            ) : (
              <ol className="space-y-4">
                {claim.events.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "hsl(var(--ai-emerald))" }}
                    />
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap text-sm">
                        {event.note ?? event.action.replace(/[._]/g, " ")}
                      </p>
                      <p
                        className="ai-num mt-0.5 text-xs"
                        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
                      >
                        {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>

          {!closed ? (
            <Panel title="Add something">
              <ClaimReplyForm claimId={claim.id} />
            </Panel>
          ) : (
            <Note tone="neutral">
              This claim is closed. If there is more to say, start a{" "}
              <Link href="/portal/support" className="font-semibold underline">
                support conversation
              </Link>
              .
            </Note>
          )}
        </div>

        <div className="space-y-6">
          <Panel title="Details">
            <dl className="space-y-3">
              <Field label="Cargo">
                <Link
                  href={`/portal/cargo/${claim.shipment.id}`}
                  className="ai-num underline underline-offset-2"
                >
                  {claim.shipment.trackingNumber}
                </Link>
              </Field>
              <Field label="Raised">{formatDateTime(claim.raisedAt)}</Field>
              {claim.resolvedAt ? (
                <Field label="Settled">{formatDateTime(claim.resolvedAt)}</Field>
              ) : null}
              {claim.resolutionNote ? (
                <Field label="Outcome">
                  <span className="whitespace-pre-wrap">{claim.resolutionNote}</span>
                </Field>
              ) : null}
            </dl>
          </Panel>

          {claim.compensation ? (
            <Panel title="Compensation">
              <dl className="space-y-3">
                <Field label="Amount">
                  {claim.compensation.currency}{" "}
                  {toNumber(claim.compensation.amount).toFixed(2)}
                </Field>
                <Field label="Status">
                  {claim.compensation.paidAt
                    ? `Paid ${formatDateTime(claim.compensation.paidAt)}`
                    : "Agreed — Finance has not paid it out yet"}
                </Field>
                {claim.compensation.note ? (
                  <Field label="Note">{claim.compensation.note}</Field>
                ) : null}
              </dl>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
