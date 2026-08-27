import type {
  BatchStatus,
  DamageSeverity,
  Department,
  ExceptionStatus,
  ExceptionType,
  GoodsType,
  InvoiceStatus,
  Origin,
  PaymentMethod,
  ResolutionType,
  Role,
  ShipmentStatus,
} from "@prisma/client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

/**
 * Single source of truth for every label the UI renders. Warehouse staff type
 * as little as possible — everything selectable comes from these lists.
 */

/**
 * AITRANSIT, as the company describes itself.
 *
 * Taken from the company's own flyers rather than paraphrased, because these
 * strings are printed on invoices, pickup notes and the public site, and a
 * customer standing in Makeni with a printed address needs the words the
 * business actually uses. The Chinese warehouse address in particular is sent
 * verbatim to suppliers in Guangzhou — do not translate or reformat it.
 *
 * One language. Target Express carried a Swahili voice for Lusaka es Salaam;
 * AITRANSIT sells into Lusaka, where the business is done in English, so the
 * second-language strings are gone rather than machine-translated into
 * something no one at the counter would say.
 */
export const COMPANY = {
  name: "AITRANSIT Cargo",
  shortName: "AITRANSIT",

  /** The line under the logo on every flyer the company prints. */
  tagline: "Ship with your own, Proudly Zambian!",
  /** The service promise, used in hero copy and stat tiles. */
  promise: "Giving a smooth delivery of your goods.",
  promiseEn: "Your cargo reaches Lusaka in 5-12 days.",
  promiseDays: "5-12",
  taglineEn: "Ship with your own, Proudly Zambian!",

  /** Air cargo China → Lusaka, with duty included to the Lusaka warehouse. */
  dutyNote: "Including freight and duty to the Lusaka office/warehouse. Brand products same price.",

  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "+260 96 5537047",
  phoneAlt: "+86 199 2517 6780",
  whatsapp: process.env.NEXT_PUBLIC_COMPANY_WHATSAPP ?? "260965537047",
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? "info@aitransit.co.zm",

  /**
   * The three people a customer or a supplier actually rings, each on both
   * WeChat and WhatsApp. Ordered as the flyer orders them.
   *
   * Kept as a list rather than three fields because the contact block appears
   * on the public site, the contact page and the footer, and those three
   * surfaces disagreeing about who to call is the failure this prevents.
   */
  contacts: [
    { name: "Clergy", phone: "13163385205", channels: "WeChat & WhatsApp", country: "CHINA" },
    { name: "Innocent", phone: "+260 96 5537047", channels: "WeChat & WhatsApp", country: "ZAMBIA" },
    { name: "Chris", phone: "+8619925176780", channels: "WeChat & WhatsApp", country: "CHINA" },
  ],

  /**
   * The Zambian collection point — one warehouse, in Makeni.
   *
   * `offices` stays an array because the footer, the contact page and the
   * warehouses page all map over it, and the business may open a second
   * collection point on the Copperbelt without any of those three needing to
   * change shape.
   */
  offices: [
    {
      id: "makeni",
      city: "Lusaka",
      name: "Lusaka warehouse",
      address: "Makeni, Off Chifundo Road, Behind Finca Bank, Lusaka, Zambia",
      lines: [
        "Makeni,",
        "Off Chifundo Road,",
        "Behind Finca Bank,",
        "Lusaka, Zambia.",
      ],
      country: "ZAMBIA",
      flag: "\u{1F1FF}\u{1F1F2}",
      note: "Collection point.",
      phones: ["+260 96 5537047"],
    },
  ],

  /**
   * Where suppliers in China deliver.
   *
   * The Chinese text matters and is sent to suppliers exactly as it stands —
   * it names the building, the unit numbers and the shop, and a supplier's
   * driver reads it off a phone screen at the gate.
   */
  chinaOffice: {
    city: "Guangzhou",
    addressCn: "\u5E7F\u5DDE\u5E02\u767D\u4E91\u533A\u5927\u6E90\u8857\u5927\u6E90\u5317\u8DEF30\u53F7\u4E4B\u4E00",
    addressCn2: "\uFF08\u7EFC\u5408\u697C\u81EA\u7F16A3\u3001A6\u3001A7\uFF09",
    addressCn3: "\u5E7F\u5DDE\u5E02\u9B45\u529B\u4E1C\u65B9\u8D27\u8FD0\u5E02\u573A\uFF0830-3\uFF09",
    addressCn4: "\u7B2CA3\u5EA7110\u5546\u94FA",
    addressEn:
      "No. 30 Dayuan North Road, Dayuan Street, Baiyun District, Guangzhou (Blocks A3, A6, A7)",
    rooms: "Charm East Freight Market (30-3), Block A3, Shop 110",
    lines: [
      "\u5E7F\u5DDE\u5E02\u767D\u4E91\u533A\u5927\u6E90\u8857\u5927\u6E90\u5317\u8DEF30\u53F7\u4E4B\u4E00",
      "\uFF08\u7EFC\u5408\u697C\u81EA\u7F16A3\u3001A6\u3001A7\uFF09",
      "\u5E7F\u5DDE\u5E02\u9B45\u529B\u4E1C\u65B9\u8D27\u8FD0\u5E02\u573A\uFF0830-3\uFF09",
      "\u7B2CA3\u5EA7110\u5546\u94FA",
    ],
    country: "CHINA",
    flag: "\u{1F1E8}\u{1F1F3}",
    phones: ["13163385205", "+8619925176780"],
  },

  /** One short line per location, for printed documents. */
  zambiaAddress: "Makeni, Off Chifundo Road, Behind Finca Bank, Lusaka, Zambia",
  chinaAddress:
    "No. 30 Dayuan North Road, Dayuan Street, Baiyun District, Guangzhou (A3/A6/A7)",
} as const;

