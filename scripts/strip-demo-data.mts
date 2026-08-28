/**
 * Turn a demo install into a live one.
 *
 * Removes every OPERATIONAL row — customers, cargo, packages, invoices,
 * payments, ledger lines, pickup notes, deliveries, cases and the audit trail
 * they generated — and leaves the INFRASTRUCTURE the deployment needs to work:
 * cargo categories, pricing rules, company accounts, the FX board and rate
 * history, staff logins, company settings, the two China loading tables and the
 * market directory.
 *
 * WHY THIS EXISTS. `prisma db seed` reads `.env`, and a developer `.env` has
 * SEED_DEMO_DATA=true in it. Seeding a production database from a machine set
 * up for local work therefore plants forty invented consignments and ten
 * invented customers into a live system, whatever the shell says — which is
 * exactly what happened to the first AITRANSIT deploy. Invented cargo is not a
 * cosmetic problem: it enters the batch manifests, the revenue figures and the
 * credit book.
 *
 * This is destructive and refuses to run without --confirm.
 *
 *   npx tsx scripts/strip-demo-data.mts --confirm
 *
 * It is safe to run on a database that has already been stripped.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

if (!process.argv.includes("--confirm")) {
  console.error(
    "Refusing to run without --confirm.\n\n" +
      "This deletes ALL customers, cargo, invoices, payments and ledger entries\n" +
      "from the database in DATABASE_URL. Infrastructure (categories, prices,\n" +
      "accounts, FX board, staff, settings, markets) is kept.\n\n" +
      "  npx tsx scripts/strip-demo-data.mts --confirm"
  );
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "");
  console.log(`Target: ${host || "(DATABASE_URL not set)"}\n`);

  const removed: [string, number][] = [];
  const drop = async (label: string, fn: () => Promise<{ count: number }>) => {
    const { count } = await fn();
    if (count) removed.push([label, count]);
  };

  /*
    Child to parent. Several relations are deliberately onDelete: Restrict —
    a ledger line pins its payment, because money that moved must not vanish as
    a side effect of deleting something else — so the order is not optional.
  */
  await drop("delivery records", () => prisma.deliveryRecord.deleteMany({}));
  await drop("receipts", () => prisma.receipt.deleteMany({}));
  await drop("payment proofs", () => prisma.paymentProof.deleteMany({}));
  await drop("payment submissions", () => prisma.paymentSubmission.deleteMany({}));
  await drop("ledger entries", () => prisma.ledgerEntry.deleteMany({}));
  await drop("account transfers", () => prisma.accountTransfer.deleteMany({}));
  await drop("cash counts", () => prisma.cashCount.deleteMany({}));
  await drop("expense receipts", () => prisma.expenseReceipt.deleteMany({}));
  await drop("expenses", () => prisma.expense.deleteMany({}));
  await drop("payments", () => prisma.payment.deleteMany({}));
  await drop("pickup notes", () => prisma.pickupNote.deleteMany({}));
  await drop("invoices", () => prisma.invoice.deleteMany({}));
  await drop("compensations", () => prisma.compensation.deleteMany({}));
  await drop("exception events", () => prisma.exceptionEvent.deleteMany({}));
  await drop("exceptions", () => prisma.shipmentException.deleteMany({}));
  await drop("cargo photos", () => prisma.shipmentPhoto.deleteMany({}));
  await drop("cargo documents", () => prisma.shipmentDocument.deleteMany({}));
  await drop("status history", () => prisma.shipmentStatusHistory.deleteMany({}));
  await drop("field changes", () => prisma.fieldChange.deleteMany({}));
  await drop("packages", () => prisma.package.deleteMany({}));
  await drop("shipments", () => prisma.shipment.deleteMany({}));
  await drop("batch verifications", () => prisma.batchVerification.deleteMany({}));
  await drop("batch statements", () => prisma.batchStatement.deleteMany({}));
  await drop("record reviews", () => prisma.recordReview.deleteMany({}));
  await drop("reconciliations", () => prisma.accountReconciliation.deleteMany({}));
  // Loading tables are permanent infrastructure, not sample dispatches.
  await drop("batches", () => prisma.batch.deleteMany({ where: { permanent: false } }));
  await drop("ticket notes", () => prisma.ticketNote.deleteMany({}));
  await drop("support tickets", () => prisma.supportTicket.deleteMany({}));
  await drop("sourcing requests", () => prisma.sourcingRequest.deleteMany({}));
  await drop("booking requests", () => prisma.bookingRequest.deleteMany({}));
  await drop("pickup requests", () => prisma.pickupRequest.deleteMany({}));
  await drop("appointments", () => prisma.appointment.deleteMany({}));
  await drop("exchange requests", () => prisma.exchangeRequest.deleteMany({}));
  await drop("supplier payments", () => prisma.supplierPayment.deleteMany({}));
  await drop("customer messages", () => prisma.customerMessage.deleteMany({}));
  await drop("notifications", () => prisma.notification.deleteMany({}));
  await drop("portal logins", () => prisma.user.deleteMany({ where: { role: "CUSTOMER" } }));
  await drop("customers", () => prisma.customer.deleteMany({}));
  await drop("audit log", () => prisma.auditLog.deleteMany({}));
  await drop("login events", () => prisma.loginEvent.deleteMany({}));
  // Reference counters, so the first real consignment is AT-000001.
  await drop("id counters", () => prisma.counter.deleteMany({}));

  if (removed.length === 0) {
    console.log("Nothing to remove — already a clean install.\n");
  } else {
    console.log("REMOVED");
    for (const [label, n] of removed) console.log(`  ${String(n).padStart(6)}  ${label}`);
  }

  const kept = {
    "cargo categories": await prisma.cargoType.count(),
    "pricing rules": await prisma.pricingRule.count(),
    "company accounts": await prisma.companyAccount.count(),
    "FX board pairs": await prisma.publishedFxRate.count(),
    "settlement rates": await prisma.exchangeRate.count(),
    "staff logins": await prisma.user.count(),
    "loading tables": await prisma.batch.count({ where: { permanent: true } }),
    "china markets": await prisma.chinaMarket.count(),
    "company settings": await prisma.companySetting.count(),
  };
  console.log("\nKEPT");
  for (const [label, n] of Object.entries(kept)) {
    console.log(`  ${String(n).padStart(6)}  ${label}`);
  }

  const leftover = {
    customers: await prisma.customer.count(),
    shipments: await prisma.shipment.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
  };
  console.log("\nOPERATIONAL DATA REMAINING");
  for (const [label, n] of Object.entries(leftover)) {
    console.log(`  ${String(n).padStart(6)}  ${label}`);
  }
  const total = Object.values(leftover).reduce((a, b) => a + b, 0);
  console.log(
    total === 0
      ? "\nClean. Ready for real operations."
      : `\nWARNING: ${total} operational row(s) still present.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
