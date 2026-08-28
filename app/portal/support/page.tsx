import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";

import { NewTicketForm } from "@/components/portal/support-forms";
import { Empty, Note, PageHead, Pill, RecordRow } from "@/components/portal/ui";
import { COMPANY } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { requireCustomer } from "@/lib/portal";
import { listCargo, listTickets } from "@/lib/portal-data";
import { labelFor, TICKET_CATEGORY, TICKET_LABEL } from "@/lib/portal-labels";

export const metadata: Metadata = { title: "Support — AITRANSIT" };

/**
 * Conversations with the support desk.
 *
 * WE STILL PUT THE PHONE NUMBER ON THE PAGE. A portal thread is the right place
 * for anything with a record attached to it, and it is the wrong place for
 * "I am standing at your gate and it is locked". Hiding the telephone number
 * behind a web form is the commonest way a support page makes people angrier.
 */
export default async function SupportPage() {
  const viewer = await requireCustomer();
  const [tickets, { rows }] = await Promise.all([
    listTickets(viewer.customerId),
    listCargo(viewer.customerId, {}),
  ]);

  const open = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const done = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));

  return (
    <div>
      <PageHead
        title="Support messages"
        lede="Ask us anything. Everything you send and everything we reply stays here."
      />

      <div className="mb-6">
        <NewTicketForm
          cargo={rows.map((r) => ({
            id: r.id,
            trackingNumber: r.trackingNumber,
          }))}
        />
      </div>

      <Note tone="neutral" title="In a hurry?">
        Ring or WhatsApp us on{" "}
        <a href={`tel:${COMPANY.phone}`} className="ai-num font-semibold underline">
          {COMPANY.phone}
        </a>
        . Use a message here when there is something to keep a record of.
      </Note>

      {tickets.length === 0 ? (
        <div className="mt-6">
          <Empty
            icon={MessageSquare}
            title="No conversations yet"
            body="Start one above. We reply here and you will get a notification."
          />
        </div>
      ) : null}

      {open.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Open
          </h2>
          <div className="space-y-3">
            {open.map((ticket) => {
              const meta = labelFor(TICKET_LABEL, ticket.status);
              return (
                <RecordRow
                  key={ticket.id}
                  href={`/portal/support/${ticket.id}`}
                  title={ticket.subject}
                  subtitle={
                    <>
                      {TICKET_CATEGORY[ticket.category] ?? ticket.category}
                      {ticket.shipment
                        ? ` · ${ticket.shipment.trackingNumber}`
                        : ""}
                    </>
                  }
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    { label: "Reference", value: ticket.ticketNumber },
                    {
                      label: "Replies",
                      value: String(ticket._count.notes),
                    },
                    {
                      label: "Last activity",
                      value: formatRelative(ticket.updatedAt),
                    },
                  ]}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {done.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em]">
            Answered
          </h2>
          <div className="space-y-3">
            {done.map((ticket) => {
              const meta = labelFor(TICKET_LABEL, ticket.status);
              return (
                <RecordRow
                  key={ticket.id}
                  href={`/portal/support/${ticket.id}`}
                  title={ticket.subject}
                  subtitle={TICKET_CATEGORY[ticket.category] ?? ticket.category}
                  right={<Pill tone={meta.tone}>{meta.label}</Pill>}
                  facts={[
                    { label: "Reference", value: ticket.ticketNumber },
                    {
                      label: "Last activity",
                      value: formatRelative(ticket.updatedAt),
                    },
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
