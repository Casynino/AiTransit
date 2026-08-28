/**
 * Portal demo data: one signed-in customer with a full account behind them.
 *
 *   npx tsx prisma/seed-demo-portal.mts            # create or refresh
 *   npx tsx prisma/seed-demo-portal.mts --remove   # take it all away again
 *
 * WHAT THIS IS FOR. seed-demo-cargo.mts creates forty consignments across ten
 * customers, which exercises the warehouse and finance screens. It creates no
 * portal logins and none of the things a customer does for themselves, so the
 * customer portal had nothing to look at. This adds exactly that, to ONE of
 * those ten customers: a login, a pickup booking, a supplier payment that has
 * actually been sent, a currency booking mid-negotiation, a market visit, an
 * open damage claim with a conversation on it, a support thread the desk has
 * replied to, and the notifications all of that would have produced.
 *
 * ONE CUSTOMER, NOT TEN, AND THAT IS THE POINT. A demo where every customer has
 * everything teaches nothing about isolation. The second demo login below —
 * Bwalya, who has cargo and nothing else — exists so the ownership rules can be
 * demonstrated rather than asserted: sign in as Bwalya, paste one of Chanda's
 * record ids into the URL, get a 404.
 *
 * THE SAFETY RULES IT INHERITS, unchanged from seed-demo-cargo.mts:
 *
 *   It only ever touches rows it can prove it made. Every record is either
 *   prefixed `DEMO-AIT-` in its own reference column, or hangs off a customer
 *   whose code carries that prefix. `--remove` matches on exactly that and
 *   nothing else, so it cannot reach a real customer's booking.
 *
 *   It is idempotent. Run it twice and the second run refreshes rather than
 *   duplicates: it removes its own previous output first, then rebuilds.
 *
 *   It refuses to invent staff. Everything the desk "did" is attributed to the
 *   real seeded staff accounts, and the script stops if they are missing.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { TERMS_VERSION } from "../lib/terms";

const prisma = new PrismaClient();

const PREFIX = "DEMO-AIT-";
const REMOVE = process.argv.includes("--remove");

/**
 * The demo password.
 *
 * The same one the staff accounts use, because this is demonstration data on a
 * system the owner has not yet opened to real customers, and two passwords to
 * remember during a walkthrough is one too many. It is stated in the output so
 * nobody has to look for it — and it is the reason `--remove` exists.
 */
const PASSWORD = "aitransitpass";

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const daysAhead = (n: number) => new Date(Date.now() + n * 86_400_000);
const money = (n: number) => new Prisma.Decimal(n.toFixed(2));

/* ------------------------------------------------------------------ remove */

