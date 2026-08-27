import type { AccountKind } from "@prisma/client";

/**
 * The company's own accounts, as plain data.
 *
 * SEPARATE FROM lib/accounts.ts, and the reason is mechanical rather than
 * architectural: that module is `server-only`, because it queries the database,
 * and `server-only` throws the moment anything outside a React Server Component
 * imports it — including `prisma/seed.ts`, which is an ordinary Node script.
 *
 * The list is needed by both, so it lives here where either can read it, and
 * lib/accounts.ts re-exports it so existing imports keep working. One source of
 * truth, two ways in.
 */
/**
 * AITRANSIT's own accounts.
 *
 * These are the accounts the business RECONCILES against — a table, because a
 * balance is a running total over rows. PAYMENT_METHODS in lib/constants.ts is
 * the other master: what a customer was TOLD to pay into, which has to stay
 * reproducible from the invoice that told them. Same accounts, two masters, on
 * purpose — see the note on model CompanyAccount.
 *
 * `code` is the stable identity. Display names, sort order and even account
 * numbers may be corrected; the code is what seeds, backfills and any future
 * import address an account by, and it never changes.
 *
 * ACCOUNT NUMBERS ARE LEFT NULL, and that is not an oversight. AITRANSIT's real
 * bank and mobile-money numbers are not in this repository. An account can be
 * opened, reconciled and reported on without one — the number is only needed to
 * match a bank slip by eye — whereas a made-up number would look authoritative
 * on a reconciliation screen. Admin fills them in under Company settings.
 *
 * The shape follows the specification's account list: office cash in each
 * currency, a bank account in each currency, and mobile money. Two currencies
 * throughout, because AITRANSIT prices in USD and collects in kwacha, and an
 * account holding both would have a balance in no unit at all.
 */
export const ACCOUNT_SEED: {
  code: string;
  name: string;
  kind: AccountKind;
  currency: string;
  institution: string | null;
  accountNumber: string | null;
  accountName: string | null;
  sortOrder: number;
}[] = [
  {
    code: "CASH_OFFICE_USD",
    name: "Office cash (USD)",
    kind: "CASH",
    currency: "USD",
    institution: null,
    accountNumber: null,
    accountName: null,
    sortOrder: 10,
  },
  {
    code: "CASH_OFFICE_ZMW",
    name: "Office cash (ZMW)",
    kind: "CASH",
    currency: "ZMW",
    institution: null,
    accountNumber: null,
    accountName: null,
    sortOrder: 20,
  },
  {
    code: "BANK_USD",
    name: "Bank account (USD)",
    kind: "BANK",
    currency: "USD",
    institution: null,
    accountNumber: null,
    accountName: "AITRANSIT CARGO",
    sortOrder: 30,
  },
  {
    code: "BANK_ZMW",
    name: "Bank account (ZMW)",
    kind: "BANK",
    currency: "ZMW",
    institution: null,
    accountNumber: null,
    accountName: "AITRANSIT CARGO",
    sortOrder: 40,
  },
  {
    code: "MOBILE_MONEY",
    name: "Mobile money (ZMW)",
    kind: "MOBILE_MONEY",
    currency: "ZMW",
    institution: null,
    accountNumber: null,
    accountName: "AITRANSIT CARGO",
    sortOrder: 50,
  },
];
