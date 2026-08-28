import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

/**
 * Every read the customer portal makes, in one file.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: a portal query is safe if and only if
 * it is narrowed by `customerId`, and there is no portal query that lives
 * anywhere else. Pages import from here; they do not reach for `prisma`
 * themselves. That is the whole security model, and it is a placement rule
 * rather than a review rule because a review rule is one hurried afternoon away
 * from a customer reading somebody else's invoice.
 *
 * Two shapes appear throughout:
 *
 *   list*(customerId)              — always `where: { customerId }`
 *   owned*(customerId, id)         — `where: { id, customerId }`, notFound()
 *
 * The second is the important one. Fetching by id and then comparing the owner
 * in the page would work, and it fails open the first time somebody forgets the
 * comparison or writes `if (row.customerId = viewer.customerId)`. Putting the
 * owner in the WHERE clause means a row that is not yours does not come back at
 * all, so there is nothing to forget to check.
 *
 * NOT FOUND, NOT FORBIDDEN. Asking for a consignment that belongs to somebody
 * else returns the same 404 as asking for one that does not exist. A 403 would
 * confirm the record is real, which turns a URL bar into a way of discovering
 * how many customers we have.
 */

/* ------------------------------------------------------------------ shapes */

/**
 * The columns a customer may see on their own consignment.
 *
 * Written out rather than taken wholesale, because Shipment carries fields that
 * are ours and not theirs: `internalNotes` is what the warehouse said about the
 * cargo, `deleteReason` is why somebody removed it, `createdById` names a
 * member of staff. A `select` that lists what is shown cannot leak a column
 * somebody adds later; an `include` can, and would.
 */
const CARGO_FIELDS = {
  id: true,
  trackingNumber: true,
  qrToken: true,
  status: true,
  description: true,
  descriptionEn: true,
  cargoCategory: true,
  cargoType: { select: { name: true } },
  goodsType: true,
  packages: true,
  packageType: true,
  weightKg: true,
  chargeableKg: true,
  volumeCbm: true,
  origin: true,
  quotedAmount: true,
  quoteCurrency: true,
  quotedMethod: true,
  quotedRate: true,
  registeredAt: true,
  departedAt: true,
  arrivedAt: true,
  readyForPickup: true,
  deliveredAt: true,
  createdAt: true,
  batch: {
    select: {
      batchNumber: true,
      status: true,
      origin: true,
      departedAt: true,
      arrivedAt: true,
      expectedArrival: true,
    },
  },
  invoice: {
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      amountPaid: true,
      currency: true,
      status: true,
      paymentType: true,
      creditStatus: true,
      dueDate: true,
      issuedAt: true,
      confirmedAt: true,
      storageDays: true,
      storageCharge: true,
    },
  },
  pickupNote: {
    select: { id: true, noteNumber: true, status: true, issuedAt: true },
  },
} as const;

/* -------------------------------------------------------------- one record */

/**
 * One consignment, by id or by tracking number, if it is theirs.
 *
 * Accepts either because a customer arrives here two ways — a link from the
 * list, and typing AT-000123 into the tracking box — and making the tracking
 * page resolve a number to an id first would be a second query that could be
 * written without the owner filter.
 */
export async function ownedCargo(customerId: string, idOrTracking: string) {
  const key = idOrTracking.trim().toUpperCase();

  const cargo = await prisma.shipment.findFirst({
    where: {
      customerId,
      deletedAt: null,
      OR: [{ id: idOrTracking }, { trackingNumber: key }],
    },
    select: {
      ...CARGO_FIELDS,
      photos: {
        orderBy: { createdAt: "asc" },
        select: { id: true, url: true, kind: true, caption: true, createdAt: true },
      },
      packageList: {
        orderBy: { sequence: "asc" },
        select: { id: true, sequence: true, reference: true, weightKg: true },
      },
      /*
        The customer-facing history, not the audit trail.

        ShipmentStatusHistory records every transition with the member of staff
        who made it; the portal shows what happened and when, and never who.
        A customer does not need to know which clerk pressed the button, and
        naming them turns an ordinary correction into a complaint about a
        person.
      */
      statusHistory: {
        orderBy: { createdAt: "asc" },
        select: { id: true, toStatus: true, createdAt: true, note: true },
      },
      exceptions: {
        orderBy: { raisedAt: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          description: true,
          raisedAt: true,
          resolvedAt: true,
        },
      },
    },
  });

  if (!cargo) notFound();
  return cargo;
}