async function remove() {
  /*
    Everything is found through the demo customers, or through a reference that
    starts with the prefix. There is no path from here to a row that lacks one.
  */
  const customers = await prisma.customer.findMany({
    where: { code: { startsWith: PREFIX } },
    select: { id: true },
  });
  const customerIds = customers.map((c) => c.id);

  const portalUsers = await prisma.user.findMany({
    where: { role: "CUSTOMER", customerId: { in: customerIds } },
    select: { id: true },
  });
  const userIds = portalUsers.map((u) => u.id);

  const steps: [string, () => Promise<{ count: number }>][] = [
    [
      "notifications",
      () => prisma.notification.deleteMany({ where: { userId: { in: userIds } } }),
    ],
    [
      "ticket replies",
      () =>
        prisma.ticketNote.deleteMany({
          where: { ticket: { customerId: { in: customerIds } } },
        }),
    ],
    [
      "support threads",
      () =>
        prisma.supportTicket.deleteMany({
          where: { customerId: { in: customerIds } },
        }),
    ],
    [
      "claim updates",
      () =>
        prisma.exceptionEvent.deleteMany({
          where: { exception: { shipment: { customerId: { in: customerIds } } } },
        }),
    ],
    [
      "claims",
      () =>
        prisma.shipmentException.deleteMany({
          where: { shipment: { customerId: { in: customerIds } } },
        }),
    ],
    [
      "supplier payments",
      () =>
        prisma.supplierPayment.deleteMany({
          where: { customerId: { in: customerIds } },
        }),
    ],
    [
      "money requests",
      () =>
        prisma.exchangeRequest.deleteMany({
          where: { customerId: { in: customerIds } },
        }),
    ],
    [
      "bookings",
      () =>
        prisma.appointment.deleteMany({ where: { customerId: { in: customerIds } } }),
    ],
    [
      "china service requests",
      () =>
        prisma.sourcingRequest.deleteMany({
          where: { customerId: { in: customerIds } },
        }),
    ],
    [
      "payment submissions",
      () =>
        prisma.paymentSubmission.deleteMany({
          where: { invoice: { customerId: { in: customerIds } } },
        }),
    ],
    /*
      The portal logins go LAST of the user-owned rows, because notifications
      cascade off them and deleting the user first would take the count with it
      before it could be reported.
    */
    ["portal logins", () => prisma.user.deleteMany({ where: { id: { in: userIds } } })],
    [
      "terms acceptances",
      () =>
        prisma.termsAcceptance.deleteMany({
          where: { customerId: { in: customerIds } },
        }),
    ],
  ];

  for (const [label, run] of steps) {
    const { count } = await run();
    if (count) console.log(`  removed ${count} ${label}`);
  }

  /* The gate's own state, which is denormalised and does not cascade. */
  await prisma.customer.updateMany({
    where: { id: { in: customerIds } },
    data: { termsVersion: null, termsAcceptedAt: null },
  });

  console.log("\nPortal demo data removed. Cargo, invoices and customers were not touched.");
}

/* -------------------------------------------------------------------- seed */

