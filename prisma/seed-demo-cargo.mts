/**
 * DEMO CARGO for a live install.
 *
 *   npx tsx prisma/seed-demo-cargo.mts            # create or top up
 *   npx tsx prisma/seed-demo-cargo.mts --remove   # take it all out again
 *
 * Four batches, ten consignments each, forty in total: two still loading in
 * China and two landed at Lusaka with invoices, credit and pickup notes.
 *
 * WHY THIS IS SEPARATE from prisma/seed.ts. That script's demo half is opt-in
 * behind SEED_DEMO_DATA and is meant for a laptop; this one is meant to be run
 * ONCE against a real deployment so the staff have something to click before
 * the first real consignment arrives. Different job, different guarantees.
 *
 * THREE GUARANTEES.
 *
 * 1. IT TOUCHES NOTHING IT DID NOT CREATE. Every write is keyed on an
 *    identifier this script owns — `DEMO-AIT-…` — and every lookup is filtered
 *    the same way. There is no updateMany, no deleteMany without that filter,
 *    and no query that could reach a real customer, consignment or invoice.
 *
 * 2. IT IS IDEMPOTENT. Batch numbers, tracking numbers, customer codes,
 *    invoice numbers and note numbers are all DERIVED — index 7 of the
 *    Guangzhou arrival batch is always DEMO-AIT-000027 — so a second run finds
 *    what it made and leaves it alone. Nothing is minted from a counter,
 *    because a counter would hand out new numbers on every run.
 *
 * 3. IT IS REVERSIBLE. `--remove` deletes exactly what the prefix matches, in
 *    dependency order, and nothing else.
 *
 * FILTERING DEMO OUT OF REPORTS. Everything carries the prefix, so
 * `where: { trackingNumber: { startsWith: "DEMO-AIT-" } }` isolates it, and
 * `NOT` excludes it. Customers additionally read "DEMO —" in the name, which is
 * what a person sees on a dashboard that has not been taught the filter.
 */
import { PrismaClient, Prisma } from "@prisma/client";

import { generateQrToken, packageReference } from "../lib/ids";
import { quote } from "../lib/pricing";
import { STORAGE_POLICY } from "../lib/constants";

const prisma = new PrismaClient();

const PREFIX = "DEMO-AIT-";
const REMOVE = process.argv.includes("--remove");

const pad = (n: number, w = 6) => String(n).padStart(w, "0");
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const money = (n: number) => new Prisma.Decimal(n.toFixed(2));

/* ------------------------------------------------------------------ people */

const CUSTOMERS = [
  { n: "Chanda Mwansa Trading", p: "+260977100201", e: "chanda.mwansa@example.co.zm", c: "Lusaka" },
  { n: "Bwalya Hair & Beauty", p: "+260966100202", e: "bwalya.hair@example.co.zm", c: "Lusaka" },
  { n: "Mulenga Electronics", p: "+260955100203", e: "mulenga.elec@example.co.zm", c: "Kitwe" },
  { n: "Nsofwa General Dealers", p: "+260977100204", e: "nsofwa.gd@example.co.zm", c: "Ndola" },
  { n: "Temwani Fashion House", p: "+260966100205", e: "temwani.fashion@example.co.zm", c: "Lusaka" },
  { n: "Kabaso Phone Centre", p: "+260955100206", e: "kabaso.phones@example.co.zm", c: "Chingola" },
  { n: "Lubuto Household Supplies", p: "+260977100207", e: "lubuto.house@example.co.zm", c: "Livingstone" },
  { n: "Mutale Shoes & Bags", p: "+260966100208", e: "mutale.shoes@example.co.zm", c: "Kabwe" },
  { n: "Chileshe Cosmetics", p: "+260955100209", e: "chileshe.cosmetics@example.co.zm", c: "Solwezi" },
  { n: "Sinkala Digital Store", p: "+260977100210", e: "sinkala.digital@example.co.zm", c: "Chipata" },
];

const SUPPLIERS = [
  "Guangzhou Yuexiu Trading Co., Ltd",
  "Baiyun Hair Products Factory",
  "Shenzhen Huaqiang Electronics Ltd",
  "Foshan Homeware Manufacturing",
  "Yiwu Fashion Accessories Co.",
  "Dongguan Footwear Group",
  "Guangzhou Beauty Supplies Ltd",
  "Shenzhen Smart Device Co., Ltd",
  "Panyu Leather Goods Factory",
  "Hong Kong Digital Imports Ltd",
];