/** Rates are published in USD, so invoices are raised in USD. */
export const DEFAULT_CURRENCY = "USD";

/**
 * Official collection accounts, printed on every invoice.
 *
 * Kept here rather than in the database because an invoice is a legal document:
 * the account a customer paid into must be reproducible from the code that
 * generated that invoice, not from a table someone edited afterwards.
 */
export type CollectionAccount = {
  /**
   * How the customer is told to pay, in full.
   *
   * "MIX BY YAS — LIPA NUMBER", never "Airtel Money". A customer reading "Airtel Money: 7122055"
   * has to guess whether that is a Lipa number, a personal number or an
   * account, and a guess at this step is money sent to the wrong place. The
   * label states the service, what kind of number it is, and — for banks — the
   * currency, because paying dollars into the kwacha account is a reversal
   * and a fortnight of somebody's time.
   */
  label: string;
  number: string;
  /** What the customer must see on their screen before they confirm. */
  accountName: string;
  kind: "MOBILE" | "BANK";
  /** Banks only. Mobile money is kwacha by definition here. */
  currency?: "ZMW" | "USD";
};

/**
 * Official collection accounts. THE single source for every surface.
 *
 * Kept in code rather than the database because an invoice is a legal
 * document: the account a customer paid into must be reproducible from the
 * code that generated that invoice, not from a table someone edited
 * afterwards.
 *
 * Nothing anywhere may write these numbers out again. Every customer-facing
 * screen, PDF, WhatsApp message and email reads this list, so changing a
 * number here changes it everywhere at once — which is the only way five
 * surfaces can be guaranteed to agree.
 */
