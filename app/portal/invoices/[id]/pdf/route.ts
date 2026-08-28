import { NextResponse } from "next/server";

import { AIRPORT_LABELS, CATEGORY_LABELS } from "@/lib/cargo";
import { accountsForInvoice } from "@/lib/company-settings";
import { formatDate, toNumber } from "@/lib/format";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { requireAcceptedTerms } from "@/lib/portal";
import { prisma } from "@/lib/prisma";

/**
 * The customer's own invoice, as a file they can send on.
 *
 * SAME RENDERER AS FINANCE'S, DIFFERENT GATE. It calls renderInvoicePdf with
 * the same fields the staff route does, so the customer's copy and the desk's
 * copy are the same document — a portal that generated its own prettier
 * version would be a second invoice with the same number, and the day the two
 * disagreed there would be no way to say which was real.
 *
 * The gate is the difference and it is the whole point: `requireCustomer`
 * resolves the session to one Customer id, and that id goes into the WHERE
 * clause. Somebody else's invoice id returns 404, not 403 — see lib/portal-data.ts
 * for why the portal never distinguishes the two.
 *
 * DRAFTS ARE REFUSED, as they are on the staff route and everywhere else in the
 * portal. A draft is Finance's working figure; a downloadable file leaves the
 * building and cannot be recalled.
 */
function fileName(customerName: string, trackingNumber: string) {
  const first = customerName.trim().split(/\s+/)[0] ?? "";
  const clean = first.replace(/[^\p{L}\p{N}]/gu, "");
  const full = `${clean.length > 0 ? clean : "Customer"} ${trackingNumber}.pdf`;
  return {
    full,
    ascii:
      full.replace(/[^\x20-\x7E]/g, "").replace(/"/g, "").trim() ||
      `${trackingNumber}.pdf`,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  /*
    requireAcceptedTerms, not requireCustomer.

    A route handler is not wrapped by the portal layout, so the terms gate that
    covers every page does not cover this. Without it, a customer who has not
    agreed to anything could still pull their invoice down by typing the URL —
    which is a small hole and the only one, which is exactly the sort that gets
    found.
  */
  const viewer = await requireAcceptedTerms();
  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, customerId: viewer.customerId, status: { not: "DRAFT" } },
    select: {
      invoiceNumber: true,
      status: true,
      issuedAt: true,
      dueDate: true,
      currency: true,
      freightCost: true,
      freightOverride: true,
      storageCharge: true,
      storageDays: true,
      storageWaivedUsd: true,
      otherCharges: true,
      discount: true,
      total: true,
      amountPaid: true,
      exchangeRate: true,
      localCurrency: true,
      totalLocal: true,
      /* What this invoice was issued with — not today's settings, which would
         print account numbers the customer was never given. */
      paymentSnapshot: true,
      customer: { select: { name: true, phone: true, city: true } },
      shipment: {
        select: {
          trackingNumber: true,
          description: true,
          weightKg: true,
          packages: true,
          packageType: true,
          origin: true,
          cargoCategory: true,
          cargoType: { select: { name: true } },
          batch: { select: { batchNumber: true } },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  const total = toNumber(invoice.total);
  const paid = toNumber(invoice.amountPaid);

  const pdf = renderInvoicePdf({
    invoiceNumber: invoice.invoiceNumber,
    issuedOn: formatDate(invoice.issuedAt),
    dueOn: invoice.dueDate ? formatDate(invoice.dueDate) : null,
    status: invoice.status,

    customerName: invoice.customer.name,
    customerPhone: invoice.customer.phone,
    customerCity: invoice.customer.city,

    trackingNumber: invoice.shipment.trackingNumber,
    batchNumber: invoice.shipment.batch?.batchNumber ?? null,
    description: invoice.shipment.description,
    weightKg: toNumber(invoice.shipment.weightKg),
    packages: invoice.shipment.packages,
    packageType: invoice.shipment.packageType,
    routeLabel: `${AIRPORT_LABELS[invoice.shipment.origin]} → Lusaka`,
    cargoLabel:
      invoice.shipment.cargoType?.name ??
      CATEGORY_LABELS[invoice.shipment.cargoCategory],

    currency: invoice.currency,
    freight:
      invoice.freightOverride === null
        ? toNumber(invoice.freightCost)
        : toNumber(invoice.freightOverride),
    storage: toNumber(invoice.storageCharge),
    storageDays: invoice.storageDays,
    storageWaived: toNumber(invoice.storageWaivedUsd),
    otherCharges: toNumber(invoice.otherCharges),
    discount: toNumber(invoice.discount),
    total,
    paid,
    outstanding: Math.max(0, total - paid),

    exchangeRate:
      invoice.exchangeRate === null ? null : toNumber(invoice.exchangeRate),
    localCurrency: invoice.localCurrency,
    totalLocal:
      invoice.totalLocal === null ? null : toNumber(invoice.totalLocal),
    accounts: accountsForInvoice(invoice.paymentSnapshot),
  });

  const name = fileName(invoice.customer.name, invoice.shipment.trackingNumber);

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        `attachment; filename="${name.ascii}"; ` +
        `filename*=UTF-8''${encodeURIComponent(name.full)}`,
      "Cache-Control": "no-store",
    },
  });
}
