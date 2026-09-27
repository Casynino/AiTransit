import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Clock,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";

import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";
import { formatKwacha, formatUsd } from "@/lib/money";

/**
 * The income register — what came in, into which account, and who still owes.
 *
 * WHY THIS IS NOT A TABLE. The old page listed a hundred payments flat, newest
 * first, and a finance clerk reconciling a bank statement had to count rows to
 * work out what a day took. Grouped under a day header with that day's total,
 * the same list answers the question the clerk actually came with — "what did
 * Thursday bring in" — without them adding anything up.
 *
 * TWO BASES ON ONE PAGE, SAID OUT LOUD. The headline is money RECEIVED. The
 * four cards under it are what was BILLED. They are different numbers on
 * purpose and the gap between them is the business's cash position, which is
 * why the "to collect" rail states in words that billing is not income until
 * the money arrives.
 */

/* --------------------------------------------------------------- the top */

export function IncomeHeadline({
  locale,
  usd,
  count,
  rate,
  accounts,
}: {
  locale: Locale;
  usd: number;
  count: number;
  rate: number | null;
  accounts: {
    id: string | null;
    name: string;
    currency?: string | null;
    usd: number;
    count: number;
  }[];
}) {
  return (
    <section className="panel flex flex-wrap items-start justify-between gap-6 p-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t(locale, "Income received")}
        </p>
        <p className="mt-2 font-mono text-4xl font-bold tabular tracking-tight">
          {formatKwacha(usd, rate)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {rate === null ? null : <>{formatUsd(usd)} · </>}
          {count} {t(locale, count === 1 ? "payment" : "payments")} ·{" "}
          {t(locale, "reversed ones taken off")}
        </p>
      </div>

      {/*
        WHERE IT LANDED, as chips rather than a second table.

        The one question a clerk cannot answer from the total alone is which
        account holds it, and it is the question a bank reconciliation starts
        with. "No account named" is in the list deliberately and is not styled
        as an error — it is a real bucket that somebody has to go and empty.
      */}
      {accounts.length > 0 ? (
        <div className="flex max-w-xl flex-wrap justify-end gap-2">
          {accounts.map((a) => (
            <span
              key={a.id ?? "none"}
              className={`rounded-full border px-3 py-1.5 text-xs ${
                a.id ? "bg-card" : "border-warning/40 bg-warning/5"
              }`}
            >
              <span className="font-medium">{a.name}</span>
              {/* Only when the name does not already carry it. Several accounts
                  are named "Mobile money (ZMW)", which read "(ZMW) (ZMW)". */}
              {a.currency && !a.name.includes(a.currency) ? (
                <span className="text-muted-foreground"> ({a.currency})</span>
              ) : null}
              <span className="ml-1.5 font-mono tabular text-muted-foreground">
                {formatKwacha(a.usd, rate)}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------- the split */

export function BilledCards({
  locale,
  rate,
  freightUsd,
  storageUsd,
  otherUsd,
  tenderedUsd,
  tenderedCount,
  totalCount,
}: {
  locale: Locale;
  rate: number | null;
  freightUsd: number;
  storageUsd: number;
  otherUsd: number;
  tenderedUsd: number;
  tenderedCount: number;
  totalCount: number;
}) {
  const cards = [
    {
      icon: Package,
      label: "Freight billed",
      usd: freightUsd,
      hint: "What the rate book charged to fly it",
    },
    {
      icon: Clock,
      label: "Storage billed",
      usd: storageUsd,
      hint: "Days past the free week, at the daily rate",
    },
    {
      icon: Boxes,
      label: "Other charges billed",
      usd: otherUsd,
      hint: "Anything added to a bill by hand",
    },
    {
      icon: Wallet,
      label: "Handed over in kwacha",
      usd: tenderedUsd,
      hint:
        totalCount > 0
          ? `${tenderedCount} ${t(locale, "of")} ${totalCount} ${t(locale, totalCount === 1 ? "payment" : "payments")} · ${t(locale, "the rest came in dollars")}`
          : "What customers actually handed over",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="panel p-5">
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <c.icon className="h-4 w-4" />
            {t(locale, c.label)}
          </p>
          <p className="mt-2 font-mono text-xl font-semibold tabular">
            {formatKwacha(c.usd, rate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t(locale, c.hint)}</p>
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------- the register */

type PaymentRow = {
  id: string;
  amount: unknown;
  currency: string;
  creditedAmount: unknown;
  method: string;
  reference: string | null;
  paidAt: Date;
  account: { name: string; currency: string; accountNumber: string | null } | null;
  receivedBy: { name: string } | null;
  receipt: { receiptNumber: string } | null;
  invoice: {
    invoiceNumber: string;
    customer: { name: string };
    shipment: { trackingNumber: string };
  };
};

export function IncomeDays({
  locale,
  days,
  rate,
}: {
  locale: Locale;
  days: { date: Date; rows: PaymentRow[]; usd: number }[];
  rate: number | null;
}) {
  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.date.toISOString()} className="panel overflow-hidden">
          {/*
            The day header carries the day's TOTAL, which is the whole reason
            for grouping. A clerk checking Thursday against a bank statement
            reads one number instead of adding thirty-five.
          */}
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3">
            <p className="font-semibold">
              {formatDate(day.date, locale)}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {day.rows.length}{" "}
                {t(locale, day.rows.length === 1 ? "payment" : "payments")}
              </span>
            </p>
            <p className="font-mono text-sm font-semibold tabular text-success">
              {formatKwacha(day.usd, rate)}
            </p>
          </header>

          <ul>
            {day.rows.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-3 last:border-b-0"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Package className="h-4 w-4" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">
                      {p.invoice.customer.name}
                    </span>
                    <Link
                      href={`/app/cargo/${p.invoice.shipment.trackingNumber}`}
                      className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs tabular hover:text-brand"
                    >
                      {p.invoice.shipment.trackingNumber}
                    </Link>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {p.paidAt.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {p.receipt ? ` · ${p.receipt.receiptNumber}` : ""}
                    {` · ${p.invoice.invoiceNumber}`}
                    {p.receivedBy ? ` · ${t(locale, "by")} ${p.receivedBy.name}` : ""}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium">
                    {p.account?.name ?? (
                      <span className="text-warning">
                        {t(locale, "No account named")}
                      </span>
                    )}
                  </p>
                  {p.account?.accountNumber ? (
                    <p className="font-mono text-[0.7rem] tabular text-muted-foreground">
                      {p.account.accountNumber}
                    </p>
                  ) : null}
                </div>

                <Link
                  href={`/app/finance/payments/${p.id}`}
                  className="focus-ring shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                >
                  {t(locale, "Open")}
                </Link>

                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold tabular">
                    {formatMoney(toNumber(p.amount as never), p.currency)}
                  </p>
                  {/*
                    The method, unless the account already says it. Several
                    accounts are named after the rail money arrives on — "Mobile
                    money (ZMW)" — so this printed the same words twice, one
                    above the other, on every row.
                  */}
                  {(() => {
                    const method = t(
                      locale,
                      (PAYMENT_METHOD_LABELS as Record<string, string>)[p.method] ??
                        p.method
                    );
                    if (p.account?.name.toLowerCase().includes(method.toLowerCase()))
                      return null;
                    return (
                      <p className="text-[0.7rem] text-muted-foreground">{method}</p>
                    );
                  })()}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- the debt */

export function ToCollect({
  locale,
  rate,
  owingUsd,
  count,
  rows,
}: {
  locale: Locale;
  rate: number | null;
  owingUsd: number;
  count: number;
  rows: {
    id: string;
    invoiceNumber: string;
    owingUsd: number;
    dueDate: Date | null;
    creditStatus: string;
    customer: { name: string };
    shipment: { id: string; trackingNumber: string };
  }[];
}) {
  const now = new Date();

  return (
    <aside className="panel border-warning/30 p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-warning">
        <Receipt className="h-4 w-4" />
        {t(locale, "To collect")}
      </p>
      <p className="mt-2 font-mono text-2xl font-bold tabular">
        {formatKwacha(owingUsd, rate)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {count} {t(locale, count === 1 ? "invoice" : "invoices")} ·{" "}
        {t(locale, "billed and not paid")}
      </p>
      {/*
        THE SENTENCE THAT KEEPS THE PAGE HONEST. Everything above this rail is
        money that arrived; everything in it is money that has not. Without
        saying so, a reader adds the two and reports revenue twice.
      */}
      <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {t(
          locale,
          "It becomes income only when the money is actually received."
        )}
      </p>

      <ul className="mt-4 space-y-2">
        {rows.map((r) => {
          const overdue = r.dueDate ? r.dueDate < now : false;
          return (
            <li key={r.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.customer.name}</p>
                  <p className="font-mono text-xs tabular text-muted-foreground">
                    {r.shipment.trackingNumber}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold tabular">
                  {formatKwacha(r.owingUsd, rate)}
                </p>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {r.creditStatus === "APPROVED" ? (
                  <span className="text-[0.7rem] text-muted-foreground">
                    {t(locale, "On credit")}
                    {r.dueDate
                      ? ` · ${t(locale, overdue ? "overdue since" : "due")} ${formatDate(r.dueDate, locale)}`
                      : ""}
                  </span>
                ) : (
                  <span
                    className={`text-[0.7rem] ${overdue ? "font-medium text-signal" : "text-muted-foreground"}`}
                  >
                    {r.dueDate
                      ? `${t(locale, overdue ? "Overdue since" : "Due")} ${formatDate(r.dueDate, locale)}`
                      : t(locale, "Not yet due")}
                  </span>
                )}
                <Link
                  href={`/app/cargo/${r.shipment.trackingNumber}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  {t(locale, "Take payment")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {count > rows.length ? (
        <Link
          href="/app/collections/follow-up"
          className="focus-ring mt-3 block rounded-lg border py-2 text-center text-xs font-medium hover:bg-accent"
        >
          {t(locale, "Show all")} {count}
        </Link>
      ) : null}
    </aside>
  );
}