/** One invoice, with its payment history, if it is theirs. */
export async function ownedInvoice(customerId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    /*
      DRAFT is excluded here as everywhere in the portal. A draft is Finance's
      working figure — it may still change, and it has not been put to anybody.
      Showing one would be quoting a price we have not agreed to.
    */
    where: { id: invoiceId, customerId, status: { not: "DRAFT" } },
    select: {
      id: true,
      invoiceNumber: true,
      currency: true,
      freightCost: true,
      freightOverride: true,
      storageDays: true,
      storageCharge: true,
      storageWaivedUsd: true,
      otherCharges: true,
      discount: true,
      total: true,
      amountPaid: true,
      status: true,
      exchangeRate: true,
      localCurrency: true,
      totalLocal: true,
      paymentType: true,
      creditStatus: true,
      creditTermDays: true,
      creditDecidedAt: true,
      issuedAt: true,
      dueDate: true,
      confirmedAt: true,
      notes: true,
      shipment: {
        select: {
          id: true,
          trackingNumber: true,
          description: true,
          packages: true,
          packageType: true,
          weightKg: true,
          chargeableKg: true,
          status: true,
          arrivedAt: true,
          deliveredAt: true,
          cargoType: { select: { name: true } },
        },
      },
      payments: {
        orderBy: { paidAt: "desc" },
        select: {
          id: true,
          amount: true,
          currency: true,
          method: true,
          reference: true,
          paidAt: true,
        },
      },
      submissions: {
        orderBy: { submittedAt: "desc" },
        select: {
          id: true,
          submissionNumber: true,
          amount: true,
          currency: true,
          method: true,
          reference: true,
          note: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          proofs: { select: { id: true, url: true, filename: true } },
        },
      },
    },
  });

  if (!invoice) notFound();
  return invoice;
}

/**
 * One claim, with the part of its timeline the customer may read.
 *
 * `customerVisible: true` on the events is the whole difference between this
 * and what the investigation queue shows. See the column's comment in
 * schema.prisma — the desk's own notes live on the same timeline.
 */
export async function ownedClaim(customerId: string, claimId: string) {
  const claim = await prisma.shipmentException.findFirst({
    where: { id: claimId, shipment: { customerId } },
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      severity: true,
      raisedAt: true,
      resolvedAt: true,
      resolutionType: true,
      resolutionNote: true,
      shipment: {
        select: { id: true, trackingNumber: true, description: true },
      },
      photos: { select: { id: true, url: true, caption: true, createdAt: true } },
      /* Compensation has no status of its own: unpaid until `paidAt` is set. */
      compensation: {
        select: { id: true, amount: true, currency: true, paidAt: true, note: true },
      },
      events: {
        where: { customerVisible: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, action: true, note: true, createdAt: true },
      },
    },
  });

  if (!claim) notFound();
  return claim;
}

/** One support thread, with internal notes stripped. */
export async function ownedTicket(customerId: string, ticketId: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, customerId },
    select: {
      id: true,
      ticketNumber: true,
      category: true,
      priority: true,
      status: true,
      subject: true,
      body: true,
      resolution: true,
      createdAt: true,
      updatedAt: true,
      resolvedAt: true,
      shipment: { select: { id: true, trackingNumber: true } },
      notes: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          /*
            The author's ROLE, not their identity beyond a first name. A
            customer should know whether they are reading us or themselves;
            they have no need for a surname and a department.
          */
          author: { select: { name: true, role: true } },
        },
      },
    },
  });

  if (!ticket) notFound();
  return ticket;
}