/* ------------------------------------------------------------------ cargo */

type Item = {
  desc: string;
  category: "NORMAL_GOODS" | "WIGS" | "SPECIAL_CATEGORY";
  goods: string;
  /** Product name in the catalogue, when one applies. Drives per-piece rates. */
  type?: string;
  boxes: number;
  kg: number;
};

/** Batch 1 — Guangzhou, still loading. Normal goods and wigs. */
const GZ_LOADING: Item[] = [
  { desc: "Ladies' dresses and blouses", category: "NORMAL_GOODS", goods: "TEXTILES_GARMENTS", type: "Clothes", boxes: 6, kg: 84.5 },
  { desc: "Men's canvas shoes", category: "NORMAL_GOODS", goods: "FOOTWEAR", type: "Shoes", boxes: 4, kg: 61.2 },
  { desc: "Handbags and travel luggage", category: "NORMAL_GOODS", goods: "GENERAL_MERCHANDISE", type: "Bags", boxes: 5, kg: 47.8 },
  { desc: "Plastic storage containers", category: "NORMAL_GOODS", goods: "GENERAL_MERCHANDISE", type: "Household items", boxes: 8, kg: 96.4 },
  { desc: "Non-stick cookware sets", category: "NORMAL_GOODS", goods: "GENERAL_MERCHANDISE", type: "Kitchenware", boxes: 3, kg: 52.1 },
  { desc: "Lace front wigs, assorted", category: "WIGS", goods: "COSMETICS", type: "Wigs", boxes: 2, kg: 18.6 },
  { desc: "Human hair bundles 20 inch", category: "WIGS", goods: "COSMETICS", type: "Hair bundles", boxes: 3, kg: 24.3 },
  { desc: "Braiding hair, mixed colours", category: "WIGS", goods: "COSMETICS", type: "Braiding hair", boxes: 4, kg: 31.7 },
  { desc: "Baseball caps and sun hats", category: "NORMAL_GOODS", goods: "TEXTILES_GARMENTS", type: "Hats", boxes: 2, kg: 14.9 },
  { desc: "Children's clothing sets", category: "NORMAL_GOODS", goods: "TEXTILES_GARMENTS", type: "Clothes", boxes: 5, kg: 43.2 },
];

