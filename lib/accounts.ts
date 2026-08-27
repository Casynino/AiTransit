import "server-only";

import type { AccountKind } from "@prisma/client";
import type { PaymentMethod } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/*
  The account list itself lives in lib/account-seed.ts — see the note there.
  Re-exported so every existing `import { ACCOUNT_SEED } from "@/lib/accounts"`
  keeps working, and so there is still only one place the accounts are written.
*/
export { ACCOUNT_SEED } from "@/lib/account-seed";


/**
 * Which accounts a payment method could plausibly have landed in.
 *
 * Used to order and filter the picker, never to decide on the clerk's behalf —
 * a wrong account chosen automatically is worse than none at all, because it
 * looks reconciled.
 */
export const METHOD_ACCOUNT_KINDS: Record<PaymentMethod, AccountKind[]> = {
  CASH: ["CASH"],
  MOBILE_MONEY: ["MOBILE_MONEY"],
  // A cheque is deposited into a bank account; it never lands anywhere else.
  CHEQUE: ["BANK"],
  BANK_TRANSFER: ["BANK"],
};

export type AccountOption = {
  id: string;
  code: string;
  name: string;
  kind: AccountKind;
  currency: string;
  accountNumber: string | null;
};

/** The accounts a desk may attribute money to, in display order. */
export async function activeAccounts(): Promise<AccountOption[]> {
  return prisma.companyAccount.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      kind: true,
      currency: true,
      accountNumber: true,
    },
  });
}
