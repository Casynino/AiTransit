"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";

import type { FxBoardRow } from "@/lib/exchange";

/**
 * "How much do I get for this?"
 *
 * WHICH SIDE OF THE SPREAD, AND WHY IT MATTERS. A published pair carries a BUY
 * and a SELL rate, and they are not interchangeable: buy is what we pay you for
 * that currency, sell is what you pay us for it. Picking the wrong one quotes a
 * customer a better number than they will actually get, and they arrive at the
 * desk expecting it. So the direction of the conversion decides the side, and
 * the label under the answer says in words which rate was used.
 *
 * IT IS EXPLICITLY INDICATIVE. Rates move during the day and a booking is only
 * fixed when the money desk confirms it — so this says so under every result
 * rather than in small print somewhere else on the page.
 */
export function RateCalculator({ board }: { board: FxBoardRow[] }) {
  const usable = board.filter((r) => r.buyValue !== null || r.sellValue !== null);
  const [pairId, setPairId] = useState(usable[0]?.id ?? "");
  const [amount, setAmount] = useState("1000");
  /* true = customer gives base and receives quote. */
  const [forward, setForward] = useState(true);

  const pair = usable.find((r) => r.id === pairId) ?? usable[0];

  const result = useMemo(() => {
    if (!pair) return null;
    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) return null;

    /*
      Forward: they hand us `base` and want `quote` — we are BUYING their base,
      so the buy rate applies. Reverse: they want to obtain `base` and pay in
      `quote` — we are SELLING, so the sell rate applies. Where only one side is
      published, that one is used and the caption still names it honestly.
    */
    const buy = pair.buyValue;
    const sell = pair.sellValue;
    const rate = forward ? (buy ?? sell) : (sell ?? buy);
    if (rate === null || rate === 0) return null;

    const side = forward
      ? buy !== null
        ? "buy"
        : "sell"
      : sell !== null
        ? "sell"
        : "buy";

    return {
      out: forward ? value * rate : value / rate,
      rate,
      side,
      from: forward ? pair.base : pair.quote,
      to: forward ? pair.quote : pair.base,
    };
  }, [pair, amount, forward]);

  if (!pair) {
    return (
      <p className="ai-muted text-sm">
        No rates are published at the moment. Ask our money desk for today&apos;s
        figure.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Currency pair</span>
          <select
            value={pair.id}
            onChange={(e) => setPairId(e.target.value)}
            className="w-full rounded-[var(--ai-radius)] border px-3.5 py-2.5 text-sm"
            style={{
              borderColor: "hsl(var(--ai-stone-3))",
              background: "hsl(var(--ai-white))",
            }}
          >
            {usable.map((row) => (
              <option key={row.id} value={row.id}>
                {row.base} / {row.quote}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setForward((f) => !f)}
          className="ai-btn ai-btn-outline self-end"
          aria-label="Swap the direction"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Swap
        </button>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">
          You have ({forward ? pair.base : pair.quote})
        </span>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="ai-num w-full rounded-[var(--ai-radius)] border px-3.5 py-2.5 text-lg font-semibold"
          style={{
            borderColor: "hsl(var(--ai-stone-3))",
            background: "hsl(var(--ai-white))",
          }}
        />
      </label>

      <div
        className="rounded-[var(--ai-radius)] px-4 py-3.5"
        style={{ background: "hsl(var(--ai-emerald) / 0.08)" }}
      >
        <p
          className="text-[0.62rem] font-bold uppercase tracking-[0.12em]"
          style={{ color: "hsl(var(--ai-emerald))" }}
        >
          You would get, roughly
        </p>
        <p className="ai-num mt-1 text-2xl font-bold">
          {result
            ? `${result.to} ${result.out.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : "—"}
        </p>
        {result ? (
          <p className="ai-muted mt-1 text-xs">
            At our {result.side} rate of {result.rate.toLocaleString()} — the rate
            we {result.side === "buy" ? "pay for" : "charge for"} {pair.base}.
          </p>
        ) : null}
      </div>

      <p className="ai-muted text-xs">
        Rates are indicative and subject to AITRANSIT confirmation. Nothing is
        fixed until the money desk confirms your booking.
      </p>
    </div>
  );
}
