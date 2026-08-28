import type { Metadata } from "next";
import Link from "next/link";
import { BadgeAlert, Plus } from "lucide-react";

import { Empty, Note, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { formatDate, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listClaims } from "@/lib/portal-data";
import { CLAIM_LABEL, CLAIM_TYPE, labelFor } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Issues & claims — AITRANSIT" };

/**
 * Claims against cargo: missing, damaged, wrong.
 *
 * SEPARATE FROM SUPPORT MESSAGES on purpose. A claim has an outcome a
 * conversation does not — the box is found, or compensation is agreed — and it
 * goes into the investigation queue the Lusaka warehouse works, not the support
 * inbox. Merging the two means claims get marked "answered" when nobody has
 * found anything.
 */
export default async function ClaimsPage() {
  const viewer = await requireCustomer();
  const claims = await listClaims(viewer.customerId);

  const open = claims.filter(
    (c) => !["CLOSED", "RESOLVED", "WRITTEN_OFF"].includes(c.status)
  );
  const closed = claims.filter((c) =>
    ["CLOSED", "RESOLVED", "WRITTEN_OFF"].includes(c.status)
  );

  return (
    <div>
      <PageHead
        title="Issues & claims"
        lede="Cargo that is missing, damaged or not what you sent. Raise it here and follow it to a decision."
        action={
          <Link href="/portal/claims/new" className="ai-btn ai-btn-primary">
            <Plus className="h-4 w-4" />
            Raise an issue
          </Link>
        }
      />

      {claims.length === 0 ? (
        <Empty
          icon={BadgeAlert}
          title="Nothing wrong — good"
          body="If cargo arrives damaged, short or not what you sent, tell us here. Photograph it before you move it."
          action={
            <Link href="/portal/claims/new" className="ai-btn ai-btn-primary">
              Raise an issue
            </Link>
          }
        />
      ) : null}

      {open.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Open
          </h2>
          <div className="space-y-3">
            {open.map((claim) => {
              const meta = labelFor(CLAIM_LABEL, claim.status);
              return (
                <RecordRow
                  key={claim.id}
                  href={`/portal/claims/${claim.id}`}
                  title={CLAIM_TYPE[claim.type] ?? claim.type}
                  subtitle={
                    <span className="ai-num">{claim.shipment.trackingNumber}</span>
                  }
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    { label: "Raised", value: formatDate(claim.raisedAt) },
                    ...(claim.compensation
                      ? [
                          {
                            label: "Compensation",
                            value: `${claim.compensation.currency} ${toNumber(claim.compensation.amount).toFixed(2)}${
                              claim.compensation.paidAt ? " · paid" : " · not yet paid"
                            }`,
                          },
                        ]
                      : []),
                  ]}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {closed.length > 0 ? (
        <section>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Closed
          </h2>
          <div className="space-y-3">
            {closed.map((claim) => {
              const meta = labelFor(CLAIM_LABEL, claim.status);
              return (
                <RecordRow
                  key={claim.id}
                  href={`/portal/claims/${claim.id}`}
                  title={CLAIM_TYPE[claim.type] ?? claim.type}
                  subtitle={
                    <span className="ai-num">{claim.shipment.trackingNumber}</span>
                  }
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    { label: "Raised", value: formatDate(claim.raisedAt) },
                    ...(claim.resolvedAt
                      ? [{ label: "Settled", value: formatDate(claim.resolvedAt) }]
                      : []),
                  ]}
                />
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