/** Batch 2 — Hong Kong, still loading. Electronics and special. */
const HK_LOADING: Item[] = [
  { desc: "Smartphones, boxed retail units", category: "SPECIAL_CATEGORY", goods: "PHONE_ACCESSORIES", type: "Smart Phone (Full Box)", boxes: 2, kg: 12.4 },
  { desc: "Bluetooth headphones", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "AirPods", boxes: 3, kg: 8.7 },
  { desc: "Laptop computers, 14 inch", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Laptop", boxes: 2, kg: 21.5 },
  { desc: "Smart watches, assorted", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Smart Watch", boxes: 1, kg: 4.2 },
  { desc: "Phone charging cables in bulk", category: "SPECIAL_CATEGORY", goods: "PHONE_ACCESSORIES", type: "Chargers", boxes: 6, kg: 38.9 },
  { desc: "Portable power banks", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Batteries", boxes: 4, kg: 46.3 },
  { desc: "Bluetooth speakers", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Speakers", boxes: 3, kg: 27.6 },
  { desc: "Electric kettles and blenders", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Others", boxes: 5, kg: 63.4 },
  { desc: "Tablet computers, 10 inch", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Tablet", boxes: 2, kg: 15.8 },
  { desc: "LED display modules", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "LED Displays", boxes: 4, kg: 54.1 },
];

/** Batch 3 — Guangzhou, landed at Lusaka. Awaiting payment. */
const GZ_ARRIVED: Item[] = [
  { desc: "Ladies' winter coats", category: "NORMAL_GOODS", goods: "TEXTILES_GARMENTS", type: "Clothes", boxes: 7, kg: 112.6 },
  { desc: "Sports trainers, mixed sizes", category: "NORMAL_GOODS", goods: "FOOTWEAR", type: "Shoes", boxes: 9, kg: 148.3 },
  { desc: "Lace closures and frontals", category: "WIGS", goods: "COSMETICS", type: "Closures & frontals", boxes: 2, kg: 9.4 },
  { desc: "Synthetic wigs, boxed", category: "WIGS", goods: "COSMETICS", type: "Wigs", boxes: 4, kg: 27.8 },
  { desc: "Bed linen and towels", category: "NORMAL_GOODS", goods: "GENERAL_MERCHANDISE", type: "Household items", boxes: 6, kg: 88.2 },
  { desc: "Leather handbags", category: "NORMAL_GOODS", goods: "GENERAL_MERCHANDISE", type: "Bags", boxes: 3, kg: 34.7 },
  { desc: "School exercise books", category: "NORMAL_GOODS", goods: "STATIONERY", type: "Stationery", boxes: 12, kg: 204.5 },
  { desc: "Fabric rolls, printed cotton", category: "NORMAL_GOODS", goods: "TEXTILES_GARMENTS", type: "Fabrics", boxes: 5, kg: 96.1 },
  { desc: "Hair care products", category: "WIGS", goods: "COSMETICS", type: "Hair products", boxes: 3, kg: 22.9 },
  { desc: "Sample pack, trade fair", category: "NORMAL_GOODS", goods: "GENERAL_MERCHANDISE", type: "General Merchandise", boxes: 1, kg: 0.6 },
];

/** Batch 4 — Hong Kong, landed at Lusaka. Payment, credit and pickup. */
const HK_ARRIVED: Item[] = [
  { desc: "Smartphones, boxed retail units", category: "SPECIAL_CATEGORY", goods: "PHONE_ACCESSORIES", type: "Smart Phone (Full Box)", boxes: 3, kg: 18.2 },
  { desc: "Laptop computers, business", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Laptop", boxes: 2, kg: 24.6 },
  { desc: "Digital cameras", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Camera", boxes: 1, kg: 6.3 },
  { desc: "Wireless earbuds", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "AirPods", boxes: 2, kg: 7.1 },
  { desc: "Computer monitors, 24 inch", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Monitors", boxes: 4, kg: 71.4 },
  { desc: "Rechargeable batteries", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Batteries", boxes: 5, kg: 58.7 },
  { desc: "Cosmetics and skin care", category: "SPECIAL_CATEGORY", goods: "COSMETICS", type: "Cosmetics", boxes: 4, kg: 33.5 },
  { desc: "Phone cases and protectors", category: "SPECIAL_CATEGORY", goods: "PHONE_ACCESSORIES", type: "Others", boxes: 3, kg: 16.8 },
  { desc: "Printers and toner", category: "SPECIAL_CATEGORY", goods: "ELECTRONICS", type: "Printers", boxes: 2, kg: 42.9 },
  { desc: "Courier documents", category: "SPECIAL_CATEGORY", goods: "GENERAL_MERCHANDISE", type: "Documents", boxes: 1, kg: 0.4 },
];

/*
  Batches, and what each consignment in them looks like.

  `plan` is what makes the arrived batches useful rather than uniform: index 0
  and 1 of the Guangzhou arrival have been on the floor long enough to be
  accruing storage, two have credit approved, and in the Hong Kong arrival three
  are paid and ready to collect. Nothing is ever DELIVERED — the specification
  asks for cargo that is still there to be worked.
*/
const BATCHES = [
  /*
    THE LOADING TABLES, not two new batches.

    "Open, loading in China" is not a batch anybody creates here — it is the
    permanent loading table, one per route, and it is where cargo sits between
    being received in Guangzhou and being assigned to a flight. Creating
    ordinary OPEN batches for it, as this script first did, put twenty
    consignments somewhere the China desk's own screen does not look: that page
    lists `permanent: true` only, so it read "Empty" while the data was sitting
    in a batch beside it.

    `useLoadingTable` means "find the permanent table for this route and put the
    cargo on it" rather than "make a batch". There must be exactly one per
    route — assignToLoadingTable does a findFirst — so a second Guangzhou table
    would quietly capture real cargo later.
  */
  {
    useLoadingTable: true,
    origin: "GUANGZHOU" as const,
    items: GZ_LOADING,
    landed: false,
  },
  {
    useLoadingTable: true,
    origin: "HONG_KONG" as const,
    items: HK_LOADING,
    landed: false,
  },
  {
    number: `${PREFIX}GZ-002`,
    origin: "GUANGZHOU" as const,
    status: "ARRIVED" as const,
    items: GZ_ARRIVED,
    landed: true,
    notes: "DEMO — Guangzhou consolidation, landed at Lusaka.",
    /** index → how far along that consignment is. */
    plan: (i: number) =>
      i < 2 ? "storage" : i < 4 ? "credit" : "awaiting",
  },
  {
    number: `${PREFIX}HK-002`,
    origin: "HONG_KONG" as const,
    status: "ARRIVED" as const,
    items: HK_ARRIVED,
    landed: true,
    notes: "DEMO — Hong Kong consolidation, landed at Lusaka.",
    plan: (i: number) =>
      i < 3 ? "ready" : i < 5 ? "credit" : i < 7 ? "storage" : "awaiting",
  },
] as const;

/* ------------------------------------------------------------------ remove */

async function remove() {
  const shipments = await prisma.shipment.findMany({
    where: { trackingNumber: { startsWith: PREFIX } },
    select: { id: true },
  });
  const ids = shipments.map((s) => s.id);
  // Prefix only, and never a loading table: those are infrastructure that
  // existed before this script and must outlive it.
  const batches = await prisma.batch.findMany({
    where: { batchNumber: { startsWith: PREFIX }, permanent: false },
    select: { id: true },
  });
  const customers = await prisma.customer.findMany({
    where: { code: { startsWith: PREFIX } },
    select: { id: true },
  });

  // Child to parent. Nothing here can reach a record without the prefix.
  const steps: [string, () => Promise<{ count: number }>][] = [
    ["pickup notes", () => prisma.pickupNote.deleteMany({ where: { shipmentId: { in: ids } } })],
    ["invoices", () => prisma.invoice.deleteMany({ where: { shipmentId: { in: ids } } })],
    ["status history", () => prisma.shipmentStatusHistory.deleteMany({ where: { shipmentId: { in: ids } } })],
    ["packages", () => prisma.package.deleteMany({ where: { shipmentId: { in: ids } } })],
    ["shipments", () => prisma.shipment.deleteMany({ where: { id: { in: ids } } })],
    ["batches", () => prisma.batch.deleteMany({ where: { id: { in: batches.map((b) => b.id) } } })],
    ["customers", () => prisma.customer.deleteMany({ where: { id: { in: customers.map((c) => c.id) } } })],
    ["audit entries", () => prisma.auditLog.deleteMany({ where: { summary: { startsWith: "DEMO —" } } })],
  ];
  for (const [label, run] of steps) {
    const { count } = await run();
    if (count) console.log(`  removed ${count} ${label}`);
  }
  console.log("\nDemo cargo removed. Nothing else was touched.");
}

/* -------------------------------------------------------------------- seed */

async function seed() {
  const staff = await prisma.user.findMany({
    where: { email: { in: [
      "admin@aitransit.co.zm", "china@aitransit.co.zm", "warehouse@aitransit.co.zm",
      "finance@aitransit.co.zm", "support@aitransit.co.zm",
    ] } },
    select: { id: true, email: true, role: true },
  });
  const by = (email: string) => staff.find((s) => s.email === email) ?? null;
  const china = by("china@aitransit.co.zm");
  const zambia = by("warehouse@aitransit.co.zm");
  const finance = by("finance@aitransit.co.zm");
  if (!china || !zambia || !finance) {
    throw new Error(
      "Staff accounts are missing. Run `npx prisma db seed` first — this script " +
        "records who did what and will not invent a user to do it."
    );
  }

  // ----------------------------------------------------------- customers
  const customers = [];
  for (const [i, c] of CUSTOMERS.entries()) {
    const code = `${PREFIX}CUS-${pad(i + 1, 3)}`;
    customers.push(
      await prisma.customer.upsert({
        where: { code },
        create: {
          code,
          name: `DEMO — ${c.n}`,
          phone: c.p,
          email: c.e,
          city: c.c,
          notes: "Sample record created by seed-demo-cargo. Not a real customer.",
          createdById: china.id,
        },
        update: {},
      })
    );
  }
  console.log(`Customers: ${customers.length} demo records ready.`);

  /*
    The settlement rate in force, frozen onto every demo invoice.

    Not decoration: the portal shows a kwacha equivalent from this, and an
    invoice without one would silently restate itself every time Admin moved
    the rate — the one thing invoices here are built not to do.
  */
  const fx = await prisma.exchangeRate.findFirst({
    where: { active: true, fromCurrency: "USD", toCurrency: "ZMW" },
    orderBy: { effectiveFrom: "desc" },
    select: { rate: true },
  });
  const usdZmw = fx ? Number(fx.rate) : null;

  // ------------------------------------------------------------- catalogue
  const types = await prisma.cargoType.findMany({
    where: { active: true },
    select: { id: true, name: true, category: true },
  });
  const typeFor = (name: string | undefined, category: string) =>
    name ? types.find((t) => t.name === name && t.category === category)?.id ?? null : null;

  // ---------------------------------------------------------------- batches
  let seq = 0;
  let created = 0;
  let skipped = 0;

  /**
   * Put one batch's ten consignments on a batch id.
   *
   * Shared by both paths — the loading tables and the two arrival batches —
   * because the consignment itself is identical either way. What differs is
   * only which batch it hangs off and how far along it is.
   */
  const placeItems = async (spec: (typeof BATCHES)[number], batchId: string) => {
    for (const [i, item] of spec.items.entries()) {
      seq += 1;
      const tracking = `${PREFIX}${pad(seq)}`;

      if (await prisma.shipment.findUnique({ where: { trackingNumber: tracking }, select: { id: true } })) {
        skipped += 1;
        continue;
      }

      const customer = customers[(seq - 1) % customers.length];
      const supplier = SUPPLIERS[(seq - 1) % SUPPLIERS.length];
      const stage = spec.landed ? (spec as any).plan(i) as string : "china";

      const status =
        stage === "china" ? "READY_TO_DEPART"
        : stage === "ready" ? "READY_FOR_PICKUP"
        : "RECEIVED_AT_ZAMBIA";

      // Storage accrues from check-in. Two ages: inside the free window, and
      // past it, so the 7-day rule is visible in the data rather than implied.
      const checkedInDaysAgo = stage === "storage" ? 11 : 4;

      const shipment = await prisma.shipment.create({
        data: {
          trackingNumber: tracking,
          qrToken: generateQrToken(),
          customerId: customer.id,
          batchId,
          origin: spec.origin,
          cargoCategory: item.category,
          cargoTypeId: typeFor(item.type, item.category),
          goodsType: item.goods as any,
          description: item.desc,
          packages: item.boxes,
          weightKg: new Prisma.Decimal(item.kg),
          status: status as any,
          createdById: china.id,
          createdAt: daysAgo(spec.landed ? 22 : 5),
          ...(spec.landed ? { arrivedAt: daysAgo(checkedInDaysAgo) } : {}),
          internalNotes:
            `DEMO RECORD — not real cargo.\nSupplier: ${supplier}\n` +
            `China received weight: ${item.kg.toFixed(3)} kg` +
            (spec.landed ? `\nLusaka confirmed weight: ${item.kg.toFixed(3)} kg` : ""),
        },
      });
      created += 1;

      // Cartons, each with its own scannable token.
      await prisma.package.createMany({
        data: Array.from({ length: item.boxes }, (_, k) => ({
          shipmentId: shipment.id,
          sequence: k + 1,
          reference: packageReference(tracking, k + 1),
          qrToken: generateQrToken(),
          weightKg: new Prisma.Decimal(
            Math.round((item.kg / item.boxes) * 1000) / 1000
          ),
          receivedAt: spec.landed ? daysAgo(checkedInDaysAgo) : null,
          receivedById: spec.landed ? zambia.id : null,
        })),
      });

      // The trail the desks would have left.
      const history: { to: string; note: string; who: string; when: number }[] = [
        { to: "READY_TO_DEPART", note: `Received at the Guangzhou counter from ${supplier}.`, who: china.id, when: spec.landed ? 22 : 5 },
      ];
      if (spec.landed) {
        history.push({ to: "IN_TRANSIT", note: "Loaded and dispatched.", who: china.id, when: 16 });
        history.push({ to: "RECEIVED_AT_ZAMBIA", note: `Checked in at Lusaka. Weight confirmed on the scale at ${item.kg.toFixed(3)} kg.`, who: zambia.id, when: checkedInDaysAgo });
        if (stage === "ready") {
          history.push({ to: "READY_FOR_PICKUP", note: "Paid in full. Pickup note issued.", who: finance.id, when: 2 });
        }
      }
      for (const [h, entry] of history.entries()) {
        await prisma.shipmentStatusHistory.create({
          data: {
            shipmentId: shipment.id,
            fromStatus: h === 0 ? null : (history[h - 1].to as any),
            toStatus: entry.to as any,
            note: entry.note,
            actorId: entry.who,
            createdAt: daysAgo(entry.when),
          },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId: china.id,
          actorEmail: "china@aitransit.co.zm",
          actorRole: "CHINA_WAREHOUSE",
          action: "shipment.create",
          entity: "Shipment",
          entityId: shipment.id,
          summary: `DEMO — registered ${tracking} for ${customer.name}`,
          createdAt: daysAgo(spec.landed ? 22 : 5),
        },
      });

      if (!spec.landed) continue;

      /* ------------------------------------------------------- the money */

      // Priced by the REAL engine against the published book, so a demo
      // invoice always agrees with what the calculator quotes. Hard-coding a
      // rate here would make the sample data disagree with the rate card the
      // moment anybody edited it.
      const q = await quote({
        category: item.category as any,
        cargoTypeId: typeFor(item.type, item.category),
        weightKg: item.kg,
        quantity: item.boxes,
      });
      if (!q.ok) {
        console.warn(`  ${tracking}: unpriced (${(q as any).reason ?? "no rule"}) — invoice skipped`);
        continue;
      }

      const freight = Number(q.total);
      const overFree = Math.max(0, checkedInDaysAgo - STORAGE_POLICY.freeDays);
      const storage = overFree * STORAGE_POLICY.perDayUsd;
      const total = freight + storage;
      const credit = stage === "credit";
      const paid = stage === "ready";

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `${PREFIX}INV-${pad(seq, 4)}`,
          shipmentId: shipment.id,
          customerId: customer.id,
          currency: "USD",
          freightCost: money(freight),
          storageDays: overFree,
          storageCharge: money(storage),
          total: money(total),
          amountPaid: money(paid ? total : 0),
          status: paid ? "PAID" : "UNPAID",
          paymentType: credit ? "CREDIT" : "CASH",
          creditStatus: credit ? "APPROVED" : "NONE",
          creditTermDays: credit ? 14 : null,
          creditRequestedAt: credit ? daysAgo(6) : null,
          creditDecidedAt: credit ? daysAgo(5) : null,
          creditRequestedById: credit ? finance.id : null,
          creditDecidedById: credit ? finance.id : null,
          exchangeRate: usdZmw ? new Prisma.Decimal(usdZmw) : null,
          totalLocal: usdZmw ? money(total * usdZmw) : null,
          issuedById: finance.id,
          issuedAt: daysAgo(checkedInDaysAgo - 1),
          notes: "DEMO invoice — sample data, not a real bill.",
        },
      });

      await prisma.auditLog.create({
        data: {
          actorId: finance.id,
          actorEmail: "finance@aitransit.co.zm",
          actorRole: "FINANCE",
          action: "invoice.create",
          entity: "Invoice",
          entityId: invoice.id,
          summary:
            `DEMO — raised ${invoice.invoiceNumber} for ${tracking}, USD ${total.toFixed(2)}` +
            (storage ? ` (incl. ${overFree} day(s) storage)` : ""),
          createdAt: daysAgo(checkedInDaysAgo - 1),
        },
      });

      // A pickup note is the release document. Only cargo that is actually
      // releasable gets one: paid in full, or credit approved.
      if (paid || credit) {
        await prisma.pickupNote.create({
          data: {
            noteNumber: `${PREFIX}PN-${pad(seq, 4)}`,
            shipmentId: shipment.id,
            customerId: customer.id,
            amountPaid: money(paid ? total : 0),
            currency: "USD",
            status: "ACTIVE",
            issuedById: finance.id,
            issuedAt: daysAgo(2),
          },
        });
      }
    }
  };

  /*
    Two destinations, and the difference matters.

    Cargo still in China belongs on the permanent LOADING TABLE for its route —
    that is what the China desk's "Loading batches" screen lists, and cargo put
    anywhere else is invisible to the people who work it. Cargo that has flown
    belongs to a dispatch batch, which is a real record of a real flight.
  */
  for (const spec of BATCHES) {
    if ((spec as any).useLoadingTable) {
      const table = await prisma.batch.findFirst({
        where: { origin: spec.origin, permanent: true },
        select: { id: true, batchNumber: true },
      });
      if (!table) {
        throw new Error(
          `No loading table for ${spec.origin}. ` +
            "Run `npx tsx prisma/seed-loading-tables.ts --apply` first."
        );
      }
      await placeItems(spec, table.id);
      continue;
    }

    const batch = await prisma.batch.upsert({
      where: { batchNumber: (spec as any).number },
      create: {
        batchNumber: (spec as any).number,
        origin: spec.origin,
        status: (spec as any).status,
        notes: (spec as any).notes,
        createdById: china.id,
        createdAt: daysAgo(24),
        airline: spec.origin === "GUANGZHOU" ? "Ethiopian Airlines" : "Qatar Airways Cargo",
        flightNumber: spec.origin === "GUANGZHOU" ? "ET 8611" : "QR 8142",
        waybillNumber: spec.origin === "GUANGZHOU" ? "071-90010021" : "157-90010022",
        departureDate: daysAgo(16),
        departedAt: daysAgo(16),
        arrivalDate: daysAgo(12),
        arrivedAt: daysAgo(12),
      },
      update: {},
    });
    await placeItems(spec, batch.id);
  }

  console.log(
    `Cargo: ${created} created, ${skipped} already present (left alone).`
  );
}

/* ------------------------------------------------------------------ verify */

async function verify() {
  /*
    Batches HOLDING demo cargo — which is not the same as batches whose number
    starts with the prefix. Two of the four are the permanent loading tables,
    and they were there before this script ran and stay after it is removed.
  */
  const batches = await prisma.batch.findMany({
    where: { shipments: { some: { trackingNumber: { startsWith: PREFIX } } } },
    include: {
      shipments: {
        where: { trackingNumber: { startsWith: PREFIX } },
        select: { status: true, customerId: true },
      },
    },
    orderBy: [{ permanent: "desc" }, { batchNumber: "asc" }],
  });

  console.log("\nVERIFICATION");
  console.log(`  batches holding demo cargo          ${batches.length}  (want 4)`);
  for (const b of batches) {
    const where = b.permanent
      ? "loading table, China"
      : b.arrivedAt
        ? "landed at Lusaka"
        : "not dispatched";
    console.log(
      `    ${b.batchNumber.padEnd(18)} ${String(b.status).padEnd(8)} ${where.padEnd(21)} ` +
        `${b.shipments.length} items, ${new Set(b.shipments.map((s) => s.customerId)).size} customers`
    );
  }

  const ships = await prisma.shipment.findMany({
    where: { trackingNumber: { startsWith: PREFIX } },
    select: { status: true },
  });
  const count = (s: string) => ships.filter((x) => x.status === s).length;
  console.log(`  demo cargo total                    ${ships.length}  (want 40)`);
  console.log(`    loading in China                  ${count("READY_TO_DEPART")}`);
  console.log(`    awaiting payment at Lusaka        ${count("RECEIVED_AT_ZAMBIA")}`);
  console.log(`    ready for pickup                  ${count("READY_FOR_PICKUP")}  (want >= 3)`);
  console.log(`    picked up / delivered             ${count("DELIVERED")}  (want 0)`);

  const inv = await prisma.invoice.findMany({
    where: { invoiceNumber: { startsWith: PREFIX } },
    select: { currency: true, total: true, storageCharge: true, creditStatus: true, status: true },
  });
  const sum = inv.reduce((a, i) => a + Number(i.total), 0);
  console.log(`  demo invoices                       ${inv.length}`);
  console.log(`    all in USD                        ${inv.every((i) => i.currency === "USD")}`);
  console.log(`    credit approved                   ${inv.filter((i) => i.creditStatus === "APPROVED").length}`);
  console.log(`    carrying storage                  ${inv.filter((i) => Number(i.storageCharge) > 0).length}`);
  console.log(`    demo billed value                 USD ${sum.toFixed(2)}`);
  console.log(`  demo pickup notes                   ${await prisma.pickupNote.count({ where: { noteNumber: { startsWith: PREFIX } } })}`);

  const realCargo = await prisma.shipment.count({ where: { NOT: { trackingNumber: { startsWith: PREFIX } } } });
  const realCustomers = await prisma.customer.count({ where: { NOT: { code: { startsWith: PREFIX } } } });
  console.log(`\n  REAL (non-demo) records untouched: ${realCargo} cargo, ${realCustomers} customers`);
  console.log(`  Filter demo out with: { NOT: { trackingNumber: { startsWith: "${PREFIX}" } } }`);
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  console.log(`Target: ${url.replace(/^.*@/, "").split("/")[0] || "(unset)"}\n`);
  if (REMOVE) await remove();
  else await seed();
  await verify();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
