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

import { generateQrToken, packageReference } from "../lib/ids";
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

  /*
    EVERYTHING ABOVE THIS LINE IS PRODUCTION INFRASTRUCTURE and always runs:
    company settings, the rate card, the five company accounts, the indicative
    FX board and the staff logins. A live deployment needs all of it — an
    install that cannot take a payment because no account exists is not an
    install — and every write above is an upsert, so re-running is safe.

    EVERYTHING BELOW IS DEMO CARGO, and it is opt-in.

    The old guard was "skip if any shipment exists", which is right for a second
    run and exactly wrong for the first: a fresh Neon database has no shipments,
    so the very deploy that must not get fake data was the one guaranteed to.
    Twenty invented consignments and five invented customers in a live system
    are not a cosmetic problem — they enter the batch manifests, the revenue
    figures and the credit book.

    So it now takes a deliberate `SEED_DEMO_DATA=true`. Local `.env` sets it;
    production must not.
  */
  if (process.env.SEED_DEMO_DATA !== "true") {
    console.log(
      "Demo cargo skipped — set SEED_DEMO_DATA=true to seed sample batches. " +
        "Production data (settings, rates, accounts, FX board, staff) is in place."
    );
    return;
  }

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
    { name: "Kabwe Hardware Centre", phone: "+260977334455", city: "Kabwe" },
    { name: "Solwezi Electronics", phone: "+260966778899", city: "Solwezi" },
    { name: "Chingola Auto Spares", phone: "+260955112233", city: "Chingola" },
    { name: "Mansa Household Goods", phone: "+260977556677", city: "Mansa" },
    { name: "Kasama Trading Co", phone: "+260966990011", city: "Kasama" },
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

  /*
    EXACTLY TWO BATCHES, because that is what AITRANSIT actually runs: one
    consolidation out of Guangzhou for general cargo, one out of Hong Kong for
    electronics and the special category. The source system's demo data carried
    four, which made the batch list look busy and taught a new operator nothing
    the two do not.

    They are at different points on purpose. Guangzhou has LANDED, so its ten
    items can sit at every stage after arrival — still to be checked in, checked
    in, invoiced, chased, released, gone. Hong Kong is still IN THE AIR, so its
    ten show the China half: registered, assigned, sealed, flying. Between them
    the twenty cover the whole workflow without either batch telling a story
    that could not happen.
  */
  /*
    FOUR BATCHES: two that have landed in Lusaka and two still filling in China.

    That pairing is the point. The two landed ones exercise everything after
    arrival — check-in, weighing, pricing, invoicing, credit, release — and the
    two in China exercise everything before it, including a batch that is still
    open and taking cargo. One batch of each kind out of each origin, so the
    Guangzhou lane and the Hong Kong lane are both represented at both ends.

    Ten consignments each, one per customer, and no customer appears twice in
    the same batch — a manifest with the same name on two lines is not what a
    real batch looks like and it hides grouping bugs.
  */
  const guangzhouLanded = await mkBatch({
    origin: "GUANGZHOU",
    status: "ARRIVED",
    airline: "Ethiopian Airlines",
    flightNumber: "ET 8611",
    waybillNumber: "071-45889231",
    departureDate: daysAgo(9),
    departedAt: daysAgo(9),
    arrivalDate: daysAgo(5),
    arrivedAt: daysAgo(5),
    notes: "General cargo — normal goods and wigs. Landed at Lusaka.",
    createdById: china,
    createdAt: daysAgo(16),
  });

  const hongKongLanded = await mkBatch({
    origin: "HONG_KONG",
    status: "ARRIVED",
    airline: "Qatar Airways Cargo",
    flightNumber: "QR 8142",
    waybillNumber: "157-88213076",
    departureDate: daysAgo(7),
    departedAt: daysAgo(7),
    arrivalDate: daysAgo(3),
    arrivedAt: daysAgo(3),
    notes: "Electronics and special category. Landed at Lusaka.",
    createdById: china,
    createdAt: daysAgo(14),
  });

  const guangzhouLoading = await mkBatch({
    origin: "GUANGZHOU",
    status: "OPEN",
    notes: "Filling in Guangzhou — targeting the Thursday freighter.",
    createdById: china,
    createdAt: daysAgo(3),
  });

  const hongKongLoading = await mkBatch({
    origin: "HONG_KONG",
    status: "READY_TO_DEPART",
    airline: "Emirates SkyCargo",
    flightNumber: "EK 9821",
    waybillNumber: "176-33920114",
    departureDate: daysAgo(-1),
    notes: "Sealed in Hong Kong, flies tomorrow.",
    createdById: china,
    createdAt: daysAgo(4),
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

  /*
    Ten and ten. The counts are asserted at the end of this file — a demo batch
    that quietly grows an eleventh item stops being the thing the spec asked for.
  */
  /*
    Forty consignments: ten per batch, one per customer, no repeats inside a
    batch. Counts are asserted below rather than trusted.

    The two LANDED batches carry the full spread of post-arrival states —
    delivered, released, checked in, and a couple still to be checked in, which
    is what a warehouse floor actually looks like on any given morning. The two
    still in China are READY_TO_DEPART, because nothing has flown yet.
  */
  const specs: Spec[] = [
    // ---- Guangzhou, landed at Lusaka: general cargo -------------------------
    { customer: 0, goodsType: "TEXTILES_GARMENTS", description: "Ladies' clothing", packages: 8, weightKg: 211, batchId: guangzhouLanded.id, status: "DELIVERED", origin: "GUANGZHOU", registeredDaysAgo: 16 },
    { customer: 1, goodsType: "GENERAL_MERCHANDISE", description: "Assorted general goods", packages: 6, weightKg: 148.5, batchId: guangzhouLanded.id, status: "DELIVERED", origin: "GUANGZHOU", registeredDaysAgo: 16 },
    { customer: 2, goodsType: "FOOTWEAR", description: "Shoes and sneakers", packages: 12, weightKg: 305.2, batchId: guangzhouLanded.id, status: "READY_FOR_PICKUP", origin: "GUANGZHOU", registeredDaysAgo: 15 },
    { customer: 3, goodsType: "COSMETICS", description: "Human hair and beauty products", packages: 5, weightKg: 77.4, batchId: guangzhouLanded.id, status: "READY_FOR_PICKUP", origin: "GUANGZHOU", registeredDaysAgo: 15 },
    { customer: 4, goodsType: "TEXTILES_GARMENTS", description: "Wigs and hair bundles", packages: 3, weightKg: 28.6, batchId: guangzhouLanded.id, status: "READY_FOR_PICKUP", origin: "GUANGZHOU", registeredDaysAgo: 14 },
    { customer: 5, goodsType: "MACHINERY_PARTS", description: "Water pump spare parts", packages: 2, weightKg: 94.8, batchId: guangzhouLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "GUANGZHOU", registeredDaysAgo: 14 },
    { customer: 6, goodsType: "FURNITURE_FITTINGS", description: "Kitchen fittings", packages: 4, weightKg: 66, batchId: guangzhouLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "GUANGZHOU", registeredDaysAgo: 13 },
    { customer: 7, goodsType: "AUTO_SPARES", description: "Motorcycle spare parts", packages: 7, weightKg: 189.35, batchId: guangzhouLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "GUANGZHOU", registeredDaysAgo: 13 },
    { customer: 8, goodsType: "GENERAL_MERCHANDISE", description: "Household plasticware", packages: 4, weightKg: 52.75, batchId: guangzhouLanded.id, status: "IN_TRANSIT", origin: "GUANGZHOU", registeredDaysAgo: 12 },
    { customer: 9, goodsType: "STATIONERY", description: "Office stationery", packages: 3, weightKg: 0.8, batchId: guangzhouLanded.id, status: "IN_TRANSIT", origin: "GUANGZHOU", registeredDaysAgo: 12 },

    // ---- Hong Kong, landed at Lusaka: electronics and special ---------------
    { customer: 1, goodsType: "ELECTRONICS", description: "LED lighting panels", packages: 4, weightKg: 118, batchId: hongKongLanded.id, status: "DELIVERED", origin: "HONG_KONG", registeredDaysAgo: 14 },
    { customer: 3, goodsType: "PHONE_ACCESSORIES", description: "Mobile phone accessories", packages: 3, weightKg: 62.25, batchId: hongKongLanded.id, status: "READY_FOR_PICKUP", origin: "HONG_KONG", registeredDaysAgo: 14 },
    { customer: 6, goodsType: "ELECTRONICS", description: "Laptop chargers and cables", packages: 5, weightKg: 41.9, batchId: hongKongLanded.id, status: "READY_FOR_PICKUP", origin: "HONG_KONG", registeredDaysAgo: 13 },
    { customer: 0, goodsType: "ELECTRONICS", description: "Bluetooth speakers", packages: 6, weightKg: 88.4, batchId: hongKongLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "HONG_KONG", registeredDaysAgo: 13 },
    { customer: 2, goodsType: "ELECTRONICS", description: "CCTV cameras and recorders", packages: 5, weightKg: 102.8, batchId: hongKongLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "HONG_KONG", registeredDaysAgo: 12 },
    { customer: 4, goodsType: "PHONE_ACCESSORIES", description: "Power banks", packages: 4, weightKg: 73.6, batchId: hongKongLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "HONG_KONG", registeredDaysAgo: 12 },
    { customer: 5, goodsType: "COSMETICS", description: "Branded cosmetics", packages: 3, weightKg: 24.15, batchId: hongKongLanded.id, status: "RECEIVED_AT_ZAMBIA", origin: "HONG_KONG", registeredDaysAgo: 11 },
    { customer: 7, goodsType: "ELECTRONICS", description: "Tablet computers", packages: 2, weightKg: 31.5, batchId: hongKongLanded.id, status: "IN_TRANSIT", origin: "HONG_KONG", registeredDaysAgo: 11 },
    { customer: 8, goodsType: "PHONE_ACCESSORIES", description: "Smart watches", packages: 1, weightKg: 0.6, batchId: hongKongLanded.id, status: "IN_TRANSIT", origin: "HONG_KONG", registeredDaysAgo: 10 },
    { customer: 9, goodsType: "ELECTRONICS", description: "Solar inverters and batteries", packages: 3, weightKg: 145.2, batchId: hongKongLanded.id, status: "IN_TRANSIT", origin: "HONG_KONG", registeredDaysAgo: 10 },

    // ---- Guangzhou, still open in China -------------------------------------
    { customer: 2, goodsType: "TEXTILES_GARMENTS", description: "Men's shirts and trousers", packages: 9, weightKg: 167.4, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 5 },
    { customer: 5, goodsType: "FOOTWEAR", description: "Ladies' sandals", packages: 6, weightKg: 88.9, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 5 },
    { customer: 0, goodsType: "GENERAL_MERCHANDISE", description: "Kitchenware assortment", packages: 7, weightKg: 120.6, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 4 },
    { customer: 8, goodsType: "FURNITURE_FITTINGS", description: "Cabinet handles and hinges", packages: 3, weightKg: 44.2, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 4 },
    { customer: 1, goodsType: "TEXTILES_GARMENTS", description: "Braiding hair", packages: 4, weightKg: 36.8, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 3 },
    { customer: 9, goodsType: "AUTO_SPARES", description: "Brake pads and filters", packages: 5, weightKg: 131.5, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 3 },
    { customer: 3, goodsType: "STATIONERY", description: "School exercise books", packages: 10, weightKg: 204.3, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 2 },
    { customer: 6, goodsType: "COSMETICS", description: "Skin care products", packages: 2, weightKg: 19.7, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 2 },
    { customer: 4, goodsType: "GENERAL_MERCHANDISE", description: "Plastic storage crates", packages: 8, weightKg: 96.4, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 1 },
    { customer: 7, goodsType: "TEXTILES_GARMENTS", description: "Children's clothing", packages: 5, weightKg: 58.1, batchId: guangzhouLoading.id, status: "READY_TO_DEPART", origin: "GUANGZHOU", registeredDaysAgo: 1 },

    // ---- Hong Kong, sealed in China, flies tomorrow -------------------------
    { customer: 4, goodsType: "ELECTRONICS", description: "Smart TVs", packages: 4, weightKg: 178.5, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 6 },
    { customer: 7, goodsType: "PHONE_ACCESSORIES", description: "Phone cases and protectors", packages: 2, weightKg: 17.3, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 6 },
    { customer: 1, goodsType: "ELECTRONICS", description: "Wireless earbuds", packages: 3, weightKg: 22.9, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 5 },
    { customer: 5, goodsType: "ELECTRONICS", description: "Computer monitors", packages: 5, weightKg: 134.7, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 5 },
    { customer: 9, goodsType: "ELECTRONICS", description: "Router and networking kit", packages: 2, weightKg: 28.4, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 4 },
    { customer: 0, goodsType: "PHONE_ACCESSORIES", description: "Charging cables in bulk", packages: 6, weightKg: 54.2, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 4 },
    { customer: 8, goodsType: "ELECTRONICS", description: "Digital cameras", packages: 1, weightKg: 0.9, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 3 },
    { customer: 2, goodsType: "COSMETICS", description: "Branded perfumes", packages: 2, weightKg: 14.6, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 3 },
    { customer: 6, goodsType: "ELECTRONICS", description: "Gaming consoles", packages: 3, weightKg: 41.8, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 2 },
    { customer: 3, goodsType: "ELECTRONICS", description: "Kitchen appliances", packages: 4, weightKg: 97.3, batchId: hongKongLoading.id, status: "READY_TO_DEPART", origin: "HONG_KONG", registeredDaysAgo: 2 },
  ];

  /*
    The specification is explicit: exactly ten items per sample batch. Asserting
    it here rather than trusting the list above, because a seed is edited by
    people in a hurry and an eleventh row is invisible until somebody counts.
  */
  for (const [label, id] of [
    ["Guangzhou (landed)", guangzhouLanded.id],
    ["Hong Kong (landed)", hongKongLanded.id],
    ["Guangzhou (loading)", guangzhouLoading.id],
    ["Hong Kong (loading)", hongKongLoading.id],
  ] as const) {
    const items = specs.filter((spec) => spec.batchId === id);
    if (items.length !== 10) {
      throw new Error(`${label} must hold exactly 10 sample items, found ${items.length}.`);
    }
    // Ten different customers, not one customer ten times.
    const distinct = new Set(items.map((i) => i.customer)).size;
    if (distinct !== 10) {
      throw new Error(`${label} must span 10 different customers, found ${distinct}.`);
    }
  }

  const created: { id: string; trackingNumber: string; spec: Spec }[] = [];

  for (const spec of specs) {
    const registeredAt = daysAgo(spec.registeredDaysAgo);
    const batch =
      [guangzhouLanded, hongKongLanded, guangzhouLoading, hongKongLoading].find(
        (b) => b.id === spec.batchId
      ) ?? null;

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

  /*
    ONE PACKAGE ROW PER CARTON, with its own QR token.

    The demo used to record `packages: 8` as a number and create no Package
    rows at all, so every sample consignment had a carton count and not one
    scannable label. That is not a cosmetic gap: release at the Lusaka counter
    is a QR scan against a pickup note, so a demo built that way could not
    demonstrate — or regression-test — the one control that stops cargo being
    handed to the wrong person.

    Tokens come from the same generator the receiving flow uses. They are random
    rather than derived from the tracking number, deliberately: tracking numbers
    are sequential and public, and a guessable QR would be a forged label.
  */
  let packageRows = 0;
  for (const entry of created) {
    const arrived =
      entry.spec.status === "RECEIVED_AT_ZAMBIA" ||
      entry.spec.status === "READY_FOR_PICKUP" ||
      entry.spec.status === "DELIVERED";

    await prisma.package.createMany({
      data: Array.from({ length: entry.spec.packages }, (_, i) => ({
        shipmentId: entry.id,
        sequence: i + 1,
        reference: packageReference(entry.trackingNumber, i + 1),
        qrToken: generateQrToken(),
        // Split the declared weight evenly across the cartons; the real figure
        // is whatever the Lusaka scale says, and only arrived cargo has one.
        weightKg: new Prisma.Decimal(
          Math.round((entry.spec.weightKg / entry.spec.packages) * 1000) / 1000
        ),
        receivedAt: arrived ? daysAgo(entry.spec.registeredDaysAgo - 4) : null,
        receivedById: arrived ? zambia : null,
        deliveredAt: entry.spec.status === "DELIVERED" ? daysAgo(2) : null,
      })),
    });
    packageRows += entry.spec.packages;
  }
  console.log(`Packages: ${packageRows} cartons labelled with QR tokens.`);

  // ------------------------------------------------------------------ money
  /*
    The rate the demo books convert at. INDICATIVE, and the seeded FX rows say
    so — this is a plausible opening figure for USD→ZMW, not a rate AITRANSIT
    has agreed to trade at. Admin confirms the real one under Finance →
    Exchange, and every invoice raised after that carries whatever they set.
  */
  const DEMO_USD_ZMW = 27.5;

  await prisma.exchangeRate.upsert({
    where: { id: "seed-usd-zmw" },
    create: {
      id: "seed-usd-zmw",
      fromCurrency: "USD",
      toCurrency: "ZMW",
      rate: new Prisma.Decimal(DEMO_USD_ZMW),
      buyRate: new Prisma.Decimal(26.5),
      sellRate: new Prisma.Decimal(DEMO_USD_ZMW),
      status: "INDICATIVE",
      source: "Seeded opening figure",
      notes: "Indicative. Admin must confirm before this settles anything.",
    },
    update: {},
  });

  const [usdCashAccount, mobileMoneyAccount] = await Promise.all([
    prisma.companyAccount.findUniqueOrThrow({ where: { code: "CASH_OFFICE_USD" } }),
    prisma.companyAccount.findUniqueOrThrow({ where: { code: "MOBILE_MONEY" } }),
  ]);

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
        /* The rate this bill was raised under, frozen onto it. Without this a
           demo invoice cannot show a kwacha equivalent, and — worse — it would
           silently restate itself every time Admin moved the rate, which is the
           one thing invoices in this system are built not to do. */
        exchangeRate: new Prisma.Decimal(DEMO_USD_ZMW),
        issuedById: finance,
      },
    });

    if (!settled) continue;

    /*
      Half the demo payments settle in USD cash and half in kwacha over mobile
      money, because that is the split the business actually sees and because a
      demo where every payment is in the invoice's own currency never exercises
      the conversion columns at all.

      A kwacha payment stores three things, not one: what the customer handed
      over (`amount`, in ZMW), what it settled in USD (`creditedAmount`), and
      the rate that got from one to the other. Storing only the first would
      leave the bill unexplainable six months later.
    */
    const paidInUsd = entry.spec.status === "DELIVERED";
    const account = paidInUsd ? usdCashAccount : mobileMoneyAccount;
    const amountPaidNow = paidInUsd
      ? total
      : Math.round(total * DEMO_USD_ZMW * 100) / 100;

    const payment = await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: new Prisma.Decimal(amountPaidNow),
        currency: account.currency,
        creditedAmount: new Prisma.Decimal(total),
        exchangeRate: paidInUsd ? null : new Prisma.Decimal(DEMO_USD_ZMW),
        accountId: account.id,
        method: paidInUsd ? "CASH" : "MOBILE_MONEY",
        reference: paidInUsd
          ? null
          : `MP${randomBytes(4).toString("hex").toUpperCase()}`,
        receivedById: finance,
        paidAt: daysAgo(paidInUsd ? 17 : 1),
      },
    });

    await prisma.receipt.create({
      data: {
        receiptNumber: `RCT-${year}-${pad(await seq(`receipt:${year}`))}`,
        paymentId: payment.id,
        issuedById: finance,
      },
    });

    /*
      THE LEDGER LINE. Money that moved without one is money the books cannot
      see: an account balance in this system is a running total over ledger
      rows, not a column, so eight seeded payments with no entries left every
      demo account reading zero while the invoices showed them paid. The
      finance reconciliation check catches exactly that disagreement, and it
      was catching it.

      `amountUsd` is the figure reporting sums on, so it is always the USD
      equivalent whatever currency the customer actually handed over.
    */
    await prisma.ledgerEntry.create({
      data: {
        entryNumber: `GL-${year}-${pad(await seq(`ledger:${year}`))}`,
        accountId: account.id,
        direction: "IN",
        kind: "CUSTOMER_PAYMENT",
        amount: new Prisma.Decimal(amountPaidNow),
        currency: account.currency,
        amountUsd: new Prisma.Decimal(total),
        exchangeRate: paidInUsd ? null : new Prisma.Decimal(DEMO_USD_ZMW),
        occurredAt: daysAgo(paidInUsd ? 17 : 1),
        description: `Payment for ${invoice.invoiceNumber}`,
        sourceEntity: "Payment",
        sourceId: payment.id,
        paymentId: payment.id,
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
        batchId: guangzhouLanded.id,
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
