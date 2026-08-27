/**
 * Seed.
 *
 * Creates the CEO account plus one member of each department, and a set of
 * shipments spread across every stage of the workflow so each dashboard has
 * something real to show on first run.
 *
 * Safe to re-run: users and settings are upserted, and demo cargo is only
 * created when the database has none.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

/* From lib/account-seed.ts, not lib/accounts.ts: the latter is `server-only`
   and throws when a plain Node script imports it. */
import { ACCOUNT_SEED } from "../lib/account-seed";

const prisma = new PrismaClient();

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const qrToken = () => `ATQ${randomBytes(20).toString("base64url")}`;

async function seq(key: string) {
  const counter = await prisma.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

const pad = (n: number, w = 6) => String(n).padStart(w, "0");

async function main() {
  const year = new Date().getFullYear();

  // ---------------------------------------------------------------- settings
  await prisma.setting.upsert({
    where: { key: "pricing.defaultRatePerKg" },
    create: { key: "pricing.defaultRatePerKg", value: "365" },
    update: {},
  });

  // --------------------------------------------------------------- rate card
  // PLACEHOLDER rates so the public calculator has something to compute with.
  // Every row is flagged isPlaceholder, which makes the website label the
  // result "indicative" until the CEO replaces these with agreed numbers.
  const placeholderRates: {
    goodsType: Prisma.RateCardUncheckedCreateInput["goodsType"];
    method: "AIR_NORMAL" | "AIR_EXPRESS";
    pricePerKg: number;
    transitDays: number;
    minimumCharge: number;
  }[] = [
    /* Kwacha, at roughly 27 to the dollar. Target Express quoted these in
       shillings at ~2,700 — carrying those figures over would have priced a
       kilo of cargo at about USD 480. */
    { goodsType: null, method: "AIR_NORMAL", pricePerKg: 365, transitDays: 7, minimumCharge: 365 },
    { goodsType: "ELECTRONICS", method: "AIR_NORMAL", pricePerKg: 440, transitDays: 7, minimumCharge: 440 },
    { goodsType: "PHONE_ACCESSORIES", method: "AIR_NORMAL", pricePerKg: 440, transitDays: 7, minimumCharge: 440 },
    { goodsType: "COSMETICS", method: "AIR_NORMAL", pricePerKg: 440, transitDays: 8, minimumCharge: 440 },
    { goodsType: "TEXTILES_GARMENTS", method: "AIR_NORMAL", pricePerKg: 365, transitDays: 7, minimumCharge: 365 },
    { goodsType: "FOOTWEAR", method: "AIR_NORMAL", pricePerKg: 365, transitDays: 7, minimumCharge: 365 },
    // Express costs more per kilo and skips the wait for a batch to fill.
    { goodsType: null, method: "AIR_EXPRESS", pricePerKg: 520, transitDays: 5, minimumCharge: 520 },
  ];

  for (const origin of ["GUANGZHOU", "HONG_KONG"] as const) {
    for (const rate of placeholderRates) {
      // findFirst rather than upsert: Prisma cannot target a null inside a
      // compound unique selector, and goodsType is intentionally nullable.
      const existing = await prisma.rateCard.findFirst({
        where: { origin, goodsType: rate.goodsType, method: rate.method },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.rateCard.create({
        data: {
          origin,
          goodsType: rate.goodsType,
          method: rate.method,
          pricePerKg: new Prisma.Decimal(rate.pricePerKg),
          minimumKg: new Prisma.Decimal(1),
          minimumCharge: new Prisma.Decimal(rate.minimumCharge),
          transitDays: rate.transitDays,
          isPlaceholder: true,
          notes: "Placeholder rate — replace with the figure the company agreed.",
        },
      });
    }
  }

  console.log("Rate card seeded with placeholder air rates.");

  // ------------------------------------------------------- company accounts
  /*
    The accounts the business reconciles against. Seeded HERE rather than only
    in scripts/seed-accounts.mts, because without them Finance cannot record a
    single payment — every money action in this system demands an account, by
    design — and a fresh database that cannot take money is not a working
    install. That script still exists for the backfill half of its job.

    Account numbers are deliberately null. See the note on ACCOUNT_SEED.
  */
  for (const account of ACCOUNT_SEED) {
    await prisma.companyAccount.upsert({
      where: { code: account.code },
      create: account,
      // Never touches `currency`: restating the unit of an account would
      // restate every historical balance on it.
      update: {
        name: account.name,
        kind: account.kind,
        institution: account.institution,
        accountName: account.accountName,
        sortOrder: account.sortOrder,
      },
    });
  }
  console.log(`Company accounts: ${ACCOUNT_SEED.length} ready.`);

  // ------------------------------------------------------ published FX board
  /*
    Indicative opening rates for the public exchange page, so the money desk
    has something to correct rather than an empty screen to build from.

    Marked in the note as indicative because they are — these are not rates
    AITRANSIT has agreed to trade at, and the page says so beside them. Admin
    publishes the real board every morning under Finance → Exchange board.
  */
  const fxSeed = [
    { base: "USD", quote: "ZMW", buy: 26.5, sell: 27.5, order: 10 },
    { base: "CNY", quote: "ZMW", buy: 3.55, sell: 3.85, order: 20 },
    { base: "ZAR", quote: "ZMW", buy: 1.35, sell: 1.55, order: 30 },
    { base: "USD", quote: "CNY", buy: 6.95, sell: 7.35, order: 40 },
  ];
  for (const rate of fxSeed) {
    await prisma.publishedFxRate.upsert({
      where: {
        baseCurrency_quoteCurrency: {
          baseCurrency: rate.base,
          quoteCurrency: rate.quote,
        },
      },
      create: {
        baseCurrency: rate.base,
        quoteCurrency: rate.quote,
        buyRate: new Prisma.Decimal(rate.buy),
        sellRate: new Prisma.Decimal(rate.sell),
        sortOrder: rate.order,
        note: "Indicative — confirm with the finance desk.",
      },
      update: {},
    });
  }
  console.log(`Exchange board: ${fxSeed.length} indicative pairs published.`);

  // ------------------------------------------------------------------- staff
  const adminEmail = (
    process.env.SEED_ADMIN_EMAIL ?? "ceo@aitransit.co.zm"
  ).toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is not set. Add it to .env before seeding."
    );
  }

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  const ceo = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "Managing Director",
      email: adminEmail,
      passwordHash: await hash(adminPassword),
      role: "ADMIN",
      department: "MANAGEMENT",
    },
    update: {},
  });

  const staffSpec = [
    {
      name: "Guangzhou Desk",
      email: "china@aitransit.co.zm",
      role: "CHINA_WAREHOUSE" as const,
      department: "CHINA_WAREHOUSE" as const,
    },
    {
      name: "Lusaka Warehouse",
      email: "warehouse@aitransit.co.zm",
      role: "ZAMBIA_WAREHOUSE" as const,
      department: "ZAMBIA_WAREHOUSE" as const,
    },
    {
      name: "Finance Office",
      email: "finance@aitransit.co.zm",
      role: "FINANCE" as const,
      department: "FINANCE" as const,
    },
    {
      name: "Customer Support",
      email: "support@aitransit.co.zm",
      role: "CUSTOMER_CARE" as const,
      department: "CUSTOMER_CARE" as const,
    },
  ];

  const staff: Record<string, string> = {};
  for (const spec of staffSpec) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      create: {
        name: spec.name,
        email: spec.email,
        passwordHash: await hash(adminPassword),
        role: spec.role,
        department: spec.department,
        createdById: ceo.id,
      },
      update: {},
    });
    staff[spec.role] = user.id;
  }

  const china = staff.CHINA_WAREHOUSE;
  const zambia = staff.ZAMBIA_WAREHOUSE;
  const finance = staff.FINANCE;

  console.log(`Staff ready: ${adminEmail} + ${staffSpec.length} department accounts`);

  // Demo cargo only on a fresh database — never on top of real operations.
  const existing = await prisma.shipment.count();
  if (existing > 0) {
    console.log(`Skipping demo cargo — ${existing} shipment(s) already exist.`);
    return;
  }

  // --------------------------------------------------------------- customers
  const customerSpec = [
    { name: "Makeni Traders Ltd", phone: "+260977111222", city: "Lusaka" },
    { name: "Kitwe Phone Hub", phone: "+260966444555", city: "Kitwe" },
    { name: "Ndola Fashion House", phone: "+260955777888", city: "Ndola" },
    { name: "Chipata General Supplies", phone: "+260977999000", city: "Chipata" },
    { name: "Livingstone Beauty Store", phone: "+260966222333", city: "Livingstone" },
  ];

  const customers = [];
  for (const spec of customerSpec) {
    customers.push(
      await prisma.customer.create({
        data: {
          code: `CUS-${pad(await seq("customer"))}`,
          name: spec.name,
          phone: spec.phone,
          city: spec.city,
          createdById: china,
        },
      })
    );
  }

  /*
    A demo customer PORTAL account, on the first seeded customer.

    Registration normally creates the Customer and the User together, but a
    fresh install has customers created at the Guangzhou counter and no way to
    sign in as one — so there is nothing to test the portal against without
    filling in the public form first. This wires one of them up.

    Same password as the staff accounts, from SEED_ADMIN_PASSWORD, and the same
    instruction applies: change it. The role is written literally, exactly as it
    is in registerCustomer — a customer account must never be able to become
    anything else by accident.
  */
  const portalCustomer = customers[0];
  await prisma.user.upsert({
    where: { email: "customer@example.com" },
    create: {
      name: portalCustomer.name,
      email: "customer@example.com",
      phone: portalCustomer.phone,
      passwordHash: await hash(adminPassword),
      role: "CUSTOMER",
      department: "CUSTOMER",
      customerId: portalCustomer.id,
    },
    update: {},
  });
  console.log(
    `Demo portal login: customer@example.com → ${portalCustomer.name} (${portalCustomer.code})`
  );

  // ----------------------------------------------------------------- batches
  // batchNumber is minted here, so callers must not supply one.
  const mkBatch = async (
    data: Omit<Prisma.BatchUncheckedCreateInput, "batchNumber">
  ) =>
    prisma.batch.create({
      data: {
        ...data,
        batchNumber: `BATCH-${year}-${pad(await seq(`batch:${year}`), 3)}`,
      },
    });

  const closedBatch = await mkBatch({
    origin: "GUANGZHOU",
    status: "VERIFIED",
    airline: "Ethiopian Airlines",
    flightNumber: "ET 8611",
    waybillNumber: "071-45889231",
    departureDate: daysAgo(21),
    departedAt: daysAgo(21),
    arrivalDate: daysAgo(18),
    arrivedAt: daysAgo(18),
    verifiedAt: daysAgo(18),
    createdById: china,
    createdAt: daysAgo(26),
  });

  const arrivedBatch = await mkBatch({
    origin: "GUANGZHOU",
    status: "ARRIVED",
    airline: "Emirates SkyCargo",
    flightNumber: "EK 9821",
    waybillNumber: "176-33920114",
    departureDate: daysAgo(4),
    departedAt: daysAgo(4),
    arrivalDate: daysAgo(1),
    arrivedAt: daysAgo(1),
    createdById: china,
    createdAt: daysAgo(9),
  });

  const transitBatch = await mkBatch({
    origin: "HONG_KONG",
    status: "IN_TRANSIT",
    airline: "Qatar Airways Cargo",
    flightNumber: "QR 8142",
    waybillNumber: "157-88213076",
    departureDate: daysAgo(1),
    departedAt: daysAgo(1),
    createdById: china,
    createdAt: daysAgo(6),
  });

  const openBatch = await mkBatch({
    origin: "GUANGZHOU",
    status: "OPEN",
    notes: "Targeting the Thursday freighter.",
    createdById: china,
    createdAt: daysAgo(2),
  });

  // ---------------------------------------------------------------- shipments
  type Spec = {
    customer: number;
    goodsType: Prisma.ShipmentUncheckedCreateInput["goodsType"];
    description: string;
    packages: number;
    weightKg: number;
    batchId: string | null;
    status: Prisma.ShipmentUncheckedCreateInput["status"];
    origin: "GUANGZHOU" | "HONG_KONG";
    registeredDaysAgo: number;
  };

  /*
    Demo invoices are priced with AITRANSIT's real published rate.

    This was `13000` — a per-kilo figure in Tanzanian SHILLINGS, written onto an
    invoice whose currency column says USD. Nobody noticed because the money was
    fake, but the numbers it produced were not harmless: a 15 kg consignment came
    out at USD 195,000, the owner's dashboard opened on eight-figure revenue, and
    every chart, ageing bucket and profit figure on a fresh install was nonsense.
    A seed exists so the screens can be read on day one, and figures nobody can
    believe defeat the point of it.

    Tiered the same way the rate book is — the cheaper rate from 10 kg — so the
    demo data agrees with what the calculator and the invoice would charge.
  */
  const rateFor = (weightKg: number) => (weightKg >= 10 ? 13 : 13.5);

  const specs: Spec[] = [
    // Completed journey
    {
      customer: 0,
      goodsType: "GENERAL_MERCHANDISE",
      description: "Assorted general goods",
      packages: 6,
      weightKg: 148.5,
      batchId: closedBatch.id,
      status: "DELIVERED",
      origin: "GUANGZHOU",
      registeredDaysAgo: 26,
    },
    {
      customer: 1,
      goodsType: "PHONE_ACCESSORIES",
      description: "Mobile phone accessories",
      packages: 3,
      weightKg: 62.25,
      batchId: closedBatch.id,
      status: "DELIVERED",
      origin: "GUANGZHOU",
      registeredDaysAgo: 25,
    },
    // Arrived, checked in, paid — waiting at the counter
    {
      customer: 2,
      goodsType: "TEXTILES_GARMENTS",
      description: "Ladies' clothing",
      packages: 8,
      weightKg: 211,
      batchId: arrivedBatch.id,
      status: "READY_FOR_PICKUP",
      origin: "GUANGZHOU",
      registeredDaysAgo: 9,
    },
    // Arrived, checked in, unpaid — the chase list
    {
      customer: 3,
      goodsType: "MACHINERY_PARTS",
      description: "Water pump spare parts",
      packages: 2,
      weightKg: 94.8,
      batchId: arrivedBatch.id,
      status: "RECEIVED_AT_ZAMBIA",
      origin: "GUANGZHOU",
      registeredDaysAgo: 8,
    },
    // Arrived but not yet checked in (the Lusaka to-do list)
    {
      customer: 4,
      goodsType: "COSMETICS",
      description: "Human hair & beauty products",
      packages: 5,
      weightKg: 77.4,
      batchId: arrivedBatch.id,
      status: "IN_TRANSIT",
      origin: "GUANGZHOU",
      registeredDaysAgo: 8,
    },
    // In the air
    {
      customer: 0,
      goodsType: "FOOTWEAR",
      description: "Shoes / sneakers",
      packages: 12,
      weightKg: 305.2,
      batchId: transitBatch.id,
      status: "IN_TRANSIT",
      origin: "HONG_KONG",
      registeredDaysAgo: 6,
    },
    {
      customer: 1,
      goodsType: "ELECTRONICS",
      description: "LED lighting",
      packages: 4,
      weightKg: 118,
      batchId: transitBatch.id,
      status: "IN_TRANSIT",
      origin: "HONG_KONG",
      registeredDaysAgo: 5,
    },
    // Sitting in China
    {
      customer: 2,
      goodsType: "STATIONERY",
      description: "Office stationery",
      packages: 3,
      weightKg: 41.6,
      batchId: openBatch.id,
      status: "READY_TO_DEPART",
      origin: "GUANGZHOU",
      registeredDaysAgo: 2,
    },
    {
      customer: 3,
      goodsType: "AUTO_SPARES",
      description: "Motorcycle spare parts",
      packages: 7,
      weightKg: 189.35,
      batchId: openBatch.id,
      status: "READY_TO_DEPART",
      origin: "GUANGZHOU",
      registeredDaysAgo: 1,
    },
    {
      customer: 4,
      goodsType: "FURNITURE_FITTINGS",
      description: "Kitchen fittings",
      packages: 2,
      weightKg: 66,
      batchId: null,
      status: "READY_TO_DEPART",
      origin: "GUANGZHOU",
      registeredDaysAgo: 0,
    },
  ];

  const created: { id: string; trackingNumber: string; spec: Spec }[] = [];

  for (const spec of specs) {
    const registeredAt = daysAgo(spec.registeredDaysAgo);
    const batch =
      spec.batchId === closedBatch.id
        ? closedBatch
        : spec.batchId === arrivedBatch.id
          ? arrivedBatch
          : spec.batchId === transitBatch.id
            ? transitBatch
            : null;

    const departedAt =
      spec.status === "READY_TO_DEPART" ? null : (batch?.departedAt ?? null);
    const arrivedAt =
      spec.status === "RECEIVED_AT_ZAMBIA" ||
      spec.status === "READY_FOR_PICKUP" ||
      spec.status === "DELIVERED"
        ? (batch?.arrivedAt ?? null)
        : null;
    const readyForPickup =
      spec.status === "READY_FOR_PICKUP" || spec.status === "DELIVERED"
        ? daysAgo(spec.status === "DELIVERED" ? 17 : 1)
        : null;
    const deliveredAt = spec.status === "DELIVERED" ? daysAgo(16) : null;

    const shipment = await prisma.shipment.create({
      data: {
        trackingNumber: `AT-${pad(await seq("shipment"))}`,
        qrToken: qrToken(),
        customerId: customers[spec.customer].id,
        goodsType: spec.goodsType,
        description: spec.description,
        packages: spec.packages,
        weightKg: new Prisma.Decimal(spec.weightKg),
        origin: spec.origin,
        unitRate: new Prisma.Decimal(rateFor(spec.weightKg)),
        batchId: spec.batchId,
        status: spec.status,
        registeredAt,
        departedAt,
        arrivedAt,
        readyForPickup,
        deliveredAt,
        createdById: china,
        createdAt: registeredAt,
      },
    });

    // Status history mirrors the stamps above, in order.
    const history: Prisma.ShipmentStatusHistoryUncheckedCreateInput[] = [
      {
        shipmentId: shipment.id,
        toStatus: "READY_TO_DEPART",
        location: spec.origin === "GUANGZHOU" ? "Guangzhou, China" : "Hong Kong",
        note: "Cargo received and registered at the China warehouse.",
        actorId: china,
        createdAt: registeredAt,
      },
    ];
    if (departedAt) {
      history.push({
        shipmentId: shipment.id,
        fromStatus: "READY_TO_DEPART",
        toStatus: "IN_TRANSIT",
        location: "China → Zambia",
        note: `Departed on ${batch?.airline} ${batch?.flightNumber} (waybill ${batch?.waybillNumber}).`,
        actorId: china,
        createdAt: departedAt,
      });
    }
    if (arrivedAt) {
      history.push({
        shipmentId: shipment.id,
        fromStatus: "IN_TRANSIT",
        toStatus: "RECEIVED_AT_ZAMBIA",
        location: "Lusaka warehouse",
        note: "Checked in against the batch manifest.",
        actorId: zambia,
        createdAt: arrivedAt,
      });
    }
    if (readyForPickup) {
      history.push({
        shipmentId: shipment.id,
        fromStatus: "RECEIVED_AT_ZAMBIA",
        toStatus: "READY_FOR_PICKUP",
        location: "Lusaka warehouse",
        note: "Payment confirmed. Pickup note issued.",
        actorId: finance,
        createdAt: readyForPickup,
      });
    }
    if (deliveredAt) {
      history.push({
        shipmentId: shipment.id,
        fromStatus: "READY_FOR_PICKUP",
        toStatus: "DELIVERED",
        location: "Collected by customer",
        note: "Released to the customer against a valid pickup note.",
        actorId: zambia,
        createdAt: deliveredAt,
      });
    }
    await prisma.shipmentStatusHistory.createMany({ data: history });

    // Arrival verification for everything the Lusaka team has checked in.
    if (arrivedAt && spec.batchId) {
      await prisma.batchVerification.create({
        data: {
          batchId: spec.batchId,
          shipmentId: shipment.id,
          result: "VERIFIED",
          verifiedById: zambia,
          verifiedAt: arrivedAt,
        },
      });
    }

    created.push({
      id: shipment.id,
      trackingNumber: shipment.trackingNumber,
      spec,
    });
  }

  // ------------------------------------------------------------------ money
  for (const entry of created) {
    const needsInvoice =
      entry.spec.status === "RECEIVED_AT_ZAMBIA" ||
      entry.spec.status === "READY_FOR_PICKUP" ||
      entry.spec.status === "DELIVERED";
    if (!needsInvoice) continue;

    /* Rounded to the cent, not to the dollar: invoices are USD and the cent is
       the smallest unit that exists. */
    const total =
      Math.round(entry.spec.weightKg * rateFor(entry.spec.weightKg) * 100) / 100;
    const settled =
      entry.spec.status === "READY_FOR_PICKUP" ||
      entry.spec.status === "DELIVERED";

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${year}-${pad(await seq(`invoice:${year}`))}`,
        shipmentId: entry.id,
        customerId: customers[entry.spec.customer].id,
        freightCost: new Prisma.Decimal(total),
        total: new Prisma.Decimal(total),
        amountPaid: new Prisma.Decimal(settled ? total : 0),
        status: settled ? "PAID" : "UNPAID",
        issuedById: finance,
      },
    });

    if (!settled) continue;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: new Prisma.Decimal(total),
        method: entry.spec.status === "DELIVERED" ? "CASH" : "MOBILE_MONEY",
        reference:
          entry.spec.status === "DELIVERED"
            ? null
            : `MP${randomBytes(4).toString("hex").toUpperCase()}`,
        receivedById: finance,
        paidAt: daysAgo(entry.spec.status === "DELIVERED" ? 17 : 1),
      },
    });

    await prisma.receipt.create({
      data: {
        receiptNumber: `RCT-${year}-${pad(await seq(`receipt:${year}`))}`,
        paymentId: payment.id,
        issuedById: finance,
      },
    });

    const note = await prisma.pickupNote.create({
      data: {
        noteNumber: `PN-${year}-${pad(await seq(`pickup:${year}`))}`,
        shipmentId: entry.id,
        customerId: customers[entry.spec.customer].id,
        amountPaid: new Prisma.Decimal(total),
        status: entry.spec.status === "DELIVERED" ? "USED" : "ACTIVE",
        usedAt: entry.spec.status === "DELIVERED" ? daysAgo(16) : null,
        issuedById: finance,
        issuedAt: daysAgo(entry.spec.status === "DELIVERED" ? 17 : 1),
      },
    });

    if (entry.spec.status === "DELIVERED") {
      const customer = customers[entry.spec.customer];
      await prisma.deliveryRecord.create({
        data: {
          shipmentId: entry.id,
          pickupNoteId: note.id,
          receiverName: customer.name,
          receiverPhone: customer.phone ?? "",
          relationship: "SELF",
          releasedById: zambia,
          releasedAt: daysAgo(16),
        },
      });
    }
  }

  // -------------------------------------------------------------- exception
  const damaged = created.find((c) => c.spec.status === "RECEIVED_AT_ZAMBIA");
  if (damaged) {
    await prisma.shipmentException.create({
      data: {
        shipmentId: damaged.id,
        batchId: arrivedBatch.id,
        type: "DAMAGED_CARGO",
        description:
          "One carton arrived with a torn corner. Contents counted and complete; customer informed.",
        raisedById: zambia,
        raisedAt: daysAgo(1),
      },
    });
  }

  // ------------------------------------------------------------------ audit
  await prisma.auditLog.create({
    data: {
      actorId: ceo.id,
      actorEmail: ceo.email,
      actorRole: "ADMIN",
      action: "system.seed",
      entity: "System",
      summary: `Seeded ${created.length} demo shipments across 4 batches`,
    },
  });

  console.log(
    `Seeded ${customers.length} customers, 4 batches and ${created.length} shipments.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
