import type { Metadata } from "next";
import Link from "next/link";

import { FinanceNav } from "@/components/app/finance-nav";
import { FxBoardForm } from "@/components/app/fx-board-form";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { fxRateBook } from "@/lib/exchange";
import { financeTabs } from "@/lib/finance-tabs";
import { formatDateTime, toNumber } from "@/lib/format";
import { t } from "@/lib/i18n";
import { requirePermission } from "@/lib/session";
import { viewerLocale } from "@/lib/viewer";

export const metadata: Metadata = { title: "Exchange board" };

/**
 * The rates the public website shows.
 *
 * DISTINCT FROM THE INVOICE RATE, and the page says so. Finance → Pricing holds
 * the USD→ZMW rate that customer invoices are converted at; that one is a dated
 * history because an invoice must keep the rate it was raised at forever. This
 * one is a shop window: what AITRANSIT will buy and sell currency at today, and
 * it is meant to be overwritten every morning.
 *
 * Conflating the two would mean either a marketing rate silently restating last
 * month's invoices, or an invoice rate that cannot be moved without republishing
 * the website. They are two different facts about money and they get two tables.
 */
export default async function FxBoardPage() {
  const user = await requirePermission("fx.manage");
  const locale = await viewerLocale();
  const rates = await fxRateBook();

  const decimals = (value: number) => (value >= 1 ? 2 : 4);
  const show = (value: number | null) =>
    value === null
      ? "—"
      : value.toLocaleString("en-US", {
          minimumFractionDigits: decimals(value),
          maximumFractionDigits: decimals(value),
        });

  return (
    <>
      <FinanceNav tabs={financeTabs(user.role)} />

      <PageHeader
        title={t(locale, "Exchange board")}
        description={t(
          locale,
          "The buy and sell rates shown on the public website. Indicative — every booking is confirmed with the customer before money moves."
        )}
        actions={
          <Link
            href="/app/finance/pricing"
            className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium hover:bg-muted"
          >
            {t(locale, "Invoice exchange rate")}
          </Link>
        }
      />

      <p className="mb-6 rounded-lg border border-info/30 bg-info/5 p-4 text-sm">
        {t(
          locale,
          "This board is separate from the USD→ZMW rate invoices are converted at, which lives on the Pricing screen. Changing a rate here changes the website and nothing else — no invoice, past or future, reads these figures."
        )}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            {t(locale, "Published pairs")}
          </h2>
          {rates.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              {t(
                locale,
                "No pairs published. The website's exchange page will tell visitors to message us for a quote until there are."
              )}
            </p>
          ) : (
            rates.map((rate) => (
              <div key={rate.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display text-base font-semibold">
                    {rate.baseCurrency} → {rate.quoteCurrency}
                    <span className="ml-3 font-mono text-sm font-normal text-muted-foreground">
                      {t(locale, "buy")}{" "}
                      {show(rate.buyRate === null ? null : toNumber(rate.buyRate))} ·{" "}
                      {t(locale, "sell")}{" "}
                      {show(rate.sellRate === null ? null : toNumber(rate.sellRate))}
                    </span>
                  </p>
                  <Badge variant={rate.active ? "success" : "muted"}>
                    {rate.active ? t(locale, "Live") : t(locale, "Hidden")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {rate.setBy
                    ? `${t(locale, "Last set by")} ${rate.setBy.name} · `
                    : ""}
                  {formatDateTime(rate.updatedAt)}
                </p>
                <FxBoardForm
                  base={rate.baseCurrency}
                  quote={rate.quoteCurrency}
                  buy={rate.buyRate === null ? "" : String(toNumber(rate.buyRate))}
                  sell={
                    rate.sellRate === null ? "" : String(toNumber(rate.sellRate))
                  }
                  note={rate.note ?? ""}
                  sortOrder={rate.sortOrder}
                  active={rate.active}
                />
              </div>
            ))
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">
            {t(locale, "Add a pair")}
          </h2>
          <FxBoardForm />
        </section>
      </div>
    </>
  );
}
