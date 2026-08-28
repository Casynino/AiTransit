import "server-only";

import { CATEGORY_LABELS } from "@/lib/cargo";
import { COMPANY, PAYMENT_METHODS, type CollectionAccount } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/**
 * Company details the owner can change without a deploy.
 *
 * The code constants remain the truth until somebody overrides them. That is
 * deliberate and not laziness: an empty settings table must render exactly what
 * the app has always rendered, because the failure mode of the alternative is a
 * missing row blanking the payment accounts on an invoice — and an invoice with
 * no accounts on it is worse than no invoice.
 *
 * So every getter here answers from the database when a row exists and from
 * lib/constants.ts when it does not, and never returns nothing.
 */

export type CompanyContact = {
  phone: string;
  phoneAlt: string;
  whatsapp: string;
  email: string;
};

export type OfficeAddress = {
  city: string;
  country: string;
  flag: string;
  /** Written the way it goes on an envelope. */
  lines: string[];
};

export type CompanySettings = {
  accounts: CollectionAccount[];
  contact: CompanyContact;
  zambia: OfficeAddress;
  china: OfficeAddress;
  /**
   * What the higher-rate cargo bucket is CALLED.
   *
   * The enum value LIQUID_SPECIAL never moves — every priced invoice, every
   * pricing rule and every batch-route check is written against it. Only the
   * words on screen change, because the business has not finished deciding what
   * to call it and the specification says so explicitly.
   *
   * Kept here rather than as a hardcoded label so a rename is a settings edit
   * rather than a deploy, and so it cannot orphan a single existing invoice.
   */
  specialCategoryName: string;
};

/** What the code ships with. Also the shape the editor writes back. */
export function defaultSettings(): CompanySettings {
  const zambia = COMPANY.offices[0];
  return {
    accounts: PAYMENT_METHODS.map((account) => ({ ...account })),
    specialCategoryName: CATEGORY_LABELS.LIQUID_SPECIAL,
    contact: {
      phone: COMPANY.phone,
      phoneAlt: COMPANY.phoneAlt,
      whatsapp: COMPANY.whatsapp,
      email: COMPANY.email,
    },
    zambia: {
      city: zambia.city,
      country: zambia.country,
      flag: zambia.flag,
      lines: [...zambia.lines],
    },
    china: {
      city: COMPANY.chinaOffice.city,
      country: COMPANY.chinaOffice.country,
      flag: COMPANY.chinaOffice.flag,
      lines: [...COMPANY.chinaOffice.lines],
    },
  };
}

/**
 * The settings in force right now.
 *
 * A stored row wins over the constant, field by field — a half-filled row
 * cannot blank the rest. Anything unparseable is ignored rather than thrown:
 * a malformed settings row must not take down the invoice that reads it.
 */
export async function companySettings(): Promise<CompanySettings> {
  const base = defaultSettings();

  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await prisma.companySetting.findMany({
      select: { key: true, value: true },
    });
  } catch {
    return base;
  }

  const stored = new Map(rows.map((row) => [row.key, row.value]));

  const accounts = stored.get("accounts");
  if (Array.isArray(accounts) && accounts.length > 0) {
    base.accounts = accounts as CollectionAccount[];
  }

  const contact = stored.get("contact");
  if (contact && typeof contact === "object") {
    base.contact = { ...base.contact, ...(contact as Partial<CompanyContact>) };
  }

  const special = stored.get("specialCategoryName");
  if (typeof special === "string" && special.trim().length > 0) {
    base.specialCategoryName = special.trim();
  }

  for (const key of ["zambia", "china"] as const) {
    const office = stored.get(key);
    if (office && typeof office === "object") {
      base[key] = { ...base[key], ...(office as Partial<OfficeAddress>) };
    }
  }

  return base;
}

/**
 * The accounts to print on one invoice.
 *
 * An invoice is a legal document: the account a customer paid into has to be
 * reproducible FROM THAT INVOICE, not from a settings table somebody edited
 * afterwards. So each invoice keeps a copy of what it was issued with, and
 * this reads that copy whenever it exists.
 *
 * Invoices raised before snapshots existed have none. They fall back to the
 * code constants — which is exactly what they were printed with, so the
 * fallback is not a guess.
 */
export function accountsForInvoice(
  snapshot: unknown
): CollectionAccount[] {
  if (Array.isArray(snapshot) && snapshot.length > 0) {
    return snapshot as CollectionAccount[];
  }
  return PAYMENT_METHODS.map((account) => ({ ...account }));
}

/**
 * The higher-rate category's name, for a screen that has to print it.
 *
 * Falls back to the code label when nothing is stored, so an empty settings
 * table renders exactly what the app has always rendered — the same discipline
 * every other getter here follows.
 */
export async function specialCategoryLabel(): Promise<string> {
  return (await companySettings()).specialCategoryName;
}
