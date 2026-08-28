import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { EXCEPTION_OPEN_STATUSES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { TERMS_VERSION } from "@/lib/terms";

/**
 * The customer portal's one and only gate.
 *
 * THE DESIGN, IN A SENTENCE: the portal never asks "does this person have
 * permission to see this?" — it asks "is this theirs?", and answers it by
 * resolving the session to exactly one Customer id and filtering every query in
 * the portal by that id.
 *
 * That is deliberate, and it is why role CUSTOMER holds no permissions at all
 * (see lib/rbac.ts). A permission-based portal would need a new permission for
 * every screen, each one meaning "may see their own X" — and the first one
 * somebody forgot to scope by customer would show one customer another's
 * invoices. Here there is nothing to forget: there is no query in the portal
 * that is not already narrowed by the id this function returns.
 *
 * A staff account reaching a portal route is bounced to the staff app rather
 * than shown an error. It is not a security event — a member of staff following
 * a link from a customer's email is the ordinary case — and there is nothing
 * for them here, because they have no Customer record of their own.
 */
export type PortalViewer = {
  userId: string;
  customerId: string;
  name: string;
  email: string;
  /** The customer's own code — CUS-000123 — which is what the desk asks for. */
  code: string;
  phone: string | null;
  /** Which terms they have agreed to, or null. Drives requireAcceptedTerms. */
  termsVersion: string | null;
};

/**
 * Resolve the signed-in customer, or leave.
 *
 * Deduplicated per request with cache(): a portal page and its layout both call
 * this, and without it every render would repeat the same lookup.
 */
export const requireCustomer = cache(async (): Promise<PortalViewer> => {
  const session = await auth();

  if (!session?.user?.id) redirect("/login?callbackUrl=/portal");
  if (session.user.role !== "CUSTOMER") redirect("/app/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          code: true,
          name: true,
          phone: true,
          termsVersion: true,
        },
      },
    },
  });

  /*
    A CUSTOMER account with no linked Customer row cannot happen through
    registration — the two are created in one transaction — but it could through
    a hand-edited database. Bouncing to login rather than throwing means the
    worst outcome is somebody being asked to sign in again, instead of a stack
    trace on a public page.
  */
  if (!user?.customerId || !user.customer) redirect("/login?callbackUrl=/portal");

  return {
    userId: user.id,
    customerId: user.customerId,
    name: user.customer.name || user.name,
    email: user.email,
    code: user.customer.code,
    phone: user.customer.phone,
    termsVersion: user.customer.termsVersion,
  };
});

/**
 * The same gate, plus: have they agreed to the terms that are current now?
 *
 * WHY IT IS A SECOND FUNCTION RATHER THAN PART OF requireCustomer. The
 * acceptance screen itself needs a signed-in customer and must NOT be bounced
 * to the acceptance screen, or it redirects to itself forever. So there are two
 * gates: one that says who you are, and one that says whether you may proceed.
 * Exactly one page uses the first alone.
 *
 * IT COMPARES VERSIONS, NOT DATES. Somebody who accepted last year's terms has
 * not accepted this year's. Checking only that a date exists is how a versioned
 * document quietly stops meaning anything — see lib/terms.ts.
 *
 * The redirect carries `next`, so somebody who followed a link to their invoice
 * from an email lands on the invoice after accepting, rather than on the
 * overview wondering where the link went.
 */
export async function requireAcceptedTerms(next?: string): Promise<PortalViewer> {
  const viewer = await requireCustomer();
  if (viewer.termsVersion !== TERMS_VERSION) {
    /*
      /accept-terms, NOT /portal/terms.

      A gate inside the portal would be caught by this very check and redirect
      itself to itself forever. It sits at the top level for that reason, and
      because a blocking screen should have nothing to navigate away into.
    */
    redirect(
      next ? `/accept-terms?next=${encodeURIComponent(next)}` : "/accept-terms"
    );
  }
  return viewer;
}

/**
 * The signed-in customer, or null — for surfaces that render either way.
 *
 * Used by the public header, which shows "My portal" to a signed-in customer
 * and "Register" to everybody else, and must not redirect anybody for asking.
 */
export async function currentCustomer(): Promise<PortalViewer | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "CUSTOMER") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      customerId: true,
      customer: {
        select: {
          id: true,
          code: true,
          name: true,
          phone: true,
          termsVersion: true,
        },
      },
    },
  });
  if (!user?.customerId || !user.customer) return null;

  return {
    userId: user.id,
    customerId: user.customerId,
    name: user.customer.name || user.name,
    email: user.email,
    code: user.customer.code,
    phone: user.customer.phone,
    termsVersion: user.customer.termsVersion,
  };
}

/**
 * The numbers the sidebar puts on links.
 *
 * Four counts, deliberately: a badge is a summons, and a menu where every item
 * carries one is a menu that summons you nowhere. These are the four things
 * that are genuinely waiting on the customer — money owed, cargo they can
 * collect today, a claim still open, and unread news.
 *
 * Counted rather than fetched. The sidebar renders on every portal page, so
 * this runs on every portal page, and four COUNT queries against indexed
 * columns is the cheapest honest way to answer.
 */
