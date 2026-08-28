/**
 * Can anybody do business with us without agreeing to our terms?
 *
 *   npm run dev                          # in another terminal
 *   npx tsx scripts/test-terms-gate.mts
 *
 * The gate is only worth having if it cannot be walked around, and there are
 * four ways to try:
 *
 *   1. Sign in to the portal without having accepted  →  bounced, every page.
 *   2. Register without ticking the box               →  refused.
 *   3. Submit a public form without ticking the box   →  refused.
 *   4. Accept, then come back                         →  let through.
 *
 * It signs in by minting the session cookie with Auth.js's own `encode`, the
 * same way the other portal tests do. No password is typed into a page.
 *
 * IT PUTS THE DATABASE BACK. The un-accepted state it needs for (1) is created
 * by clearing a demo customer's acceptance and is restored at the end, so
 * running this does not leave a demo account stuck behind the gate.
 */
import { encode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

import { TERMS_VERSION } from "../lib/terms";

const prisma = new PrismaClient();
const BASE = process.env.PORTAL_BASE_URL ?? "http://localhost:3001";

let passed = 0;
let failed = 0;
const ok = (l: string) => { passed += 1; console.log(`  PASS  ${l}`); };
const bad = (l: string, d?: string) => {
  failed += 1;
  console.log(`  FAIL  ${l}${d ? `\n          ${d}` : ""}`);
};

async function cookieFor(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, department: true },
  });
  if (!u) throw new Error("no user");
  const name = `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}aitransit.session-token`;
  const token = await encode({
    salt: name,
    secret: process.env.AUTH_SECRET!,
    maxAge: 3600,
    token: {
      sub: u.id, id: u.id, name: u.name, email: u.email,
      role: u.role, department: u.department,
    },
  });
  return `${name}=${token}`;
}

/** Follow one hop by hand, so we can see WHERE a redirect points. */
async function hit(cookie: string, path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") ?? "" };
}