export const PAYMENT_METHODS: readonly CollectionAccount[] = [
  /*
    PLACEHOLDERS UNTIL THE OWNER FILLS THEM IN, and deliberately readable as
    such. AITRANSIT's real till, bank and mobile-money numbers are not in this
    repository, and inventing plausible ones would put a number on an invoice
    that sends a customer's money somewhere it cannot be recovered from.

    An empty list was not an option either — the invoice renderer and the PDF
    both print this block, and an invoice with no payment instructions is worse
    than one that says "confirm with the office". So each row carries the
    account's real SHAPE (which currency, which kind, which institution) and a
    number that cannot be mistaken for a live one.

    Replace them in Admin → Company settings, which writes to CompanySetting
    and wins over this file from that moment on, and snapshots onto every
    invoice raised afterwards. No deploy needed.
  */
  {
    label: "MOBILE MONEY \u2014 AIRTEL/MTN",
    number: "TO BE CONFIRMED",
    accountName: "AITRANSIT CARGO",
    kind: "MOBILE",
  },
  {
    label: "BANK \u2014 ZMW ACCOUNT",
    number: "TO BE CONFIRMED",
    accountName: "AITRANSIT CARGO",
    kind: "BANK",
    currency: "ZMW",
  },
  {
    label: "BANK \u2014 USD ACCOUNT",
    number: "TO BE CONFIRMED",
    accountName: "AITRANSIT CARGO",
    kind: "BANK",
    currency: "USD",
  },
];

/**
 * The old grouped shape, DERIVED so it cannot drift.
 *
 * The invoice page and the PDF read it. Rather than edit three renderers at
 * once and risk one of them keeping a stale copy, the shape stays and the data
 * behind it moves — there is still exactly one place a number is written down.
 */
export const PAYMENT_ACCOUNTS = {
  mobileMoney: PAYMENT_METHODS.filter((m) => m.kind === "MOBILE").map((m) => ({
    provider: m.label,
    number: m.number,
    accountName: m.accountName,
  })),
  banks: Array.from(
    PAYMENT_METHODS.filter((m) => m.kind === "BANK").reduce((byName, m) => {
      // "the bank BANK — ZMW ACCOUNT" groups under "the bank BANK".
      const bank = m.label.split(" — ")[0]!;
      const existing = byName.get(bank) ?? {
        bank,
        accountName: m.accountName,
        accounts: [] as { currency: string; number: string }[],
      };
      existing.accounts.push({ currency: m.currency ?? "ZMW", number: m.number });
      byName.set(bank, existing);
      return byName;
    }, new Map<string, { bank: string; accountName: string; accounts: { currency: string; number: string }[] }>())
  ).map(([, value]) => value),
};

/**
 * Storage terms. Free for a week from arrival in Lusaka, then chargeable per day
 * per shipment — which is what stops the warehouse becoming free long-term
 * storage.
 */
/**
 * How cargo is counted, in the words that go on a manifest.
 *
 * "3 packages" and "20 pieces" describe different pallets. Forcing everything
 * into one unit makes the manifest disagree with what is physically there,
 * which is the document a customs officer reads.
 */
export const PACKAGE_TYPE_LABELS: Record<string, { one: string; many: string }> = {
  CARTON: { one: "carton", many: "cartons" },
  PIECE: { one: "piece", many: "pieces" },
  PACKAGE: { one: "package", many: "packages" },
  BAG: { one: "bag", many: "bags" },
  BOX: { one: "box", many: "boxes" },
  ENVELOPE: { one: "envelope", many: "envelopes" },
  OTHER: { one: "package", many: "packages" },
};

/**
 * e.g. "3 cartons", "1 piece". A count is never shown without its unit.
 *
 * The number stays outside the translation and the unit goes through it —
 * "3 纸箱" reads the same way round in both languages, and a dictionary keyed
 * by the finished sentence could never match a string carrying a count.
 */
export function formatPackages(count: number, type: string, locale: Locale = "en") {
  const label = PACKAGE_TYPE_LABELS[type] ?? PACKAGE_TYPE_LABELS.OTHER;
  return `${count} ${t(locale, count === 1 ? label.one : label.many)}`;
}

/** Short form for dense columns: "3 ctn", "20 pcs". Still never a bare number. */
export const PACKAGE_TYPE_SHORT: Record<string, string> = {
  CARTON: "ctn",
  PIECE: "pcs",
  PACKAGE: "pkg",
  BAG: "bag",
  BOX: "box",
  ENVELOPE: "env",
  OTHER: "unit",
};