export async function ownedAppointment(customerId: string, id: string) {
  const row = await prisma.appointment.findFirst({
    where: { id, customerId },
    select: {
      id: true,
      reference: true,
      kind: true,
      status: true,
      contactName: true,
      contactPhone: true,
      contactEmail: true,
      preferredDate: true,
      preferredTime: true,
      visitors: true,
      locationName: true,
      locationAddress: true,
      productType: true,
      needsInterpreter: true,
      packages: true,
      budgetUsd: true,
      notes: true,
      documentUrl: true,
      documentName: true,
      confirmedFor: true,
      staffNote: true,
      handledAt: true,
      createdAt: true,
      updatedAt: true,
      shipment: { select: { id: true, trackingNumber: true, status: true } },
    },
  });
  if (!row) notFound();
  return row;
}

export async function ownedExchange(customerId: string, id: string) {
  const row = await prisma.exchangeRequest.findFirst({
    where: { id, customerId },
    select: {
      id: true,
      reference: true,
      type: true,
      status: true,
      fromCurrency: true,
      toCurrency: true,
      amount: true,
      recipientName: true,
      recipientContact: true,
      recipientDetails: true,
      purpose: true,
      preferredMethod: true,
      notes: true,
      documentUrl: true,
      documentName: true,
      agreedRate: true,
      agreedAmount: true,
      feeAmount: true,
      decisionNote: true,
      reviewedAt: true,
      proofUrl: true,
      proofName: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      shipment: { select: { id: true, trackingNumber: true } },
      supplierPayment: {
        select: {
          id: true,
          reference: true,
          status: true,
          supplierName: true,
          amount: true,
          currency: true,
          paymentReference: true,
          proofUrl: true,
          proofName: true,
          paidAt: true,
        },
      },
    },
  });
  if (!row) notFound();
  return row;
}

export async function ownedSourcing(customerId: string, id: string) {
  const row = await prisma.sourcingRequest.findFirst({
    where: { id, customerId },
    select: {
      id: true,
      requestNumber: true,
      type: true,
      product: true,
      category: true,
      description: true,
      budgetUsd: true,
      status: true,
      priority: true,
      /* What the desk found out and chose to write down for them. */
      findings: true,
      documentUrl: true,
      documentName: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
    },
  });
  if (!row) notFound();
  return row;
}

/** One pickup note, if it is theirs. Drives the collection document. */
export async function ownedPickupNote(customerId: string, id: string) {
  const row = await prisma.pickupNote.findFirst({
    where: { id, customerId },
    select: {
      id: true,
      noteNumber: true,
      status: true,
      amountPaid: true,
      currency: true,
      issuedAt: true,
      usedAt: true,
      cancelledAt: true,
      shipment: {
        select: {
          id: true,
          trackingNumber: true,
          qrToken: true,
          description: true,
          packages: true,
          packageType: true,
          weightKg: true,
          status: true,
          arrivedAt: true,
          cargoType: { select: { name: true } },
          invoice: {
            select: {
              invoiceNumber: true,
              total: true,
              amountPaid: true,
              currency: true,
              status: true,
              creditStatus: true,
              paymentType: true,
            },
          },
        },
      },
    },
  });
  if (!row) notFound();
  return row;
}

/* ------------------------------------------------------------------- lists */

