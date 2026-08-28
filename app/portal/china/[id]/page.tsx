import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Paperclip } from "lucide-react";

import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import { formatDate, formatDateTime, toNumber } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { ownedSourcing } from "@/lib/portal-data";
import { labelFor, SOURCING_LABEL, SOURCING_TYPE } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Request — AITRANSIT" };

/**
 * One China service request.
 *
 * `findings` is the only thing the desk writes that a customer reads, and it is
 * shown here as "what we found" rather than as a status change — a customer
 * asking us to verify a supplier wants the answer, not a state machine.
 */
export default async function ChinaRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const req = await ownedSourcing(viewer.customerId, id);
  const meta = labelFor(SOURCING_LABEL, req.status);

  return (
    <div>
      <Link
        href="/portal/china"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        China services
      </Link>

      <PageHead
        title={SOURCING_TYPE[req.type] ?? req.type}
        lede={req.product}
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />

      {meta.hint ? <Note tone="neutral">{meta.hint}</Note> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <Panel title="What you asked for">
            <p className="whitespace-pre-wrap text-sm">{req.description}</p>
            {req.documentUrl ? (
              <a
                href={req.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {req.documentName ?? "Your attachment"}
              </a>
            ) : null}
          </Panel>

          {req.findings ? (
            <Panel title="What we found">
              <p className="whitespace-pre-wrap text-sm">{req.findings}</p>
            </Panel>
          ) : (
            <Panel title="What we found">
              <p className="ai-muted text-sm">
                Nothing back yet. Our Guangzhou team writes their answer here, and
                you will get a notification when they do.
              </p>
            </Panel>
          )}
        </div>

        <Panel title="Details">
          <dl className="space-y-3">
            <Field label="Reference">
              <span className="ai-num">{req.requestNumber}</span>
            </Field>
            <Field label="Asked">{formatDateTime(req.createdAt)}</Field>
            <Field label="Last update">{formatDateTime(req.updatedAt)}</Field>
            {req.budgetUsd ? (
              <Field label="Your budget">
                USD {toNumber(req.budgetUsd).toFixed(2)}
              </Field>
            ) : null}
            {req.completedAt ? (
              <Field label="Finished">{formatDate(req.completedAt)}</Field>
            ) : null}
          </dl>

          <Link href="/portal/support" className="ai-btn ai-btn-outline mt-4 w-full">
            Ask about this
          </Link>
        </Panel>
      </div>
    </div>
  );
}