async function seed() {
  /* ── the staff who "did" everything below ─────────────────────────────── */
  const staff = await prisma.user.findMany({
    where: {
      email: {
        in: [
          "china@aitransit.co.zm",
          "warehouse@aitransit.co.zm",
          "finance@aitransit.co.zm",
          "support@aitransit.co.zm",
        ],
      },
    },
    select: { id: true, email: true },
  });
  const by = (email: string) => staff.find((s) => s.email === email)?.id ?? null;
  const support = by("support@aitransit.co.zm");
  const finance = by("finance@aitransit.co.zm");
  const china = by("china@aitransit.co.zm");

  if (!support || !finance || !china) {
    throw new Error(
      "Staff accounts are missing. Run `npx prisma db seed` first — this script " +
        "records who did what and will not invent a user to do it."
    );
  }

  /* ── the two demo customers ───────────────────────────────────────────── */
  const customers = await prisma.customer.findMany({
    where: { code: { startsWith: PREFIX } },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, phone: true, email: true },
  });

  if (customers.length < 2) {
    throw new Error(
      "No demo customers found. Run `npx tsx prisma/seed-demo-cargo.mts` first — " +
        "this script gives an existing demo customer a portal account, it does " +
        "not create cargo."
    );
  }

  const main = customers[0]!;
  const other = customers[1]!;

  const hash = await bcrypt.hash(PASSWORD, 10);

  /*
    The login. Upsert on email so a re-run refreshes the password rather than
    colliding — and `customerId` is what makes the account resolve to a person:
    a CUSTOMER user without one is a broken session by design. See
    requireCustomer in lib/portal.ts.
  */
  const mainUser = await prisma.user.upsert({
    where: { email: main.email ?? `${main.code.toLowerCase()}@example.co.zm` },
    update: { passwordHash: hash, customerId: main.id, status: "ACTIVE" },
    create: {
      email: main.email ?? `${main.code.toLowerCase()}@example.co.zm`,
      name: main.name,
      passwordHash: hash,
      role: "CUSTOMER",
      /* CUSTOMER is a department as well as a role — see lib/rbac.ts, where
         the role holds no permissions and the department is what the app shell
         reads to know it is not staff. */
      department: "CUSTOMER",
      status: "ACTIVE",
      customerId: main.id,
    },
    select: { id: true, email: true },
  });

  const otherUser = await prisma.user.upsert({
    where: { email: other.email ?? `${other.code.toLowerCase()}@example.co.zm` },
    update: { passwordHash: hash, customerId: other.id, status: "ACTIVE" },
    create: {
      email: other.email ?? `${other.code.toLowerCase()}@example.co.zm`,
      name: other.name,
      passwordHash: hash,
      role: "CUSTOMER",
      department: "CUSTOMER",
      status: "ACTIVE",
      customerId: other.id,
    },
    select: { id: true, email: true },
  });

  /* ── this customer's cargo, to hang everything else off ───────────────── */
  const cargo = await prisma.shipment.findMany({
    where: { customerId: main.id, deletedAt: null },
    orderBy: { registeredAt: "asc" },
    select: {
      id: true,
      trackingNumber: true,
      status: true,
      readyForPickup: true,
      batchId: true,
      invoice: { select: { id: true, invoiceNumber: true, total: true, currency: true } },
    },
  });

  if (cargo.length === 0) {
    throw new Error(`${main.name} has no cargo. Run the demo cargo seed first.`);
  }

  const ready = cargo.find((c) => c.readyForPickup !== null) ?? cargo[0]!;
  const inZambia =
    cargo.find((c) => c.status === "RECEIVED_AT_ZAMBIA") ?? cargo[0]!;
  const unpaid = cargo.find((c) => c.invoice) ?? cargo[0]!;

  /*
    THE DEMO CUSTOMER HAS AGREED TO THE TERMS.

    Without this both demo logins meet the acceptance gate before they can see
    anything, which is correct behaviour and useless for a demonstration — the
    point of these accounts is to show the portal, not the gate. The SECOND
    account is deliberately left un-accepted so the gate can be shown too: sign
    in as Bwalya and you meet it.
  */
  await prisma.termsAcceptance.create({
    data: {
      version: TERMS_VERSION,
      /*
        "seed", not "register". This acceptance was written by a script, and
        labelling it as a registration would put a fabricated consent in the
        same bucket as real ones — which is exactly the record this table exists
        to keep honest. There is no IP and no user agent for the same reason.
      */
      source: "seed",
      customerId: main.id,
      name: main.name,
      phone: main.phone,
      email: main.email,
    },
  });
  await prisma.customer.update({
    where: { id: main.id },
    data: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
  });

  const made: string[] = [];

  /* ── 1. a pickup booking, confirmed ───────────────────────────────────── */
  const pickup = await prisma.appointment.create({
    data: {
      reference: `${PREFIX}AP-001`,
      kind: "CARGO_PICKUP",
      status: "CONFIRMED",
      customerId: main.id,
      contactName: main.name,
      contactPhone: main.phone ?? "+260977100201",
      contactEmail: main.email,
      preferredDate: daysAhead(2),
      preferredTime: "Morning, before 11:00",
      visitors: 1,
      shipmentId: ready.id,
      notes: "My driver Kelvin will collect. He has my ID copy.",
      confirmedFor: daysAhead(2),
      staffNote:
        "Confirmed for Thursday morning. Cargo is on rack B4, ready at the counter.",
      handledById: finance,
      handledAt: daysAgo(1),
    },
    select: { reference: true },
  });
  made.push(`pickup booking ${pickup.reference}`);

  /* ── 2. a China visit, still awaiting confirmation ────────────────────── */
  const visit = await prisma.appointment.create({
    data: {
      reference: `${PREFIX}AP-002`,
      kind: "MARKET_VISIT",
      status: "REQUESTED",
      customerId: main.id,
      contactName: main.name,
      contactPhone: main.phone ?? "+260977100201",
      contactEmail: main.email,
      preferredDate: daysAhead(21),
      preferredTime: "Any weekday",
      visitors: 2,
      locationName: "Baiyun leather and bags market",
      locationAddress: "Baiyun District, Guangzhou",
      productType: "Handbags and travel luggage",
      needsInterpreter: true,
      budgetUsd: money(8000),
      notes:
        "First time in Guangzhou. Two of us travelling. We would like somebody to meet us at the hotel.",
    },
    select: { reference: true },
  });
  made.push(`market visit ${visit.reference}`);

  /* ── 3. a supplier payment: request AND the transfer that followed ────── */
  const supplierRequest = await prisma.exchangeRequest.create({
    data: {
      reference: `${PREFIX}EX-001`,
      type: "SUPPLIER_PAYMENT",
      status: "COMPLETED",
      customerId: main.id,
      contactName: main.name,
      contactPhone: main.phone ?? "+260977100201",
      contactEmail: main.email,
      fromCurrency: "USD",
      toCurrency: "CNY",
      amount: money(18500),
      recipientName: "Guangzhou Yuexiu Trading Co., Ltd",
      recipientContact: "WeChat: yuexiu_sales",
      recipientDetails:
        "Bank of China · 6217 **** **** 4471 · GUANGZHOU YUEXIU TRADING CO LTD",
      purpose: "Balance on order YX-2291 — 40 cartons of assorted goods",
      notes: "This is the balance. I already paid the 30% deposit myself.",
      agreedRate: money(7.24),
      agreedAmount: money(2555.8),
      feeAmount: money(25),
      reviewedById: finance,
      reviewedAt: daysAgo(6),
      decisionNote:
        "Rate agreed with the customer on the phone. Fee is our standard USD 25 on transfers over 10,000 CNY.",
      completedAt: daysAgo(5),
      shipmentId: inZambia.id,
    },
    select: { id: true, reference: true },
  });

  await prisma.supplierPayment.create({
    data: {
      reference: `${PREFIX}SP-001`,
      requestId: supplierRequest.id,
      customerId: main.id,
      supplierName: "Guangzhou Yuexiu Trading Co., Ltd",
      supplierContact: "WeChat: yuexiu_sales",
      amount: money(18500),
      currency: "CNY",
      amountUsd: money(2555.8),
      exchangeRate: money(7.24),
      serviceFeeUsd: money(25),
      supplierReference: "YX-2291",
      paymentReference: "BOC20260821-441907",
      status: "PAID",
      notes: "Supplier confirmed receipt the same afternoon.",
      shipmentId: inZambia.id,
      handledById: finance,
      paidAt: daysAgo(5),
    },
  });
  made.push(`supplier payment ${supplierRequest.reference} (sent)`);

  /* ── 4. a currency booking mid-negotiation ────────────────────────────── */
  const exchange = await prisma.exchangeRequest.create({
    data: {
      reference: `${PREFIX}EX-002`,
      type: "MONEY_EXCHANGE",
      status: "QUOTED",
      customerId: main.id,
      contactName: main.name,
      contactPhone: main.phone ?? "+260977100201",
      contactEmail: main.email,
      fromCurrency: "ZMW",
      toCurrency: "USD",
      amount: money(55000),
      purpose: "Paying for my next order",
      preferredMethod: "Airtel Money, or I can bring cash to the office",
      notes: "Would like it done this week if the rate is reasonable.",
      agreedRate: money(27.5),
      agreedAmount: money(2000),
      reviewedById: finance,
      reviewedAt: daysAgo(1),
      decisionNote:
        "Quoted at 27.50. Rate holds until close of business tomorrow — confirm and send the kwacha to lock it.",
    },
    select: { reference: true },
  });
  made.push(`money exchange ${exchange.reference} (quoted)`);

  /* ── 5. a China service request, answered ─────────────────────────────── */
  const sourcing = await prisma.sourcingRequest.create({
    data: {
      requestNumber: `${PREFIX}SRC-001`,
      customerId: main.id,
      contactName: main.name,
      contactPhone: main.phone,
      type: "VERIFY_SUPPLIER",
      product: "Bluetooth speakers, 200 units",
      description:
        "I found this supplier on Alibaba and they want 50% up front. Can you check they are real before I send anything?\n\nSupplier: Shenzhen Aoxin Audio Co.",
      budgetUsd: money(4200),
      status: "COMPLETED",
      findings:
        "We visited the address on Monday. The company exists and has been trading since 2019 — it is a trading office, not a factory, so they buy in from a plant in Dongguan. Registration checks out. We would not send 50% up front to a trading office; 30% is normal and we can hold the balance for you until we have inspected the goods.",
      assignedToId: china,
      openedById: china,
      completedAt: daysAgo(3),
    },
    select: { requestNumber: true },
  });
  made.push(`china service ${sourcing.requestNumber} (answered)`);

  /* ── 6. an open damage claim, with a conversation on it ───────────────── */
  const claim = await prisma.shipmentException.create({
    data: {
      shipmentId: inZambia.id,
      batchId: inZambia.batchId,
      type: "DAMAGED_CARGO",
      status: "UNDER_INVESTIGATION",
      severity: "MINOR",
      description:
        "Two of the cartons were crushed on one side. The goods inside look wet. I took photos at the counter before I loaded anything.",
      raisedAt: daysAgo(4),
    },
    select: { id: true },
  });

  /*
    A timeline with BOTH kinds of entry on it, because that is what the portal's
    filtering has to be tested against. Two of these are customer-facing and one
    is the desk talking to itself — and only the two should appear in the portal.
  */
  await prisma.exceptionEvent.createMany({
    data: [
      {
        exceptionId: claim.id,
        action: "opened",
        note: "Raised by the customer through the portal.",
        customerVisible: true,
        createdAt: daysAgo(4),
      },
      {
        exceptionId: claim.id,
        action: "note.added",
        note: "Checked the loading photos from Guangzhou — cartons were sound on dispatch. Likely handling damage in transit. Do not tell the customer we suspect the airline until we have the waybill note.",
        actorId: support,
        customerVisible: false,
        createdAt: daysAgo(3),
      },
      {
        exceptionId: claim.id,
        action: "status.changed",
        note: "We have your photographs and have opened an investigation with the airline. We will come back to you within five working days.",
        actorId: support,
        customerVisible: true,
        createdAt: daysAgo(3),
      },
    ],
  });
  made.push("damage claim (open, 2 visible updates + 1 internal)");

  /* ── 7. a support thread the desk has answered ────────────────────────── */
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: `${PREFIX}TKT-001`,
      customerId: main.id,
      contactName: main.name,
      contactPhone: main.phone,
      shipmentId: unpaid.id,
      category: "SHIPMENT_INQUIRY",
      priority: "NORMAL",
      status: "WAITING_CUSTOMER",
      channel: "EMAIL",
      subject: "Can I collect on Saturday?",
      body: "Is the warehouse open on Saturday? I finish work late during the week and cannot get to Makeni before you close.",
      openedById: null,
      createdAt: daysAgo(2),
    },
    select: { id: true, ticketNumber: true },
  });

  await prisma.ticketNote.createMany({
    data: [
      {
        ticketId: ticket.id,
        body: "Yes — we are open Saturday 08:00 to 13:00. Book a pickup for Saturday morning and we will have the cargo at the counter for you.\n\nOne thing: bring your ID, or if somebody else is collecting, tell us their name first.",
        authorId: support,
        internal: false,
        createdAt: daysAgo(2),
      },
      {
        ticketId: ticket.id,
        body: "Customer has an unpaid invoice on this cargo — check before releasing.",
        authorId: support,
        internal: true,
        createdAt: daysAgo(2),
      },
    ],
  });
  made.push(`support thread ${ticket.ticketNumber} (1 reply + 1 internal note)`);

  /* ── 8. a payment proof waiting with Finance ──────────────────────────── */
  if (unpaid.invoice) {
    await prisma.paymentSubmission.create({
      data: {
        submissionNumber: `${PREFIX}SUB-001`,
        invoiceId: unpaid.invoice.id,
        amount: unpaid.invoice.total,
        currency: unpaid.invoice.currency,
        method: "BANK_TRANSFER",
        reference: "FNB-TRF-88421",
        note: "Paid this morning from my FNB account.",
        status: "PENDING",
        submittedById: mainUser.id,
        submittedAt: daysAgo(1),
      },
    });
    made.push(`payment proof on ${unpaid.invoice.invoiceNumber} (with Finance)`);
  }

  /* ── 9. the notifications all of that would have produced ─────────────── */
  await prisma.notification.createMany({
    data: [
      {
        userId: mainUser.id,
        kind: "cargo.ready",
        title: `Ready to collect — ${ready.trackingNumber}`,
        body: "Cleared and waiting at our Makeni warehouse.",
        href: `/portal/cargo/${ready.id}`,
        createdAt: daysAgo(1),
      },
      {
        userId: mainUser.id,
        kind: "appointment.updated",
        title: `Booking confirmed — ${pickup.reference}`,
        body: "Cargo is on rack B4, ready at the counter.",
        href: "/portal/appointments",
        createdAt: daysAgo(1),
      },
      {
        userId: mainUser.id,
        kind: "exchange.updated",
        title: `Money exchange ${exchange.reference} — rate offered`,
        body: "Quoted at 27.50. The rate holds until close of business tomorrow.",
        href: "/portal/exchange",
        createdAt: daysAgo(1),
      },
      {
        userId: mainUser.id,
        kind: "claim.updated",
        title: "Claim update — we have opened an investigation",
        body: "We have your photographs and are checking with the airline.",
        href: `/portal/claims/${claim.id}`,
        createdAt: daysAgo(3),
      },
      {
        userId: mainUser.id,
        kind: "support.replied",
        title: `We have replied — ${ticket.ticketNumber}`,
        body: "Can I collect on Saturday?",
        href: `/portal/support/${ticket.id}`,
        readAt: daysAgo(2),
        createdAt: daysAgo(2),
      },
      {
        userId: mainUser.id,
        kind: "china.updated",
        title: `Request ${sourcing.requestNumber} — completed`,
        body: "We visited the supplier. Read what we found.",
        href: "/portal/china",
        readAt: daysAgo(3),
        createdAt: daysAgo(3),
      },
      {
        userId: mainUser.id,
        kind: "supplierPayment.updated",
        title: `Supplier payment ${supplierRequest.reference} — paid`,
        body: "Sent to Guangzhou Yuexiu Trading Co., Ltd.",
        href: "/portal/supplier-payments",
        readAt: daysAgo(5),
        createdAt: daysAgo(5),
      },
    ],
  });
  made.push("7 notifications (4 unread)");

  /* ── report ───────────────────────────────────────────────────────────── */
  console.log(`\nPortal demo data for ${main.name} (${main.code}):\n`);
  for (const line of made) console.log(`  · ${line}`);

  console.log("\nPORTAL LOGINS");
  console.log(`  ${mainUser.email.padEnd(38)} ${PASSWORD}   ← the full account`);
  console.log(
    `  ${otherUser.email.padEnd(38)} ${PASSWORD}   ← cargo only, for testing isolation`
  );
  console.log(
    "\nSign in at /login. Both accounts are demo data and can be removed with --remove."
  );
}

/* -------------------------------------------------------------------- main */

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Target: ${host || "(DATABASE_URL not set)"}\n`);

  if (REMOVE) {
    await remove();
    return;
  }

  /*
    A re-run refreshes rather than duplicates. Removing first is safe for the
    same reason `--remove` is: everything it can reach is prefixed or owned by a
    prefixed customer.
  */
  await remove();
  await seed();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
