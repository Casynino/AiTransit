import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
      customer: { select: { id: true, code: true, name: true, phone: true } },
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
  };
});

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
      customer: { select: { id: true, code: true, name: true, phone: true } },
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
  };
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
