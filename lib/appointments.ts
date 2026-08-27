import "server-only";

import type { AppointmentKind, AppointmentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * The diary: cargo pickups at Makeni and concierge work in China.
 *
 * One model for both because operationally they are the same thing — somebody
 * has to be somewhere at a time, and a member of staff has to agree it. What
 * differs is which fields the form collects, and that is a matter of which
 * `kind` was chosen, not of which table the row lives in.
 */

export const APPOINTMENT_LABELS: Record<AppointmentKind, string> = {
  CARGO_PICKUP: "Cargo pickup",
  SUPPLIER_VISIT: "Supplier visit",
  FACTORY_VISIT: "Factory visit",
  MARKET_VISIT: "China market visit",
  SOURCING_HELP: "Sourcing assistance",
  GOODS_INSPECTION: "Goods inspection",
  CONSULTATION: "Consultation",
};

/** What each service is, in one line, for the booking form's own explanation. */
export const APPOINTMENT_BLURB: Record<AppointmentKind, string> = {
  CARGO_PICKUP:
    "Collect your cargo from our Makeni warehouse. We check it is ready before confirming a slot.",
  SUPPLIER_VISIT:
    "We meet your supplier with you, or on your behalf, anywhere in Guangzhou.",
  FACTORY_VISIT:
    "A guided visit to a factory — production lines, samples, and terms.",
  MARKET_VISIT:
    "A day in the markets with someone who knows them and speaks the language.",
  SOURCING_HELP:
    "Tell us the product and we find suppliers, compare them and price it.",
  GOODS_INSPECTION:
    "We open the cartons and check them against your order before they are packed.",
  CONSULTATION:
    "A conversation about importing — routes, costs, categories and paperwork.",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  REQUESTED: "Requested",
  CONFIRMED: "Confirmed",
  RESCHEDULED: "Rescheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const APPOINTMENT_STATUS_TONE: Record<
  AppointmentStatus,
  "warning" | "success" | "info" | "muted"
> = {
  REQUESTED: "warning",
  CONFIRMED: "success",
  RESCHEDULED: "info",
  COMPLETED: "muted",
  CANCELLED: "muted",
};

/** Bookings nobody has finished with, as a filter so every count agrees. */
export const APPOINTMENT_OPEN_STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "RESCHEDULED",
] as const satisfies readonly AppointmentStatus[];

/** The concierge kinds — everything that is not collecting your own cargo. */
export const CONCIERGE_KINDS = [
  "MARKET_VISIT",
  "SUPPLIER_VISIT",
  "FACTORY_VISIT",
  "GOODS_INSPECTION",
  "SOURCING_HELP",
  "CONSULTATION",
] as const satisfies readonly AppointmentKind[];

/**
 * The desk's diary, open first and soonest first.
 *
 * Ordered on the date the customer ASKED for rather than on when they asked:
 * the booking that needs attention is the one happening on Thursday, not the
 * one submitted first.
 */
export async function appointmentQueue(options?: {
  status?: AppointmentStatus | "OPEN";
  kind?: AppointmentKind;
  take?: number;
}) {
  const status = options?.status;
  return prisma.appointment.findMany({
    where: {
      ...(status === "OPEN"
        ? { status: { in: [...APPOINTMENT_OPEN_STATUSES] } }
        : status
          ? { status }
          : {}),
      ...(options?.kind ? { kind: options.kind } : {}),
    },
    orderBy: [{ preferredDate: "asc" }, { createdAt: "asc" }],
    take: options?.take ?? 200,
    include: {
      customer: { select: { id: true, code: true, name: true, phone: true } },
      handledBy: { select: { name: true } },
      shipment: { select: { id: true, trackingNumber: true, status: true } },
    },
  });
}

export async function appointmentById(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      customer: true,
      handledBy: { select: { name: true } },
      shipment: {
        select: { id: true, trackingNumber: true, status: true, packages: true },
      },
    },
  });
}

/** How many are sitting on the desk, for the dashboard and the sidebar badge. */
export async function openAppointmentCount() {
  return prisma.appointment.count({
    where: { status: { in: [...APPOINTMENT_OPEN_STATUSES] } },
  });
}

/**
 * One customer's own bookings, for the portal.
 *
 * Takes the customer id rather than reading the session, so the only way to
 * call it is to have already resolved whose portal this is.
 */
export async function customerAppointments(customerId: string) {
  return prisma.appointment.findMany({
    where: { customerId },
    orderBy: { preferredDate: "desc" },
    take: 100,
    include: { shipment: { select: { trackingNumber: true } } },
  });
}