export async function listCargo(
  customerId: string,
  filters: {
    q?: string;
    status?: string;
    batch?: string;
    from?: string;
    to?: string;
  } = {}
) {
  const { q, status, batch, from, to } = filters;

  /*
    Filters narrow; they never widen. Every branch below adds to a WHERE that
    already contains `customerId`, and none replaces it — which is why this is
    built as an object literal spread rather than assembled from parts.
  */
  const where = {
    customerId,
    deletedAt: null,
    ...(status && status !== "ALL" ? { status: status as never } : {}),
    ...(batch ? { batch: { batchNumber: batch } } : {}),
    ...(from || to
      ? {
          registeredAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { trackingNumber: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            {
              batch: {
                batchNumber: { contains: q, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const [rows, batches] = await Promise.all([
    prisma.shipment.findMany({
      where,
      orderBy: { registeredAt: "desc" },
      take: 200,
      select: {
        ...CARGO_FIELDS,
        photos: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { url: true },
        },
      },
    }),
    /* The batch filter's options — only batches this customer has cargo on. */
    prisma.batch.findMany({
      where: { shipments: { some: { customerId, deletedAt: null } } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { batchNumber: true, origin: true },
    }),
  ]);

  return { rows, batches };
}

export async function listInvoices(
  customerId: string,
  filters: { q?: string; status?: string } = {}
) {
  const { q, status } = filters;

  return prisma.invoice.findMany({
    where: {
      customerId,
      status: { not: "DRAFT" },
      ...(status && status !== "ALL" ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { invoiceNumber: { contains: q, mode: "insensitive" as const } },
              {
                shipment: {
                  trackingNumber: {
                    contains: q,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { issuedAt: "desc" },
    take: 200,
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
      confirmedAt: true,
      shipment: { select: { id: true, trackingNumber: true, description: true } },
      submissions: {
        where: { status: "PENDING" },
        select: { id: true, submissionNumber: true, submittedAt: true },
      },
    },
  });
}

export async function listPickupNotes(customerId: string) {
  return prisma.pickupNote.findMany({
    where: { customerId },
    orderBy: { issuedAt: "desc" },
    take: 100,
    select: {
      id: true,
      noteNumber: true,
      status: true,
      amountPaid: true,
      currency: true,
      issuedAt: true,
      usedAt: true,
      shipment: {
        select: {
          id: true,
          trackingNumber: true,
          description: true,
          packages: true,
          packageType: true,
          status: true,
        },
      },
    },
  });
}

export async function listAppointments(customerId: string) {
  return prisma.appointment.findMany({
    where: { customerId },
    orderBy: [{ preferredDate: "desc" }],
    take: 100,
    select: {
      id: true,
      reference: true,
      kind: true,
      status: true,
      preferredDate: true,
      preferredTime: true,
      confirmedFor: true,
      visitors: true,
      locationName: true,
      contactName: true,
      contactPhone: true,
      staffNote: true,
      createdAt: true,
      shipment: { select: { trackingNumber: true } },
    },
  });
}

export async function listExchange(customerId: string) {
  return prisma.exchangeRequest.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      type: true,
      status: true,
      fromCurrency: true,
      toCurrency: true,
      amount: true,
      agreedRate: true,
      agreedAmount: true,
      recipientName: true,
      createdAt: true,
      completedAt: true,
    },
  });
}

export async function listSupplierPayments(customerId: string) {
  return prisma.supplierPayment.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reference: true,
      status: true,
      supplierName: true,
      supplierContact: true,
      amount: true,
      currency: true,
      amountUsd: true,
      paymentReference: true,
      proofUrl: true,
      proofName: true,
      paidAt: true,
      createdAt: true,
      notes: true,
      shipment: { select: { trackingNumber: true } },
      request: { select: { id: true, reference: true, status: true } },
    },
  });
}

export async function listSourcing(customerId: string) {
  return prisma.sourcingRequest.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      requestNumber: true,
      type: true,
      product: true,
      status: true,
      priority: true,
      findings: true,
      createdAt: true,
      completedAt: true,
    },
  });
}

export async function listClaims(customerId: string) {
  return prisma.shipmentException.findMany({
    where: { shipment: { customerId } },
    orderBy: { raisedAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      status: true,
      description: true,
      raisedAt: true,
      resolvedAt: true,
      shipment: { select: { id: true, trackingNumber: true } },
      compensation: { select: { amount: true, currency: true, paidAt: true } },
    },
  });
}

export async function listTickets(customerId: string) {
  return prisma.supportTicket.findMany({
    where: { customerId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      ticketNumber: true,
      category: true,
      priority: true,
      status: true,
      subject: true,
      createdAt: true,
      updatedAt: true,
      shipment: { select: { trackingNumber: true } },
      _count: { select: { notes: { where: { internal: false } } } },
    },
  });
}

/**
 * The notification centre.
 *
 * Notifications hang off User, not Customer, because staff have them too — so
 * this is the one list in the file filtered by `userId` rather than
 * `customerId`. It is equally safe and for the same reason: the id comes from
 * the session, and a row that is not addressed to it is not returned.
 */
export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      href: true,
      readAt: true,
      createdAt: true,
    },
  });
}

export async function unreadNotifications(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}
