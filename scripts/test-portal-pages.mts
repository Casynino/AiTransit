/**
 * Does every portal page actually render, signed in as a real customer?
 *
 *   npm run dev                                  # in another terminal
 *   npx tsx scripts/test-portal-pages.mts
 *
 * WHAT THIS CATCHES THAT TYPESCRIPT DOES NOT. A Prisma `select` naming a column
 * that does not exist compiles cleanly when it is spread from a shared const,
 * and throws at request time — which is how the cargo list shipped asking for
 * `CargoType.nameZh`. Rendering every route against the real database is the
 * only check that finds that class of fault.
 *
 * HOW IT SIGNS IN. It mints the session cookie with Auth.js's own `encode`,
 * the same way scripts/capture-screens.mts does for staff. No password is typed
 * into a page by a script and none is stored in this file.
 *
 * IT ALSO CHECKS ISOLATION OVER HTTP. The ownership test in
 * test-portal-isolation.mts proves the data layer refuses; this proves the
 * refusal survives all the way to a status code, by fetching one customer's
 * record ids while signed in as another and requiring a 404.
 */
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

import { TERMS_VERSION } from "../lib/terms";

const prisma = new PrismaClient();
const BASE = process.env.PORTAL_BASE_URL ?? "http://localhost:3001";

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

