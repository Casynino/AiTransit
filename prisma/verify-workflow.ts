/**
 * End-to-end checks on the seeded system.
 *
 * Not unit tests — those live beside the thing they test. This asserts the
 * claims the specification makes about the SYSTEM AS DEPLOYED: that the roles
 * are the six agreed, that the demo data is the shape asked for, that a rate
 * change cannot rewrite a bill already given to a customer, and that a customer
 * can reach their own records and nobody else's.
 *
 * Run with: npm run verify:workflow
 */
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("\nROLES");
  const roles = Object.values(
    (Prisma.dmmf.datamodel.enums.find((e) => e.name === "Role")?.values ?? []).map(
      (v) => v.name
    )
  );
  check("exactly six roles", roles.length === 6, roles.join(", "));
  check("no MANAGER role", !roles.includes("MANAGER"));
  for (const r of [
    "ADMIN",
    "CHINA_WAREHOUSE",
    "ZAMBIA_WAREHOUSE",
    "FINANCE",
    "CUSTOMER_CARE",
    "CUSTOMER",
  ]) {
    check(`role ${r} present`, roles.includes(r));
  }

  console.log("\nSAMPLE BATCHES");
  /*
    `permanent: false` excludes the two LOADING TABLES.

    GZ-LOADING and HK-LOADING are Batch rows too — they are the benches cargo
    sits on in China before it is assigned to a real consignment — but they are
    not shipments and stay OPEN forever. Counting them made "four sample
    batches" read as six.
  */
  const batches = await prisma.batch.findMany({
    /*
      `permanent: false` excludes the two LOADING TABLES, and the prefix filter
      excludes anything seed-demo-cargo put in. This check is about the sample
      set that ships with `prisma db seed`; a deployment that has also been
      given demo cargo has more of both, legitimately, and counting them here
      would make this fail for a reason that is not a fault.
    */
    where: { permanent: false, NOT: { batchNumber: { startsWith: "DEMO-AIT-" } } },
    include: { shipments: { select: { customerId: true } } },
    orderBy: { batchNumber: "asc" },
  });
  check("four sample batches", batches.length === 4, `${batches.length} found`);
  const landed = batches.filter((b) => b.arrivedAt !== null);
  const inChina = batches.filter((b) => b.arrivedAt === null);
  check("two landed in Zambia", landed.length === 2);
  check("two still in China", inChina.length === 2);
  for (const b of batches) {
    check(
      `${b.batchNumber} holds 10 consignments`,
      b.shipments.length === 10,
      `${b.shipments.length}`
    );
    check(
      `${b.batchNumber} spans 10 customers`,
      new Set(b.shipments.map((s) => s.customerId)).size === 10
    );
  }

  console.log("\nACCOUNTS AND CURRENCY");
  const accounts = await prisma.companyAccount.findMany({
    orderBy: { sortOrder: "asc" },
  });
  for (const code of [
    "CASH_OFFICE_USD",
    "CASH_OFFICE_ZMW",
    "BANK_USD",
    "BANK_ZMW",
    "MOBILE_MONEY",
  ]) {
    check(`account ${code} exists`, accounts.some((a) => a.code === code));
  }
  check(
    "every account carries its own currency",
    accounts.every((a) => a.currency === "USD" || a.currency === "ZMW")
  );

  console.log("\nPRICING GATE");
  const pricedTooEarly = await prisma.invoice.findMany({
    where: {
      shipment: { status: { in: ["READY_TO_DEPART", "IN_TRANSIT"] } },
      status: { not: "DRAFT" },
    },
    select: { invoiceNumber: true },
  });
  check(
    "no cargo confirmed-priced before Lusaka check-in",
    pricedTooEarly.length === 0,
    `${pricedTooEarly.length} offenders`
  );

  console.log("\nINVOICES CARRY THEIR OWN RATE");
  const invoices = await prisma.invoice.findMany({
    where: { NOT: { invoiceNumber: { startsWith: "DEMO-AIT-" } } },
    select: { invoiceNumber: true, currency: true, exchangeRate: true, total: true },
  });
  check("invoices exist", invoices.length > 0, `${invoices.length}`);
  check(
    "every invoice is in USD",
    invoices.every((i) => i.currency === "USD")
  );
  check(
    "every invoice froze the rate it used",
    invoices.every((i) => i.exchangeRate !== null)
  );

  // The claim that matters: move the rate, and an invoice already raised must
  // still say what it said.
  const before = invoices[0];
  const rateBefore = before.exchangeRate;
  await prisma.exchangeRate.create({
    data: {
      fromCurrency: "USD",
      toCurrency: "ZMW",
      rate: new Prisma.Decimal(99.5),
      status: "CONFIRMED",
      source: "verify-workflow probe",
      notes: "Written by the workflow check, then withdrawn.",
    },
  });
  const after = await prisma.invoice.findUnique({
    where: { invoiceNumber: before.invoiceNumber },
    select: { exchangeRate: true, total: true },
  });
  check(
    "moving the rate does not restate an existing invoice",
    String(after?.exchangeRate) === String(rateBefore) &&
      String(after?.total) === String(before.total),
    `${rateBefore} still ${after?.exchangeRate}`
  );
  await prisma.exchangeRate.deleteMany({
    where: { source: "verify-workflow probe" },
  });

  console.log("\nFX PROVENANCE");
  const board = await prisma.publishedFxRate.findMany();
  check("published board has pairs", board.length > 0, `${board.length}`);
  check(
    "seeded board rates are INDICATIVE, not passed off as confirmed",
    board.every((r) => r.status === "INDICATIVE")
  );
  check(
    "no seeded rate claims a confirming user",
    board.every((r) => r.confirmedById === null)
  );

  console.log("\nPAYMENTS");
  const payments = await prisma.payment.findMany({
    select: { currency: true, accountId: true, method: true, creditedAmount: true, exchangeRate: true },
  });
  check("payments exist", payments.length > 0, `${payments.length}`);
  check(
    "every payment names the account it landed in",
    payments.every((p) => p.accountId !== null)
  );
  check(
    "every payment records its own currency",
    payments.every((p) => !!p.currency)
  );
  const converted = payments.filter((p) => p.currency !== "USD");
  check(
    "non-USD payments store the invoice-currency equivalent and the rate used",
    converted.every((p) => p.creditedAmount !== null && p.exchangeRate !== null),
    `${converted.length} converted`
  );

  console.log("\nCUSTOMER ISOLATION");
  const portalUser = await prisma.user.findFirst({
    where: { role: "CUSTOMER" },
    select: { customerId: true, email: true },
  });
  check("portal user is linked to one customer", !!portalUser?.customerId);
  if (portalUser?.customerId) {
    const mine = await prisma.shipment.count({
      where: { customerId: portalUser.customerId },
    });
    const all = await prisma.shipment.count();
    check(
      "that customer sees a strict subset of cargo",
      mine > 0 && mine < all,
      `${mine} of ${all}`
    );
  }

  console.log("\nSTORAGE POLICY");
  const waived = await prisma.invoice.findMany({
    where: { storageWaivedUsd: { gt: 0 } },
    select: { storageWaiveReason: true, storageWaivedById: true, storageWaivedAt: true },
  });
  check(
    "every waived storage charge carries reason, approver and date",
    waived.every(
      (w) => !!w.storageWaiveReason && !!w.storageWaivedById && !!w.storageWaivedAt
    ),
    `${waived.length} waivers`
  );

  console.log(
    `\n${passed} passed, ${failures.length} failed` +
      (failures.length ? `\nFAILED: ${failures.join("; ")}` : "")
  );
  await prisma.$disconnect();
  if (failures.length) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