export function formatPackagesShort(
  count: number,
  type: string,
  locale: Locale = "en"
) {
  return `${count} ${t(locale, PACKAGE_TYPE_SHORT[type] ?? PACKAGE_TYPE_SHORT.OTHER)}`;
}

/**
 * Invoice statuses that represent a real demand for money.
 *
 * A DRAFT is the system's working figure: nobody has reviewed it, the customer
 * has never seen it, and no one owes it. Every revenue total, follow-up queue and
 * customer-facing surface asks this question, so they all answer it the same
 * way — and a status added later is picked up everywhere at once.
 */
export const BILLED_INVOICE_STATUSES = [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
] as const satisfies readonly InvoiceStatus[];

export const STORAGE_POLICY = {
  freeDays: 7,
  perDayUsd: 2,
  currency: "USD",
  text: [
    "Storage is FREE for 7 days only.",
    "After 7 days, storage charges of USD 2 per day will apply for all cargo remaining in the warehouse.",
    "Customers are advised to collect their cargo on time to avoid additional storage charges.",
    "Thank you for choosing AITRANSIT Cargo.",
  ],
} as const;

/**
 * The storage terms in the reader's language, for an invoice or a pickup note.
 *
 * The English stays in `STORAGE_POLICY.text` because that is what the keys are;
 * this renders those same four lines for whoever is holding the document.
 */
export function storagePolicyText(locale: Locale = "en"): string[] {
  return STORAGE_POLICY.text.map((line) => t(locale, line));
}

/**
 * Chargeable storage days for a shipment sitting in the Lusaka warehouse.
 *
 * Counts from arrival, not from invoicing, and stops counting once the cargo
 * leaves — a delivered shipment cannot keep accruing storage.
 */
export function storageDaysFor(
  arrivedAt: Date | null,
  deliveredAt: Date | null,
  now: Date = new Date()
): number {
  if (!arrivedAt) return 0;
  const end = deliveredAt ?? now;
  const days = Math.floor((end.getTime() - arrivedAt.getTime()) / 86_400_000);
  return Math.max(0, days - STORAGE_POLICY.freeDays);
}

/** Everything true about one shipment's storage, in one object. */
export type StorageStatus = {
  /** Null until the cargo is actually checked in at Lusaka. */
  arrivedAt: Date | null;
  /** Whole days since it landed. 0 on the day it arrives. */
  daysInWarehouse: number;
  /** How many of the free days are left. 0 once they are used up. */
  freeDaysRemaining: number;
  /** Days being charged for. Zero while the free week is running. */
  chargeableDays: number;
  chargeUsd: number;
  perDayUsd: number;
  freeDays: number;
  /** The free week has run out and the meter is running. */
  expired: boolean;
  /** Today is the last day before charges begin — worth a phone call. */
  lastFreeDay: boolean;
  /** The clock has stopped because the customer collected it. */
  collected: boolean;
};

/**
 * The storage position of one consignment, for whoever is looking at it.
 *
 * One function, because the same four facts are shown to four different
 * readers and they must never disagree: the customer on the tracking page, the
 * notice on their invoice, the clerk about to take their money, and the
 * warning on a desk that should be ringing them. Working the days out
 * separately in four places is how a customer gets told six days on the phone
 * and billed for eight.
 *
 * The rule the owner set, and the only one that matters: the counter starts
 * when the cargo is marked arrived at Lusaka and stops the moment it is collected.
 * Cargo still in China or in the air has no storage position at all, so this
 * returns zeroes rather than a number somebody might print.
 */
