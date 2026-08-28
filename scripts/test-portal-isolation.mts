/**
 * Does the portal ever show one customer another's records?
 *
 *   npx tsx scripts/test-portal-isolation.mts
 *
 * WHAT IT ACTUALLY TESTS. Every `owned*` function in lib/portal-data.ts is
 * called twice for the same record id: once as the customer who owns it, and
 * once as a different customer. The first must return the record; the second
 * must refuse. That is the whole security model of the portal, stated as an
 * executable claim rather than as a comment.
 *
 * `owned*` calls notFound(), which throws a Next.js control-flow error outside
 * a request. That throw IS the pass condition here — a function that returned
 * null instead would be one whose caller could forget to check.
 *
 * It also checks the two rules that are about disclosure rather than ownership:
 * internal ticket notes and internal claim events must not reach a customer who
 * legitimately owns the ticket or the claim.
 *
 * Read-only. It creates nothing and deletes nothing.
 */
import { PrismaClient } from "@prisma/client";

import {
  listCargo,
  listInvoices,
  listNotifications,
  ownedCargo,
  ownedClaim,
  ownedExchange,
  ownedInvoice,
  ownedPickupNote,
  ownedSourcing,
  ownedTicket,
} from "../lib/portal-data";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

const ok = (label: string) => {
  passed += 1;
  console.log(`  PASS  ${label}`);
};

