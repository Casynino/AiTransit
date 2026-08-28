import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TicketReplyForm } from "@/components/portal/support-forms";
import { Field, Note, PageHead, Panel, Pill } from "@/components/portal/ui";
import { formatDateTime } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { ownedTicket } from "@/lib/portal-data";
import { labelFor, TICKET_CATEGORY, TICKET_LABEL } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Conversation — AITRANSIT" };

/**
 * One support thread.
 *
 * THE THREAD IS FILTERED TO WHAT WAS SENT TO THEM. `ownedTicket` returns notes
 * with `internal: false` only, so the desk's working notes — written on the
 * same ticket, in the same list — never appear here. See TicketNote in
 * schema.prisma for why that column defaults to hidden.
 *
 * Us and them are told apart by the author's ROLE, not by their name. A
 * customer needs to know which side of the conversation a message came from;
 * they do not need a member of staff's surname and department.
 */
export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireCustomer();
  const { id } = await params;
  const ticket = await ownedTicket(viewer.customerId, id);

  const meta = labelFor(TICKET_LABEL, ticket.status);
  const closed = ticket.status === "CLOSED";

  return (
    <div>
      <Link
        href="/portal/support"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Support messages
      </Link>

      <PageHead
        title={ticket.subject}
        lede={`${TICKET_CATEGORY[ticket.category] ?? ticket.category} · ${ticket.ticketNumber}`}
        action={<Pill tone={meta.tone}>{meta.label}</Pill>}
      />

      {ticket.status === "WAITING_CUSTOMER" ? (
        <Note tone="amber" title="We are waiting on you">
          We have replied and asked you something. Answer below and it goes
          straight back to the desk.
        </Note>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-6">
          <Panel title="The conversation">
            <ol className="space-y-4">
              {/* The opening message is on the ticket itself, not in notes. */}
              <Message
                mine
                who="You"
                at={ticket.createdAt}
                body={ticket.body}
              />

              {ticket.notes.map((note) => {
                const mine = note.author?.role === "CUSTOMER";
                return (
                  <Message
                    key={note.id}
                    mine={mine}
                    who={
                      mine ? "You" : `AITRANSIT${note.author?.name ? ` · ${note.author.name.split(" ")[0]}` : ""}`
                    }
                    at={note.createdAt}
                    body={note.body}
                  />
                );
              })}
            </ol>
          </Panel>

          {ticket.resolution ? (
            <Note tone="emerald" title="How we settled it">
              {ticket.resolution}
            </Note>
          ) : null}

          {!closed ? (
            <Panel title="Reply">
              <TicketReplyForm ticketId={ticket.id} />
              <p className="ai-muted mt-3 text-xs">
                Replying to an answered conversation reopens it, so nothing gets
                lost.
              </p>
            </Panel>
          ) : (
            <Note tone="neutral">
              This conversation is closed. Start a new one if you need us again.
            </Note>
          )}
        </div>

        <Panel title="Details">
          <dl className="space-y-3">
            <Field label="Reference">
              <span className="ai-num">{ticket.ticketNumber}</span>
            </Field>
            <Field label="Opened">{formatDateTime(ticket.createdAt)}</Field>
            <Field label="Last activity">{formatDateTime(ticket.updatedAt)}</Field>
            {ticket.shipment ? (
              <Field label="About cargo">
                <Link
                  href={`/portal/cargo/${ticket.shipment.id}`}
                  className="ai-num underline underline-offset-2"
                >
                  {ticket.shipment.trackingNumber}
                </Link>
              </Field>
            ) : null}
          </dl>
        </Panel>
      </div>
    </div>
  );
}

function Message({
  mine,
  who,
  at,
  body,
}: {
  mine: boolean;
  who: string;
  at: Date;
  body: string;
}) {
  return (
    <li className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className="max-w-[85%] rounded-[var(--ai-radius-lg)] px-4 py-3"
        style={
          mine
            ? {
                background: "hsl(var(--ai-emerald) / 0.1)",
                borderTopRightRadius: "0.25rem",
              }
            : {
                background: "hsl(var(--ai-stone-2))",
                borderTopLeftRadius: "0.25rem",
              }
        }
      >
        <p
          className="text-[0.62rem] font-bold uppercase tracking-[0.12em]"
          style={{
            color: mine ? "hsl(var(--ai-emerald))" : "hsl(var(--ai-charcoal-soft))",
          }}
        >
          {who}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm">{body}</p>
        <p
          className="ai-num mt-1.5 text-[0.68rem]"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        >
          {formatDateTime(at)}
        </p>
      </div>
    </li>
  );
}