async function sessionCookie(userId: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — cannot mint a session.");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  if (!user) throw new Error("No such user.");

  /* Auth.js salts the JWE with the cookie name, so this must match what
     auth.config.ts builds or the app treats the cookie as garbage. */
  const name = `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}aitransit.session-token`;
  const token = await encode({
    salt: name,
    secret,
    maxAge: 3600,
    token: {
      sub: user.id,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
  return `${name}=${token}`;
}

async function visit(cookie: string, path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { cookie },
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  return { status: res.status, body };
}

async function main() {
  console.log("\nPortal pages, signed in as a customer\n");

  /*
    THE BUSIEST ACCOUNT, not the first one.

    Taking the first portal customer alphabetically got one with cargo and
    nothing else, so five of the detail routes reported "no record to test
    with" and the run passed having never rendered a claim, a support thread or
    a currency booking. Ranking by how much is attached means the deep pages
    are exercised whenever any account can exercise them.
  */
  const withLogins = await prisma.customer.findMany({
    where: { portalUser: { isNot: null }, shipments: { some: {} } },
    select: {
      id: true,
      code: true,
      name: true,
      portalUser: { select: { id: true, email: true } },
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

  if (withLogins.length === 0) {
    console.error(
      "No customer has a portal login. Run `npx tsx prisma/seed-demo-portal.mts` first."
    );
    process.exit(1);
  }

  const customer = withLogins.sort(
    (x, y) =>
      Object.values(y._count).reduce((s, n) => s + n, 0) -
      Object.values(x._count).reduce((s, n) => s + n, 0)
  )[0]!;

  if (!customer.portalUser) {
    console.error("The chosen customer lost its portal login mid-run.");
    process.exit(1);
  }

  console.log(`  as: ${customer.name} (${customer.portalUser.email})\n`);
  const cookie = await sessionCookie(customer.portalUser.id);

  /*
    SATISFY THE TERMS GATE FIRST.

    Since the portal is gated on accepting the terms, a signed-in account that
    has not accepted is bounced from every page — so this test would measure the
    gate rather than what it is for. It stamps both accounts as having accepted,
    tests ownership, and puts them back exactly as it found them.

    The gate itself is tested separately, in scripts/test-terms-gate.mts.
  */
  const before = await prisma.customer.findMany({
    where: { portalUser: { isNot: null } },
    select: { id: true, termsVersion: true, termsAcceptedAt: true },
  });
  const restoreTerms = async () => {
    for (const row of before) {
      await prisma.customer.update({
        where: { id: row.id },
        data: {
          termsVersion: row.termsVersion,
          termsAcceptedAt: row.termsAcceptedAt,
        },
      });
    }
  };
  await prisma.customer.updateMany({
    where: { id: { in: before.map((r) => r.id) } },
    data: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
  });

  /* ── one real id per detail route, so the deep pages are exercised ─────── */
  const [cargo, invoice, note, claim, ticket, exchange, sourcing] =
    await Promise.all([
      prisma.shipment.findFirst({
        where: { customerId: customer.id, deletedAt: null },
        select: { id: true },
      }),
      prisma.invoice.findFirst({
        where: { customerId: customer.id, status: { not: "DRAFT" } },
        select: { id: true },
      }),
      prisma.pickupNote.findFirst({
        where: { customerId: customer.id },
        select: { id: true },
      }),
      prisma.shipmentException.findFirst({
        where: { shipment: { customerId: customer.id } },
        select: { id: true },
      }),
      prisma.supportTicket.findFirst({
        where: { customerId: customer.id },
        select: { id: true },
      }),
      prisma.exchangeRequest.findFirst({
        where: { customerId: customer.id },
        select: { id: true },
      }),
      prisma.sourcingRequest.findFirst({
        where: { customerId: customer.id },
        select: { id: true },
      }),
    ]);

  const routes: [string, string | null][] = [
    ["/portal", "/portal"],
    ["/portal/cargo", "/portal/cargo"],
    ["/portal/cargo (filtered)", "/portal/cargo?status=IN_TRANSIT&q=AT"],
    ["/portal/cargo/[id]", cargo ? `/portal/cargo/${cargo.id}` : null],
    ["/portal/track", "/portal/track"],
    ["/portal/invoices", "/portal/invoices"],
    ["/portal/invoices/[id]", invoice ? `/portal/invoices/${invoice.id}` : null],
    ["/portal/pickup-notes", "/portal/pickup-notes"],
    ["/portal/pickup-notes/[id]", note ? `/portal/pickup-notes/${note.id}` : null],
    ["/portal/appointments", "/portal/appointments"],
    ["/portal/china", "/portal/china"],
    ["/portal/china/[id]", sourcing ? `/portal/china/${sourcing.id}` : null],
    ["/portal/visits", "/portal/visits"],
    ["/portal/supplier-payments", "/portal/supplier-payments"],
    ["/portal/exchange", "/portal/exchange"],
    ["/portal/exchange/[id]", exchange ? `/portal/exchange/${exchange.id}` : null],
    ["/portal/claims", "/portal/claims"],
    ["/portal/claims/new", "/portal/claims/new"],
    ["/portal/claims/[id]", claim ? `/portal/claims/${claim.id}` : null],
    ["/portal/support", "/portal/support"],
    ["/portal/support/[id]", ticket ? `/portal/support/${ticket.id}` : null],
    ["/portal/notifications", "/portal/notifications"],
    ["/portal/profile", "/portal/profile"],
  ];

  for (const [label, path] of routes) {
    if (!path) {
      console.log(`  ----  ${label} (no record to test with)`);
      continue;
    }
    try {
      const { status, body } = await visit(cookie, path);
      if (status !== 200) {
        bad(`${label} — HTTP ${status}`);
        continue;
      }
      /*
        A 200 is not enough. Next renders its error boundary with a 200 in
        development, so a page that threw looks fine to a status check.
      */
      if (/Application error|Unhandled Runtime Error|__NEXT_ERROR/i.test(body)) {
        bad(`${label} — rendered an error page`);
        continue;
      }
      ok(`${label} — 200`);
    } catch (error) {
      bad(`${label} — ${(error as Error).message}`);
    }
  }

  /* ── the PDF, which is a route handler rather than a page ─────────────── */
  if (invoice) {
    const res = await fetch(`${BASE}/portal/invoices/${invoice.id}/pdf`, {
      headers: { cookie },
    });
    const type = res.headers.get("content-type") ?? "";
    res.status === 200 && type.includes("pdf")
      ? ok("/portal/invoices/[id]/pdf — 200, application/pdf")
      : bad(`invoice PDF — HTTP ${res.status}, ${type}`);
  }

  /* ── isolation, over HTTP ─────────────────────────────────────────────── */
  console.log("");

  const stranger = await prisma.customer.findFirst({
    where: { id: { not: customer.id }, portalUser: { isNot: null } },
    select: { portalUser: { select: { id: true, email: true } }, name: true },
  });

  if (stranger?.portalUser) {
    const strangerCookie = await sessionCookie(stranger.portalUser.id);
    console.log(`  now as: ${stranger.name} (${stranger.portalUser.email})\n`);

    const forbidden: [string, string | null][] = [
      ["cargo", cargo ? `/portal/cargo/${cargo.id}` : null],
      ["invoice", invoice ? `/portal/invoices/${invoice.id}` : null],
      ["invoice PDF", invoice ? `/portal/invoices/${invoice.id}/pdf` : null],
      ["pickup note", note ? `/portal/pickup-notes/${note.id}` : null],
      ["claim", claim ? `/portal/claims/${claim.id}` : null],
      ["support thread", ticket ? `/portal/support/${ticket.id}` : null],
      ["money request", exchange ? `/portal/exchange/${exchange.id}` : null],
      ["china request", sourcing ? `/portal/china/${sourcing.id}` : null],
    ];

    for (const [label, path] of forbidden) {
      if (!path) continue;
      const res = await fetch(`${BASE}${path}`, {
        headers: { cookie: strangerCookie },
        redirect: "manual",
      });
      res.status === 404
        ? ok(`another customer's ${label} — 404`)
        : bad(
            `another customer's ${label} — HTTP ${res.status}`,
            res.status === 200 ? "THIS IS A DATA LEAK." : undefined
          );
    }
  }

  /* ── the other half: does the DESK see what the customer sent? ────────── */
  console.log("");

  /*
    A portal that files requests nobody opens is worse than no portal. Each
    check below signs in as the staff account that owns that queue and looks for
    the demo reference on the page they actually work from.
  */
  const staffChecks: [string, string, string, string | null][] = [];

  const demoAppt = await prisma.appointment.findFirst({
    where: { reference: { startsWith: "DEMO-AIT-" } },
    select: { reference: true },
  });
  const demoExchange = await prisma.exchangeRequest.findFirst({
    where: { reference: { startsWith: "DEMO-AIT-" }, type: { not: "SUPPLIER_PAYMENT" } },
    select: { reference: true },
  });
  const demoSupplier = await prisma.supplierPayment.findFirst({
    where: { reference: { startsWith: "DEMO-AIT-" } },
    select: { reference: true },
  });
  const demoTicket = await prisma.supportTicket.findFirst({
    where: { ticketNumber: { startsWith: "DEMO-AIT-" } },
    select: { ticketNumber: true },
  });
  const demoSourcing = await prisma.sourcingRequest.findFirst({
    where: { requestNumber: { startsWith: "DEMO-AIT-" } },
    select: { requestNumber: true },
  });
  const demoSubmission = await prisma.paymentSubmission.findFirst({
    where: { submissionNumber: { startsWith: "DEMO-AIT-" } },
    select: { submissionNumber: true },
  });

  staffChecks.push(
    ["support@aitransit.co.zm", "/app/appointments", "bookings queue", demoAppt?.reference ?? null],
    ["finance@aitransit.co.zm", "/app/finance/exchange", "money desk", demoExchange?.reference ?? null],
    ["finance@aitransit.co.zm", "/app/finance/supplier-payments", "supplier payments", demoSupplier?.reference ?? null],
    /*
      `view=all` on the ticket inbox, deliberately. The demo thread sits in
      WAITING_CUSTOMER, which the default tab correctly excludes — the desk's
      landing tab is what it has not answered yet. Asking for the default tab
      here would fail the test for the app behaving properly.
    */
    ["support@aitransit.co.zm", "/app/support/tickets?view=all", "support inbox", demoTicket?.ticketNumber ?? null],
    ["support@aitransit.co.zm", "/app/support/sourcing", "china requests", demoSourcing?.requestNumber ?? null],
    ["support@aitransit.co.zm", "/app/exceptions", "investigation queue", "DEMO"],
    /*
      /app/collections/submissions is the READ-ONLY copy, and it redirects
      anybody who can actually verify to /app/collections/verify — the same rows
      with the buttons on. Finance can verify, so the queue Finance works is the
      one to check.
    */
    ["finance@aitransit.co.zm", "/app/collections/verify", "payment proofs", demoSubmission?.submissionNumber ?? null]
  );

  for (const [email, path, label, needle] of staffChecks) {
    if (!needle) {
      console.log(`  ----  ${label} (nothing demo-tagged to look for)`);
      continue;
    }
    const staff = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!staff) {
      console.log(`  ----  ${label} (no ${email})`);
      continue;
    }
    const staffCookie = await sessionCookie(staff.id);
    const res = await fetch(`${BASE}${path}`, {
      headers: { cookie: staffCookie },
      redirect: "manual",
    });
    if (res.status !== 200) {
      bad(`${label} — HTTP ${res.status} for staff`);
      continue;
    }
    const body = await res.text();
    body.includes(needle)
      ? ok(`${label} — the desk can see it (${needle})`)
      : bad(`${label} — ${needle} is not on the page the desk works from`);
  }

  /* ── and a signed-out visitor gets nothing ────────────────────────────── */
  console.log("");
  const anon = await fetch(`${BASE}/portal`, { redirect: "manual" });
  [302, 303, 307].includes(anon.status)
    ? ok(`signed out — /portal redirects (${anon.status})`)
    : bad(`signed out — /portal returned ${anon.status}, expected a redirect`);

  await restoreTerms();

  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