const bad = (label: string, detail?: string) => {
  failed += 1;
  console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ""}`);
};

/** Run an `owned*` call and report whether it returned or refused. */
async function attempt(fn: () => Promise<unknown>): Promise<"returned" | "refused"> {
  try {
    await fn();
    return "returned";
  } catch {
    /* notFound() throws NEXT_HTTP_ERROR_FALLBACK;404 outside a request. */
    return "refused";
  }
}

/**
 * The pair of assertions that matters, for one record.
 *
 * Both halves are needed. "Refuses a stranger" on its own would pass on a
 * function that refuses everybody, which is secure and useless.
 */
async function bothWays(
  label: string,
  ownerId: string,
  strangerId: string,
  fn: (customerId: string) => Promise<unknown>
) {
  const asOwner = await attempt(() => fn(ownerId));
  const asStranger = await attempt(() => fn(strangerId));

  if (asOwner !== "returned") {
    bad(`${label} — the owner cannot read their own record`);
    return;
  }
  if (asStranger !== "refused") {
    bad(`${label} — A STRANGER CAN READ IT`, "This is a data leak.");
    return;
  }
  ok(`${label} — owner reads it, stranger gets 404`);
}

async function main() {
  console.log("\nPortal ownership isolation\n");

  /*
    THE OWNER IS THE RICHEST ACCOUNT, not the first one alphabetically.

    The first version took the first two customers with cargo and got two who
    had never raised a claim or opened a thread — so the two disclosure checks
    at the bottom silently skipped, and the run reported all-pass while testing
    nothing about internal notes. Picking the account with the most attached
    records means the checks that CAN run, do.
  */
  const candidates = await prisma.customer.findMany({
    where: { shipments: { some: {} } },
    select: {
      id: true,
      code: true,
      name: true,
      _count: {
        select: {
          shipments: true,
          invoices: true,
          tickets: true,
          pickupNotes: true,
          exchangeRequests: true,
          requests: true,
        },
      },
    },
  });

  if (candidates.length < 2) {
    console.error("Need two customers with cargo. Seed the demo data first.");
    process.exit(1);
  }

  const weight = (c: (typeof candidates)[number]) =>
    Object.values(c._count).reduce((sum, n) => sum + n, 0);

  const ranked = [...candidates].sort((x, y) => weight(y) - weight(x));
  const a = ranked[0]!;
  /* The stranger is the LEAST attached, so a leak has the furthest to travel. */
  const b = ranked[ranked.length - 1]!;
  console.log(`  owner    : ${a.name} (${a.code})`);
  console.log(`  stranger : ${b.name} (${b.code})\n`);

  /* ── every owned* accessor, against a real record of A's ──────────────── */

  const cargo = await prisma.shipment.findFirst({
    where: { customerId: a.id, deletedAt: null },
    select: { id: true, trackingNumber: true },
  });
  if (cargo) {
    await bothWays("cargo by id", a.id, b.id, (c) => ownedCargo(c, cargo.id));
    await bothWays("cargo by tracking number", a.id, b.id, (c) =>
      ownedCargo(c, cargo.trackingNumber)
    );
  }

  const invoice = await prisma.invoice.findFirst({
    where: { customerId: a.id, status: { not: "DRAFT" } },
    select: { id: true },
  });
  if (invoice) await bothWays("invoice", a.id, b.id, (c) => ownedInvoice(c, invoice.id));

  const note = await prisma.pickupNote.findFirst({
    where: { customerId: a.id },
    select: { id: true },
  });
  if (note) {
    await bothWays("pickup note", a.id, b.id, (c) => ownedPickupNote(c, note.id));
  }

  const claim = await prisma.shipmentException.findFirst({
    where: { shipment: { customerId: a.id } },
    select: { id: true },
  });
  if (claim) await bothWays("claim", a.id, b.id, (c) => ownedClaim(c, claim.id));

  const ticket = await prisma.supportTicket.findFirst({
    where: { customerId: a.id },
    select: { id: true },
  });
  if (ticket) {
    await bothWays("support thread", a.id, b.id, (c) => ownedTicket(c, ticket.id));
  }

  const exchange = await prisma.exchangeRequest.findFirst({
    where: { customerId: a.id },
    select: { id: true },
  });
  if (exchange) {
    await bothWays("money request", a.id, b.id, (c) => ownedExchange(c, exchange.id));
  }

  const sourcing = await prisma.sourcingRequest.findFirst({
    where: { customerId: a.id },
    select: { id: true },
  });
  if (sourcing) {
    await bothWays("china request", a.id, b.id, (c) => ownedSourcing(c, sourcing.id));
  }

  /* ── lists never bleed ────────────────────────────────────────────────── */
  console.log("");

  const aCargo = await listCargo(a.id, {});
  const cargoOwned = await prisma.shipment.count({
    where: { id: { in: aCargo.rows.map((r) => r.id) }, customerId: a.id },
  });
  cargoOwned === aCargo.rows.length
    ? ok(`cargo list — all ${aCargo.rows.length} rows belong to the viewer`)
    : bad("cargo list returned cargo the viewer does not own");

  /*
    A filter must narrow, never widen. Searching for the stranger's own tracking
    number as customer A must return nothing at all.
  */
  const strangerCargo = await prisma.shipment.findFirst({
    where: { customerId: b.id, deletedAt: null },
    select: { trackingNumber: true },
  });
  if (strangerCargo) {
    const leak = await listCargo(a.id, { q: strangerCargo.trackingNumber });
    leak.rows.length === 0
      ? ok("cargo search — a stranger's tracking number finds nothing")
      : bad("cargo search leaked a stranger's consignment through the q filter");
  }

  const aInvoices = await listInvoices(a.id, {});
  const invoicesOwned = await prisma.invoice.count({
    where: { id: { in: aInvoices.map((i) => i.id) }, customerId: a.id },
  });
  invoicesOwned === aInvoices.length
    ? ok(`invoice list — all ${aInvoices.length} rows belong to the viewer`)
    : bad("invoice list returned invoices the viewer does not own");

  aInvoices.every((i) => i.status !== "DRAFT")
    ? ok("invoice list — no drafts shown")
    : bad("invoice list showed a DRAFT invoice");

  /* ── disclosure rules inside a record the viewer DOES own ─────────────── */
  console.log("");

  if (ticket) {
    const internal = await prisma.ticketNote.count({
      where: { ticketId: ticket.id, internal: true },
    });
    const total = await prisma.ticketNote.count({ where: { ticketId: ticket.id } });
    const visible = await ownedTicket(a.id, ticket.id);

    if (internal === 0) {
      console.log("  ----  ticket has no internal notes to hide");
    } else if (visible.notes.length === total - internal) {
      ok(`support thread — ${internal} internal note(s) withheld`);
    } else {
      bad("support thread exposed an internal note");
    }
  }

  if (claim) {
    const hidden = await prisma.exceptionEvent.count({
      where: { exceptionId: claim.id, customerVisible: false },
    });
    const total = await prisma.exceptionEvent.count({
      where: { exceptionId: claim.id },
    });
    const visible = await ownedClaim(a.id, claim.id);

    if (hidden === 0) {
      console.log("  ----  claim has no internal events to hide");
    } else if (visible.events.length === total - hidden) {
      ok(`claim timeline — ${hidden} internal event(s) withheld`);
    } else {
      bad("claim timeline exposed an internal investigation note");
    }
  }

  /* ── notifications are addressed, not broadcast ───────────────────────── */
  /* The account that actually HAS notifications — otherwise this asserts that
     an empty list contains nothing of anybody's, which is trivially true. */
  const user =
    (await prisma.user.findFirst({
      where: { role: "CUSTOMER", notifications: { some: {} } },
      select: { id: true },
    })) ??
    (await prisma.user.findFirst({
      where: { role: "CUSTOMER" },
      select: { id: true },
    }));
  if (user) {
    const mine = await listNotifications(user.id);
    const allMine = await prisma.notification.count({
      where: { id: { in: mine.map((n) => n.id) }, userId: user.id },
    });
    allMine === mine.length
      ? ok(`notifications — all ${mine.length} addressed to the viewer`)
      : bad("notification list returned somebody else's notifications");
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