export function storageStatus(
  arrivedAt: Date | null,
  deliveredAt: Date | null,
  now: Date = new Date()
): StorageStatus {
  const { freeDays, perDayUsd } = STORAGE_POLICY;
  if (!arrivedAt) {
    return {
      arrivedAt: null,
      daysInWarehouse: 0,
      freeDaysRemaining: freeDays,
      chargeableDays: 0,
      chargeUsd: 0,
      perDayUsd,
      freeDays,
      expired: false,
      lastFreeDay: false,
      collected: false,
    };
  }

  const end = deliveredAt ?? now;
  const daysInWarehouse = Math.max(
    0,
    Math.floor((end.getTime() - arrivedAt.getTime()) / 86_400_000)
  );
  const chargeableDays = Math.max(0, daysInWarehouse - freeDays);

  return {
    arrivedAt,
    daysInWarehouse,
    freeDaysRemaining: Math.max(0, freeDays - daysInWarehouse),
    chargeableDays,
    chargeUsd: chargeableDays * perDayUsd,
    perDayUsd,
    freeDays,
    expired: chargeableDays > 0,
    /* The day the free week runs out, which is the day to ring somebody. */
    lastFreeDay: deliveredAt === null && daysInWarehouse === freeDays,
    collected: deliveredAt !== null,
  };
}

/**
 * The storage notice for an invoice or a pickup note.
 *
 * Two sentences rather than the four-line policy block above: an invoice is
 * read in a hurry, and what a customer needs is when the free week ends and
 * what it costs afterwards. The owner's rule is that nobody is ever surprised
 * by a storage fee.
 */
