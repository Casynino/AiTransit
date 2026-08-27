import type { Metadata } from "next";

import { ChinaRequestForm } from "@/components/portal/china-request-form";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { portalOverview, requireCustomer } from "@/lib/portal";

export const metadata: Metadata = { title: "My requests" };

const SOURCING_LABEL: Record<string, string> = {
  FIND_SUPPLIER: "Find a supplier",
  FIND_PRODUCT: "Find a product",
  REQUEST_QUOTATION: "Quotation",
  VERIFY_SUPPLIER: "Verify a supplier",
  BUY_ON_BEHALF: "Buy on my behalf",
  INSPECT_GOODS: "Goods inspection",
  COLLECT_FROM_SUPPLIER: "Collection from supplier",
  PACKING: "Packing",
  SEND_IN_ADVANCE: "Send in advance",
  PAY_ON_COLLECTION: "Pay on collection",
};

const SOURCING_TONE: Record<string, "muted" | "info" | "warning" | "success"> = {
  NEW: "warning",
  IN_PROGRESS: "info",
  WAITING_CUSTOMER: "warning",
  SUPPLIER_FOUND: "info",
  COMPLETED: "success",
  CANCELLED: "muted",
};

const TICKET_TONE: Record<string, "muted" | "info" | "warning" | "success"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  WAITING_CUSTOMER: "warning",
  RESOLVED: "success",
  CLOSED: "muted",
};

/**
 * China service requests and support tickets, on one page.
 *
 * Both are things the customer has asked for and is waiting on, which is the
 * only grouping that matters to them — internally one is the sourcing queue and
 * the other is the support desk, and that distinction is ours, not theirs.
 */
export default async function PortalRequestsPage() {
  const viewer = await requireCustomer();
  const { sourcing, tickets } = await portalOverview(viewer.customerId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Requests
          </h1>
          <p className="mt-1 text-muted-foreground">
            China services, sourcing and anything you have raised with support.
          </p>
        </div>
        <ChinaRequestForm />
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold">China requests</h2>
        {sourcing.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nothing yet. Use the button above to ask our Guangzhou desk for an
            inspection, a collection, packing or a quotation.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {sourcing.map((request) => (
              <li key={request.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{request.requestNumber}</p>
                    <p className="font-medium">
                      {SOURCING_LABEL[request.type] ?? request.type} —{" "}
                      {request.product}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={SOURCING_TONE[request.status] ?? "muted"}>
                      {request.status.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
                {request.findings ? (
                  <p className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">
                    <span className="block text-xs uppercase tracking-widest text-muted-foreground">
                      What we found
                    </span>
                    {request.findings}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Support</h2>
        {tickets.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            Nothing open. Message us on WhatsApp and we will raise a ticket for
            you if it needs one.
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-xl border">
            {tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="flex flex-wrap items-start justify-between gap-3 p-4"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm">{ticket.ticketNumber}</p>
                  <p className="font-medium">{ticket.subject}</p>
                </div>
                <div className="text-right">
                  <Badge variant={TICKET_TONE[ticket.status] ?? "muted"}>
                    {ticket.status.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
