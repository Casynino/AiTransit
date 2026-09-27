import Link from "next/link";
import type { Metadata } from "next";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/app/empty-state";
import { FinanceNav } from "@/components/app/finance-nav";
import {
  BilledCards,
  IncomeDays,
  IncomeHeadline,
  ToCollect,
} from "@/components/app/income-register";
import { PageHeader } from "@/components/app/page-header";
import { Input } from "@/components/ui/input";
import { financeTabs } from "@/lib/finance-tabs";
import { currentRateValue } from "@/lib/fx";
import { t } from "@/lib/i18n";
import {
  billedInWindow,
  groupByDay,
  incomeRegister,
  toCollect,
  type Period,
} from "@/lib/income-register";
import { requirePermission } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t(await viewerLocale(), "Income") };
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "year", label: "This year" },
];

/**
 * Everything received, and everything still owed.
 *
 * WHAT THIS REPLACED. The page was a flat list of the last hundred payments,
 * newest first, above four tiles. A finance clerk reconciling a bank statement
 * had to count rows to work out what a day took, had no way to look at any
 * window except "this month", and could not see which account held the money
 * without opening each payment.
 *
 * So the page is now built around the three questions that are actually asked
 * of it: how much came in over a period, which account it landed in, and who
 * still owes. The register underneath is grouped by day with each day's total
 * on its header, which is the form a bank statement is checked against.
 *
 * TWO BASES, NEVER ADDED TOGETHER. The headline is money RECEIVED. The four
 * cards below it are what was BILLED in the same window, which is a different
 * and usually larger number. The gap between them is the business's cash
 * position — it is the point of the page — and the "to collect" rail says in
 * words that billing is not income until the money arrives, because a reader
 * who adds the two reports revenue twice.
 */
export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    q?: string;
  }>;
}) {
  const user = await requirePermission("payment.record");
  const locale = await viewerLocale();
  const sp = await searchParams;

  /* A from/to pair means a custom range whether or not anybody pressed a chip,
     so somebody who types two dates and hits Show gets what they asked for. */
  const period: Period = (
    sp.from || sp.to
      ? "custom"
      : PERIODS.some((p) => p.key === sp.period)
        ? sp.period
        : "all"
  ) as Period;

  const filters = { period, from: sp.from, to: sp.to, q: sp.q };

  const [register, billed, owed, rate] = await Promise.all([
    incomeRegister(filters),
    billedInWindow(filters),
    toCollect(6),
    currentRateValue(),
  ]);

  const days = groupByDay(register.payments);

  /* Carried on every chip so a search is not silently dropped when somebody
     changes the period, and vice versa. */
  const keep = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { period: sp.period, from: sp.from, to: sp.to, q: sp.q, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHeader
        title="Income"
        description="Every payment received from customers, and the account it landed in. Cargo is what this business sells, so this is the freight and storage its customers paid for."
      />

      <FinanceNav tabs={financeTabs(user.role)} />

      {/* ── the window ──────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display font-semibold">
          {t(locale, "Everything received")}
        </h2>

        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => {
            const on = period === p.key;
            return (
              <Link
                key={p.key}
                href={keep({ period: p.key, from: undefined, to: undefined })}
                className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  on ? "border-brand bg-brand text-brand-foreground" : "hover:bg-accent"
                }`}
              >
                {t(locale, p.label)}
              </Link>
            );
          })}
        </div>

        {/* A custom range, as a plain GET form — no state, and it survives a
            reload and a shared link. */}
        {/* flex-wrap, or the Show button sails off the right edge of a phone. */}
        <form method="get" className="flex flex-wrap items-center gap-1.5">
          {sp.q ? <input type="hidden" name="q" value={sp.q} /> : null}
          <Input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            aria-label={t(locale, "From")}
            className="h-9 w-[9.5rem] text-xs"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            aria-label={t(locale, "To")}
            className="h-9 w-[9.5rem] text-xs"
          />
          <button
            type="submit"
            className="focus-ring rounded-md border bg-card px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            {t(locale, "Show")}
          </button>
        </form>
      </div>

      <IncomeHeadline
        locale={locale}
        usd={register.receivedUsd}
        count={register.count}
        rate={rate}
        accounts={register.accounts}
      />

      <div className="mt-4">
        <BilledCards
          locale={locale}
          rate={rate}
          freightUsd={billed.freightUsd}
          storageUsd={billed.storageUsd}
          otherUsd={billed.otherUsd}
          tenderedUsd={register.tenderedInKwachaUsd}
          tenderedCount={register.tenderedInKwachaCount}
          totalCount={register.count}
        />
      </div>

      {/* ── the register, and what is still out ─────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="min-w-0">
          <form method="get" className="mb-4 flex gap-2">
            {sp.period ? <input type="hidden" name="period" value={sp.period} /> : null}
            {sp.from ? <input type="hidden" name="from" value={sp.from} /> : null}
            {sp.to ? <input type="hidden" name="to" value={sp.to} /> : null}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder={t(
                  locale,
                  "Customer, tracking number, receipt, reference…"
                )}
                className="pl-9"
              />
            </div>
            <button
              type="submit"
              className="focus-ring rounded-md border bg-card px-4 text-sm font-medium hover:bg-accent"
            >
              {t(locale, "Search")}
            </button>
          </form>

          {days.length === 0 ? (
            <EmptyState
              title={t(locale, "Nothing received in this window")}
              description={t(
                locale,
                "Try a wider period, or clear the search. Payments are recorded from a cargo page once an invoice exists."
              )}
            />
          ) : (
            <IncomeDays locale={locale} days={days} rate={rate} />
          )}

          {register.payments.length >= 400 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              {t(
                locale,
                "Showing the most recent 400 payments in this window. Narrow the period to see the rest."
              )}
            </p>
          ) : null}
        </div>

        <ToCollect
          locale={locale}
          rate={rate}
          owingUsd={owed.owingUsd}
          count={owed.count}
          rows={owed.rows}
        />
      </div>
    </>
  );
}
