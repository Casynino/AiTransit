/**
 * Writing money down. No database, no server.
 *
 * Split out of lib/fx.ts, which is server-only because it reads the published
 * rate. Formatting a figure needs none of that, and keeping the two together
 * meant a client component could not print a kwacha amount without dragging
 * the whole rate machinery — and failing the build when it tried.
 *
 * The rate itself still belongs on the server. This is only the writing.
 */

/** What the business bills in. */
export const BASE_CURRENCY = "USD";
/** ISO code for the kwacha — what the database stores. */
export const LOCAL_CURRENCY = "ZMW";

/**
 * A kwacha figure, as Zambia writes it.
 *
 * ZMW is the ISO code; K is what everybody reads, and it is what the ledger and
 * the dashboards print. Having both on screen made one page look like it was
 * quoting a different currency from the next, so the display symbol is decided
 * here rather than at each call site. The stored code is untouched.
 *
 * TWO DECIMALS, WHICH IS A CHANGE FROM THE SHILLING THIS REPLACED. Target
 * Express rounded, and rounding was right there: at roughly 2,700 kwacha to
 * the dollar a cargo bill ran into the millions and the cents were four digits
 * of noise. The kwacha trades near 27 to the dollar — two orders of magnitude
 * stronger — so the same USD 100 invoice is about K 2,700 and the ngwee are a
 * real part of the figure. Rounding here would lose money on every line and
 * make a ledger fail to foot against a bank statement.
 */
export function formatLocal(amount: number, currency = LOCAL_CURRENCY) {
  const symbol = currency === LOCAL_CURRENCY ? "K" : currency;
  return `${symbol} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Dollars, always to the cent: these are invoice figures. */
export function formatUsd(amount: number) {
  return `${BASE_CURRENCY} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * A dollar figure in kwacha, at a rate the caller has already chosen.
 *
 * Rounded to the ngwee rather than to the kwacha — see formatLocal above. The
 * result is money somebody will hand over, and the smallest unit that exists
 * is the right place to stop.
 */
export function toLocal(usd: number, rate: number): number {
  return Math.round(usd * rate * 100) / 100;
}

/**
 * A stored dollar figure, written the way this office reads money.
 *
 * Everything is priced in dollars because that is how air freight is sold.
 * Nobody in Lusaka thinks in dollars: the till holds kwacha, the customer pays
 * kwacha, the salary is a kwacha figure. A screen printing
 * USD is asking its reader to convert in their head, at whatever rate they
 * happen to remember, before they can answer a question about their own money.
 *
 * One function rather than a `rate ? … : …` at each call site — which is how
 * the ledger ended up leading in kwacha while the profit page beside it led
 * in dollars. With no rate published there is nothing honest to convert with,
 * so the dollar figure stands rather than a guess.
 */
export function formatKwacha(usd: number, rate: number | null) {
  return rate === null ? formatUsd(usd) : formatLocal(usd * rate);
}