export async function portalBadges(
  customerId: string,
  userId: string
): Promise<{ unpaid: number; ready: number; openIssues: number; unread: number }> {
  const [unpaid, ready, openIssues, unread] = await Promise.all([
    prisma.invoice.count({
      where: { customerId, status: { in: ["UNPAID", "PARTIALLY_PAID"] } },
    }),
    prisma.shipment.count({
      where: { customerId, deletedAt: null, status: "READY_FOR_PICKUP" },
    }),
    /*
      EXCEPTION_OPEN_STATUSES rather than "not closed": several terminal states
      exist (RESOLVED, WRITTEN_OFF, CARGO_FOUND) and counting them as open would
      badge a customer forever over a claim that was settled in March.
    */
    prisma.shipmentException.count({
      where: {
        shipment: { customerId },
        status: { in: [...EXCEPTION_OPEN_STATUSES] },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { unpaid, ready, openIssues, unread };
}

/**
 * Everything the portal home needs about one customer, in one round trip.
 *
 * Every query below is filtered by `customerId`. That is not a convention to be
 * careful about — it is the only reason this data is safe to render, so the
 * queries live together here rather than being scattered across pages where one
 * could quietly be written without the filter.
 */
export async function portalOverview(customerId: string) {
  const [shipments, invoices, exchangeRequests, sourcing, tickets, customer] =
    await Promise.all([
      prisma.shipment.findMany({
        where: { customerId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          trackingNumber: true,
          status: true,
          description: true,
          /* The priced product, not a free-text word — cargoLabel() in
             lib/cargo.ts pairs the two so a customer reads "Clothes (nguo)"
             rather than one or the other alone. */
          cargoType: { select: { name: true } },
          packages: true,
          packageType: true,
          weightKg: true,
          cargoCategory: true,
          createdAt: true,
          /* When the Lusaka warehouse checked it in. This is what starts the storage
             clock — see storageStatus() in lib/constants.ts. */
          arrivedAt: true,
          readyForPickup: true,
          deliveredAt: true,
          batch: { select: { batchNumber: true, status: true } },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              amountPaid: true,
              status: true,
              currency: true,
              creditStatus: true,
              dueDate: true,
              confirmedAt: true,
            },
          },
          pickupNote: { select: { id: true, noteNumber: true, status: true } },
        },
      }),
      prisma.invoice.findMany({
        where: { customerId, status: { not: "DRAFT" } },
        orderBy: { issuedAt: "desc" },
        take: 100,
        select: {
          id: true,
          invoiceNumber: true,
          issuedAt: true,
          dueDate: true,
          total: true,
          amountPaid: true,
          currency: true,
          status: true,
          paymentType: true,
          creditStatus: true,
          storageDays: true,
          storageCharge: true,
          shipment: { select: { trackingNumber: true } },
        },
      }),
      prisma.exchangeRequest.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.sourcingRequest.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.supportTicket.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          creditLimitUsd: true,
          creditTermDays: true,
          creditApprovedAt: true,
        },
      }),
    ]);

  return { shipments, invoices, exchangeRequests, sourcing, tickets, customer };
}

/**
 * The extra things the front page shows that portalOverview does not.
 *
 * Split out rather than folded into the query above because these are the
 * "what is happening around my cargo" rows — bookings, claims, notifications —
 * and portalOverview is already six queries deep. Two functions the home page
 * awaits together is the same round trip and a great deal easier to read than
 * one function returning eleven things.
 */
export async function portalActivity(customerId: string, userId: string) {
  const now = new Date();

  const [
    nextPickup,
    nextVisit,
    openClaims,
    notifications,
    supplierPayments,
    recentMoves,
  ] = await Promise.all([
    /* The soonest booking they can still turn up to. */
    prisma.appointment.findFirst({
      where: {
        customerId,
        kind: "CARGO_PICKUP",
        status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] },
        preferredDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      orderBy: { preferredDate: "asc" },
      select: {
        id: true,
        reference: true,
        status: true,
        preferredDate: true,
        preferredTime: true,
        confirmedFor: true,
        shipment: { select: { trackingNumber: true } },
      },
    }),
    prisma.appointment.findFirst({
      where: {
        customerId,
        kind: { not: "CARGO_PICKUP" },
        status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] },
        preferredDate: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      orderBy: { preferredDate: "asc" },
      select: {
        id: true,
        reference: true,
        kind: true,
        status: true,
        preferredDate: true,
        confirmedFor: true,
        locationName: true,
      },
    }),
    prisma.shipmentException.findMany({
      where: {
        shipment: { customerId },
        status: { in: [...EXCEPTION_OPEN_STATUSES] },
      },
      orderBy: { raisedAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        raisedAt: true,
        shipment: { select: { trackingNumber: true } },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.supplierPayment.count({
      where: { customerId, status: "PENDING" },
    }),
    /*
      The activity feed: real transitions, newest first.

      Read from ShipmentStatusHistory rather than assembled from the shipments
      already fetched, because a timeline is about WHEN things happened and the
      shipment row only carries where each one is now. Filtered by the customer
      through the relation, like everything else.
    */
    prisma.shipmentStatusHistory.findMany({
      where: { shipment: { customerId, deletedAt: null } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        toStatus: true,
        createdAt: true,
        shipment: { select: { id: true, trackingNumber: true } },
      },
    }),
  ]);

  return {
    nextPickup,
    nextVisit,
    openClaims,
    notifications,
    supplierPayments,
    recentMoves,
  };
}