export function storageNotice(): {
  en: { heading: string; body: string };
} {
  const { freeDays, perDayUsd } = STORAGE_POLICY;
  /*
    ONE LANGUAGE, and that is a change from what this function used to be.

    Target Express printed this notice in Kiswahili and English side by side,
    because the customer holding the document read Kiswahili and the English was
    for the file. AITRANSIT bills into Lusaka, where the counter, the invoice and
    the WhatsApp message are all in English — so a second language here would be
    a translation nobody asked for, on a document that must be unambiguous about
    money.

    The two numbers still come from STORAGE_POLICY above, so the free days and
    the daily rate cannot drift from what the storage clock actually charges.
  */
  return {
    en: {
      heading: "WAREHOUSE STORAGE POLICY",
      body:
        `Due to the high volume of cargo in our warehouse, your cargo will be ` +
        `stored free of charge for ${freeDays} days from the date it is checked ` +
        `in at our Lusaka warehouse. After ${freeDays} days, a USD ${perDayUsd} ` +
        `per day Storage Fee will apply. Please collect your cargo early to ` +
        `avoid additional Storage Fees.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Roles & departments
// ---------------------------------------------------------------------------

export const ROLE_LABELS: Record<Role, string> = {
  /* One management chair. See ROLE_PERMISSIONS in lib/rbac.ts — AITRANSIT
     folded the old manager role into this one, so this label has to read as
     both the owner and the person running the day. */
  ADMIN: "Admin",
  CHINA_WAREHOUSE: "China Warehouse",
  ZAMBIA_WAREHOUSE: "Zambia Warehouse",
  FINANCE: "Finance",
  CUSTOMER_CARE: "Customer Support",
  CUSTOMER: "Customer",
};

export const DEPARTMENT_LABELS: Record<Department, string> = {
  MANAGEMENT: "Management",
  CHINA_WAREHOUSE: "China Warehouse",
  ZAMBIA_WAREHOUSE: "Zambia Warehouse (Lusaka)",
  FINANCE: "Finance",
  CUSTOMER_CARE: "Customer Support",
  CUSTOMER: "Customer",
};

/** The department a role belongs to by default when an admin creates a user. */
export const ROLE_DEFAULT_DEPARTMENT: Record<Role, Department> = {
  ADMIN: "MANAGEMENT",
  CHINA_WAREHOUSE: "CHINA_WAREHOUSE",
  ZAMBIA_WAREHOUSE: "ZAMBIA_WAREHOUSE",
  FINANCE: "FINANCE",
  CUSTOMER_CARE: "CUSTOMER_CARE",
  /* Not a department of the company. A portal account is filed here so every
     staff list, rota and payroll query that reads by department skips customers
     without having to know about the role enum. */
  CUSTOMER: "CUSTOMER",
};

// ---------------------------------------------------------------------------
// Shipment status
// ---------------------------------------------------------------------------

type StatusMeta = {
  label: string;
  /** What the customer is told. Never mentions staff or internal process. */
  publicLabel: string;
  publicLocation: string;
  description: string;
  /** Badge variant from components/ui/badge. */
  tone: "muted" | "info" | "warning" | "success" | "brand" | "destructive";
  /** Which department is accountable for moving it forward. */
  owner: string;
};

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  // Named READY_TO_DEPART in the database for historical reasons, but the words
  // shown to staff say where the cargo actually is. "Ready to depart" was wrong
  // twice over: the cargo is not going anywhere until its batch is sealed, and
  // the batch has its own status of the same name meaning something else.
  READY_TO_DEPART: {
    label: "Waiting for next flight",
    publicLabel: "Received in China",
    publicLocation: "China warehouse",
    description:
      "Registered and labelled in China, waiting for the next flight out.",
    tone: "muted",
    owner: "China Warehouse",
  },
  IN_TRANSIT: {
    label: "In transit",
    publicLabel: "In transit",
    publicLocation: "China → Zambia",
    description: "Departed China on a confirmed flight.",
    tone: "info",
    owner: "China Warehouse",
  },
  /* The specification names two stages here — "Arrived in Zambia" and "Checked
     In at Zambia Warehouse" — and they are one database status on purpose. A
     box is "arrived" when its BATCH lands, which is BatchStatus.ARRIVED, and it
     becomes this the moment the Lusaka floor ticks it off the manifest. Making
     them two shipment statuses would let a consignment claim to be checked in
     while its batch was still on the apron, which is the one thing the
     warehouse must never assert. The public wording keeps both words. */
  RECEIVED_AT_ZAMBIA: {
    label: "Checked in at Zambia warehouse",
    publicLabel: "Checked in at Lusaka",
    publicLocation: "Lusaka warehouse",
    description: "Landed and checked in against the batch manifest.",
    tone: "warning",
    owner: "Lusaka Warehouse",
  },
  READY_FOR_PICKUP: {
    label: "Ready for pickup",
    publicLabel: "Ready for pickup",
    publicLocation: "Lusaka warehouse",
    description: "Payment confirmed. Pickup note issued.",
    tone: "brand",
    owner: "Finance",
  },
  UNDER_INVESTIGATION: {
    label: "Under investigation",
    publicLabel: "Under investigation",
    publicLocation: "Lusaka",
    // Said to the customer without alarming them and without promising a
    // recovery nobody has made yet.
    description: "Reported missing or unlocatable. Being searched for.",
    tone: "warning",
    owner: "Lusaka warehouse",
  },
  DELIVERED: {
    label: "Delivered",
    publicLabel: "Delivered",
    publicLocation: "Collected by customer",
    description: "Released to the customer against a valid pickup note.",
    tone: "success",
    owner: "Lusaka Warehouse",
  },
  CANCELLED: {
    label: "Cancelled",
    publicLabel: "Cancelled",
    publicLocation: "—",
    description: "Voided by management. No longer in the operational flow.",
    tone: "destructive",
    owner: "CEO / Admin",
  },
};

/** The happy path, in order. Used for progress bars and timelines. */
export const SHIPMENT_FLOW: ShipmentStatus[] = [
  "READY_TO_DEPART",
  "IN_TRANSIT",
  "RECEIVED_AT_ZAMBIA",
  "READY_FOR_PICKUP",
  "DELIVERED",
];

export const BATCH_STATUS_META: Record<
  BatchStatus,
  { label: string; tone: StatusMeta["tone"] }
> = {
  OPEN: { label: "Open — loading", tone: "muted" },
  // A full batch is closed to new cargo but has not been sealed for the flight
  // yet — the next shipment for its route opens a fresh batch automatically.
  FULL: { label: "Full — no more cargo", tone: "warning" },
  READY_TO_DEPART: { label: "Sealed — ready to depart", tone: "warning" },
  IN_TRANSIT: { label: "In transit", tone: "info" },
  ARRIVED: { label: "Arrived — awaiting check", tone: "warning" },
  VERIFIED: { label: "Verified", tone: "success" },
  CLOSED: { label: "Closed", tone: "muted" },
};

// ---------------------------------------------------------------------------
// Dropdown option lists
// ---------------------------------------------------------------------------

export const ORIGIN_LABELS: Record<Origin, string> = {
  GUANGZHOU: "Guangzhou",
  HONG_KONG: "Hong Kong",
};

export const GOODS_TYPE_LABELS: Record<GoodsType, string> = {
  GENERAL_MERCHANDISE: "General merchandise",
  ELECTRONICS: "Electronics",
  PHONE_ACCESSORIES: "Phone accessories",
  TEXTILES_GARMENTS: "Textiles & garments",
  FOOTWEAR: "Footwear",
  COSMETICS: "Cosmetics",
  MACHINERY_PARTS: "Machinery parts",
  AUTO_SPARES: "Auto spares",
  FURNITURE_FITTINGS: "Furniture & fittings",
  MEDICAL_SUPPLIES: "Medical supplies",
  STATIONERY: "Stationery",
  OTHER: "Other",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Cash",
  MOBILE_MONEY: "Mobile money",
  BANK_TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionType, string> = {
  MISSING_SHIPMENT: "Missing cargo",
  DAMAGED_CARGO: "Damaged cargo",
  WEIGHT_MISMATCH: "Weight mismatch",
  PACKAGE_COUNT_MISMATCH: "Package count mismatch",
  WRONG_BATCH: "Wrong batch",
  WRONG_ITEM: "Wrong item",
  HOLD_FOR_INVESTIGATION: "Hold for investigation",
  OTHER: "Other",
};

/**
 * Two states, whatever the column holds.
 *
 * The owner's rule: a case is being worked, or it is finished. The enum still
 * carries the older values because rows exist with them and rewriting history
 * to tidy a label is not a trade worth making — but nothing new is written to
 * them, and none of them earns its own word on screen. A queue that
 * distinguishes "open" from "under investigation" is asking the floor to
 * maintain a distinction that changes nothing about the cargo.
 */
export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatus, string> = {
  OPEN: "Under investigation",
  UNDER_INVESTIGATION: "Under investigation",
  WAITING_CUSTOMER: "Under investigation",
  COMPENSATION_APPROVED: "Under investigation",
  REPLACEMENT_APPROVED: "Under investigation",
  CARGO_FOUND: "Resolved",
  CLOSED: "Resolved",
  RESOLVED: "Resolved",
  WRITTEN_OFF: "Resolved",
};

/**
 * Work that is sitting on somebody, as a WHERE clause rather than a count.
 *
 * Three modules were each carrying their own copy of these two filters — the
 * collections overview, the owner's attention list and the approvals board —
 * and all three returned the same numbers, so nothing was visibly wrong. What
 * was wrong is that redefining "pending" would have moved two of the three and
 * left the reader comparing a board against a dashboard that no longer agreed,
 * with no error anywhere to say so.
 *
 * Shared as the FILTER and not as a function on purpose. Those three modules
 * sit at different depths and already import each other in one direction; a
 * shared async count would have added the edge that closes the cycle. A clause
 * in the leaf module every one of them already imports cannot.
 */
export const PENDING_SUBMISSION = { status: "PENDING" } as const;

/** A price Finance has not signed off, so nobody can be asked to pay it. */
export const DRAFT_INVOICE = { status: "DRAFT" } as const;

/**
 * A case nobody has finished with. The queue, the dashboard counts and the
 * public "Under Investigation" line all key off this one list, so a new
 * lifecycle value is live everywhere the moment it is added here.
 */
export const EXCEPTION_OPEN_STATUSES = [
  "OPEN",
  "UNDER_INVESTIGATION",
  "WAITING_CUSTOMER",
  "COMPENSATION_APPROVED",
  "REPLACEMENT_APPROVED",
] as const satisfies readonly ExceptionStatus[];

/**
 * Finished. CARGO_FOUND is terminal because the box is back on the shelf and
 * the cargo returns to its normal operational status; RESOLVED and WRITTEN_OFF
 * are the pre-lifecycle values, kept so old rows still read correctly and never
 * written by new code.
 */
export const EXCEPTION_TERMINAL_STATUSES = [
  "CARGO_FOUND",
  "CLOSED",
  "RESOLVED",
  "WRITTEN_OFF",
] as const satisfies readonly ExceptionStatus[];

/**
 * Statuses that mean the cargo must not be handed over, whatever the shipment
 * record says. The pickup counter and the public tracking page both ask this
 * question, and they must never disagree — the owner's rule is that a customer
 * never sees "Ready for Pickup" for cargo that is missing or unavailable.
 */
export function blocksPickup(status: ExceptionStatus) {
  return (EXCEPTION_OPEN_STATUSES as readonly ExceptionStatus[]).includes(status);
}

/**
 * What happened, in the words the desk uses.
 *
 * Cargo Found is the only outcome whose note is optional — "we found it" is a
 * complete answer. Every other outcome closes a case that cost somebody
 * something, and those must say how it was settled.
 */
export const RESOLUTION_TYPE_LABELS: Record<ResolutionType, string> = {
  CARGO_FOUND: "Cargo found",
  WEIGHT_CORRECTED: "Weight corrected",
  DAMAGE_SETTLED: "Damaged cargo settled",
  CARGO_LOST: "Cargo lost",
  OTHER: "Other",
};

/** Outcomes that cannot be filed without an explanation. */
export const RESOLUTION_NOTE_REQUIRED: readonly ResolutionType[] = [
  "WEIGHT_CORRECTED",
  "DAMAGE_SETTLED",
  "CARGO_LOST",
  "OTHER",
];

export const DAMAGE_SEVERITY_LABELS: Record<DamageSeverity, string> = {
  MINOR: "Minor",
  MODERATE: "Moderate",
  SEVERE: "Severe",
  TOTAL_LOSS: "Total loss",
};

/** Common airlines on the China → Zambia corridor, offered as suggestions. */
export const AIRLINE_SUGGESTIONS = [
  "Ethiopian Airlines",
  "Emirates SkyCargo",
  "Qatar Airways Cargo",
  "Kenya Airways Cargo",
  "Turkish Cargo",
  "China Southern Cargo",
  "Air Zambia",
] as const;

/** Cargo descriptions the China desk reuses constantly. */
export const DESCRIPTION_SUGGESTIONS = [
  "Assorted general goods",
  "Mobile phone accessories",
  "Ladies' clothing",
  "Men's clothing",
  "Shoes / sneakers",
  "Human hair & beauty products",
  "Kitchenware",
  "Motorcycle spare parts",
  "LED lighting",
  "Solar equipment",
] as const;

export const ZM_CITIES = [
  "Lusaka",
  "Kitwe",
  "Ndola",
  "Kabwe",
  "Chingola",
  "Mufulira",
  "Livingstone",
  "Luanshya",
  "Kasama",
  "Chipata",
  "Solwezi",
  "Choma",
] as const;

/**
 * A label map as dropdown options, in the reader's language.
 *
 * The value is the enum and never moves; only the label is translated, so a
 * Chinese desk picking "手机配件" still submits PHONE_ACCESSORIES.
 */
export function enumOptions<T extends string>(
  labels: Record<T, string>,
  locale: Locale = "en"
): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: t(locale, labels[value]),
  }));
}