async function main() {
  console.log("\nTerms of business — the gate\n");

  const customer = await prisma.customer.findFirst({
    where: { portalUser: { isNot: null }, shipments: { some: {} } },
    orderBy: { code: "asc" },
    select: {
      id: true,
      name: true,
      termsVersion: true,
      termsAcceptedAt: true,
      portalUser: { select: { id: true, email: true } },
    },
  });
  if (!customer?.portalUser) {
    console.error("No customer has a portal login. Run the portal demo seed first.");
    process.exit(1);
  }

  const restore = {
    termsVersion: customer.termsVersion,
    termsAcceptedAt: customer.termsAcceptedAt,
  };
  const cookie = await cookieFor(customer.portalUser.id);
  console.log(`  as: ${customer.name} (${customer.portalUser.email})\n`);

  try {
    /* ── 1. not accepted: every portal page bounces ─────────────────────── */
    await prisma.customer.update({
      where: { id: customer.id },
      data: { termsVersion: null, termsAcceptedAt: null },
    });

    const guarded = [
      "/portal",
      "/portal/cargo",
      "/portal/invoices",
      "/portal/exchange",
      "/portal/supplier-payments",
      "/portal/claims/new",
      "/portal/profile",
    ];
    for (const path of guarded) {
      const { status, location } = await hit(cookie, path);
      const bounced =
        [302, 303, 307].includes(status) && location.includes("/accept-terms");
      bounced
        ? ok(`${path} — bounced to the terms gate`)
        : bad(`${path} — HTTP ${status} → ${location || "(rendered)"}`,
              status === 200 ? "A CUSTOMER WHO HAS NOT AGREED CAN USE THE PORTAL." : undefined);
    }

    /* The gate itself must render, or nobody can get past it. */
    const gate = await hit(cookie, "/accept-terms");
    gate.status === 200
      ? ok("/accept-terms — renders")
      : bad(`/accept-terms — HTTP ${gate.status} → ${gate.location}`);

    /* And the `next` it is given must not be able to point off our domain. */
    const evil = await hit(cookie, "/accept-terms?next=https://example.com/x");
    evil.status === 200
      ? ok("/accept-terms — an off-site `next` is ignored, not followed")
      : bad(`/accept-terms with a hostile next — HTTP ${evil.status} → ${evil.location}`);

    /* ── 2. accepted: let through ───────────────────────────────────────── */
    await prisma.customer.update({
      where: { id: customer.id },
      data: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
    });

    const after = await hit(cookie, "/portal");
    after.status === 200
      ? ok("/portal — accepted, and let through")
      : bad(`/portal after accepting — HTTP ${after.status} → ${after.location}`);

    /* Having accepted, the gate itself sends them on rather than asking twice. */
    const again = await hit(cookie, "/accept-terms");
    [302, 303, 307].includes(again.status) && again.location.includes("/portal")
      ? ok("/accept-terms — already accepted, sent straight on")
      : bad(`/accept-terms when already accepted — HTTP ${again.status}`);

    /* ── 3. a stale version is not an acceptance ────────────────────────── */
    await prisma.customer.update({
      where: { id: customer.id },
      data: { termsVersion: "1999-01-01" },
    });
    const stale = await hit(cookie, "/portal");
    [302, 303, 307].includes(stale.status) && stale.location.includes("/accept-terms")
      ? ok("/portal — an older version of the terms does not count as agreed")
      : bad(`/portal with a stale version — HTTP ${stale.status} → ${stale.location}`);

    /* ── 4. the forms refuse without the tick ───────────────────────────── */
    console.log("");
    const { registerCustomer } = await import("../lib/actions/portal");
    const { submitBooking, submitPickup } = await import("../lib/actions/requests");

    const reg = new FormData();
    reg.set("name", "Terms Gate Test");
    reg.set("phone", "+260970000999");
    reg.set("email", `terms-gate-${Date.now()}@example.test`);
    reg.set("password", "aitransitpass");
    reg.set("confirmPassword", "aitransitpass");
    /* acceptTerms deliberately absent — an unticked box submits nothing. */
    const regResult = await registerCustomer(undefined, reg);
    !regResult.ok && /terms/i.test(regResult.error ?? "")
      ? ok("registration — refused without the tick")
      : bad("registration went through without agreeing to the terms",
            regResult.ok ? "AN ACCOUNT WAS CREATED." : regResult.error);

    const book = new FormData();
    book.set("customerName", "Terms Gate Test");
    book.set("phone", "+260970000998");
    book.set("description", "Two cartons of samples");
    book.set("cargoCategory", "NORMAL_GOODS");
    book.set("origin", "GUANGZHOU");
    const bookResult = await submitBooking(undefined, book);
    !bookResult.ok && /terms/i.test(bookResult.error ?? "")
      ? ok("shipment booking — refused without the tick")
      : bad("a booking was accepted without agreeing to the terms", bookResult.error);

    const pick = new FormData();
    pick.set("customerName", "Terms Gate Test");
    pick.set("phone", "+260970000997");
    pick.set("address", "12 Cairo Road");
    pick.set("city", "Lusaka");
    pick.set("description", "One carton");
    const pickResult = await submitPickup(undefined, pick);
    !pickResult.ok && /terms/i.test(pickResult.error ?? "")
      ? ok("pickup request — refused without the tick")
      : bad("a pickup request was accepted without agreeing to the terms", pickResult.error);

    /* ── 5. accepting actually writes evidence ─────────────────────────── */
    console.log("");

    /*
      Registered WITH the tick, so the recorder runs for real inside the same
      transaction that creates the account — which is the thing worth testing.
      Counting rows that a seed script wrote would prove only that the seed ran.
      The throwaway account is removed at the end.
    */
    const email = `terms-gate-ok-${Date.now()}@example.test`;
    const phone = `+26097000${String(Date.now()).slice(-4)}`;
    const good = new FormData();
    good.set("name", "Terms Gate Accepted");
    good.set("phone", phone);
    good.set("email", email);
    good.set("password", "aitransitpass");
    good.set("confirmPassword", "aitransitpass");
    good.set("acceptTerms", "on");

    const goodResult = await registerCustomer(undefined, good);
    if (!goodResult.ok) {
      bad("registration with the tick was refused", goodResult.error);
    } else {
      const created = await prisma.user.findUnique({
        where: { email },
        select: { id: true, customerId: true },
      });
      const log = created?.customerId
        ? await prisma.termsAcceptance.findFirst({
            where: { customerId: created.customerId },
            select: { version: true, source: true },
          })
        : null;
      const gate = created?.customerId
        ? await prisma.customer.findUnique({
            where: { id: created.customerId },
            select: { termsVersion: true, termsAcceptedAt: true },
          })
        : null;

      log && log.version === TERMS_VERSION && log.source === "register"
        ? ok(`acceptance log — written, v${log.version} from ${log.source}`)
        : bad("registering with the tick wrote no acceptance record");

      gate?.termsVersion === TERMS_VERSION && gate.termsAcceptedAt
        ? ok("the gate on the customer was stamped at the same time")
        : bad("the customer was not stamped as having accepted");

      /* Clean up the throwaway. */
      if (created) {
        await prisma.termsAcceptance.deleteMany({
          where: { customerId: created.customerId },
        });
        await prisma.user.delete({ where: { id: created.id } });
        if (created.customerId) {
          await prisma.customer.delete({ where: { id: created.customerId } });
        }
      }
    }
  } finally {
    await prisma.customer.update({ where: { id: customer.id }, data: restore });
    console.log("\n  (database restored)");
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
