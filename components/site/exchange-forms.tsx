"use client";

import { useActionState, useMemo, useState } from "react";
import { ArrowRightLeft, CheckCircle2 } from "lucide-react";

import { submitExchangeRequest } from "@/lib/actions/exchange";
import type { ActionResult } from "@/lib/actions/types";
import type { FxBoardRow } from "@/lib/exchange";

/**
 * The public money desk: a calculator and two forms.
 *
 * THE THING THESE MUST NEVER DO is imply that money has moved. A submitted form
 * produces a reference number and the sentence "we will confirm the rate with
 * you" — never a receipt, never a completed transfer, never a fixed rate. The
 * server enforces the same thing: `submitExchangeRequest` can only ever write a
 * request in status NEW (see the long note at the top of lib/actions/exchange.ts).
 *
 * The calculator is presentational for the same reason. It multiplies the
 * published board by an amount so a customer can see roughly what they would
 * get, and says in as many words that the figure is indicative. It does not
 * call the server and nothing it produces is stored.
 *
 * Field styling is inline rather than borrowed from the staff components, and
 * matches components/site/request-forms.tsx: this is the public site, where an
 * input is a wide calm thing on a phone rather than a dense operational control.
 */

const field =
  "h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand focus:bg-white/10";
const area =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand focus:bg-white/10";
const labelClass = "mb-1.5 block text-sm font-medium text-white/80";

function Done({ reference, title, body }: { reference: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
      <h3 className="mt-4 font-display text-2xl font-bold text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-white/70">{body}</p>
      <p className="mt-5 inline-block rounded-xl border border-white/15 bg-white/5 px-5 py-3">
        <span className="block text-xs uppercase tracking-widest text-white/50">
          Your reference
        </span>
        <span className="mt-1 block font-mono text-xl font-bold text-white">
          {reference}
        </span>
      </p>
      <p className="mt-5 text-xs text-white/50">
        Nothing has been transferred yet. Our finance desk will confirm the rate
        and the amount with you before any money moves.
      </p>
    </div>
  );
}

function FormError({ state }: { state: ActionResult<unknown> | undefined }) {
  if (!state || state.ok) return null;
  return (
    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {state.error}
    </p>
  );
}

/** Currencies AITRANSIT actually deals in. */
const CURRENCIES = ["ZMW", "USD", "CNY", "ZAR", "GBP", "EUR"] as const;

function CurrencySelect({
  id,
  name,
  defaultValue,
  value,
  onChange,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={onChange ? undefined : defaultValue}
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      className={field}
      required
    >
      {CURRENCIES.map((code) => (
        <option key={code} value={code} className="bg-[hsl(var(--ink))]">
          {code}
        </option>
      ))}
    </select>
  );
}

/**
 * What a customer would get, at today's published board.
 *
 * Picks the rate the way the counter does. If the board carries the pair the
 * customer asked for, it sells them the quote currency at `sell`. If it only
 * carries the pair the other way round, it divides — a board showing USD/ZMW
 * answers "how much USD for my kwacha" perfectly well, and making somebody
 * publish both directions of every pair would guarantee the two drift apart.
 *
 * Returns null rather than a guess when the board cannot answer, and the UI
 * then says so instead of printing a zero.
 */
function convert(
  board: FxBoardRow[],
  from: string,
  to: string,
  amount: number
): { result: number; rate: number; inverted: boolean } | null {
  if (!Number.isFinite(amount) || amount <= 0 || from === to) return null;

  const direct = board.find((row) => row.base === from && row.quote === to);
  if (direct?.sellValue) {
    return { result: amount * direct.sellValue, rate: direct.sellValue, inverted: false };
  }
  const reverse = board.find((row) => row.base === to && row.quote === from);
  if (reverse?.buyValue) {
    return {
      result: amount / reverse.buyValue,
      rate: 1 / reverse.buyValue,
      inverted: true,
    };
  }
  if (reverse?.sellValue) {
    return {
      result: amount / reverse.sellValue,
      rate: 1 / reverse.sellValue,
      inverted: true,
    };
  }
  return null;
}

const money = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function CurrencyCalculator({ board }: { board: FxBoardRow[] }) {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("ZMW");
  const [amount, setAmount] = useState("100");

  const quote = useMemo(
    () => convert(board, from, to, Number(amount.replace(/,/g, ""))),
    [board, from, to, amount]
  );

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <label className={labelClass} htmlFor="calc-from">
            From
          </label>
          <CurrencySelect id="calc-from" name="calcFrom" value={from} onChange={setFrom} />
        </div>
        <div className="flex items-end justify-center pb-3">
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            aria-label="Swap currencies"
            className="rounded-full border border-white/15 p-2 transition-colors hover:bg-white/10"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>
        <div>
          <label className={labelClass} htmlFor="calc-to">
            To
          </label>
          <CurrencySelect id="calc-to" name="calcTo" value={to} onChange={setTo} />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClass} htmlFor="calc-amount">
          Amount in {from}
        </label>
        <input
          id="calc-amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className={field}
        />
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        {quote ? (
          <>
            <p className="text-xs uppercase tracking-widest text-white/50">
              You would receive approximately
            </p>
            <p className="mt-1 font-display text-3xl font-bold">
              {to} {money(quote.result)}
            </p>
            <p className="mt-2 text-xs text-white/50">
              At 1 {from} = {to}{" "}
              {quote.rate.toLocaleString("en-US", {
                minimumFractionDigits: quote.rate >= 1 ? 2 : 4,
                maximumFractionDigits: quote.rate >= 1 ? 2 : 4,
              })}
              {quote.inverted ? " (derived from the published pair)" : ""}. Rates
              are indicative and subject to confirmation.
            </p>
          </>
        ) : (
          <p className="text-sm text-white/60">
            We have not published a rate for that pair. Send us a quotation
            request below and we will price it for you.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Book an exchange, or ask what a rate would be.
 *
 * One form, two purposes, chosen by a radio. A quotation and a booking collect
 * exactly the same facts — the difference is entirely in what the customer is
 * committing to, and that is a word on a button rather than a different set of
 * fields.
 */
export function ExchangeBookingForm() {
  const [state, action] = useActionState(submitExchangeRequest, undefined);
  const [type, setType] = useState<"MONEY_EXCHANGE" | "EXCHANGE_QUOTE">(
    "MONEY_EXCHANGE"
  );

  if (state?.ok && state.data) {
    return (
      <Done
        reference={state.data.reference}
        title="Request received"
        body="Our finance desk will review it and come back to you with a confirmed rate. Quote this reference when you call or message us."
      />
    );
  }

  return (
    <form action={action} className="space-y-5">
      <FormError state={state} />
      <input type="hidden" name="type" value={type} />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["MONEY_EXCHANGE", "Book an exchange"],
            ["EXCHANGE_QUOTE", "Ask for a quotation"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            aria-pressed={type === value}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              type === value
                ? "border-gold bg-gold text-gold-foreground"
                : "border-white/15 text-white/70 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="x-name">
            Your name
          </label>
          <input id="x-name" name="contactName" className={field} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="x-phone">
            Phone / WhatsApp
          </label>
          <input
            id="x-phone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            placeholder="+260 9…"
            className={field}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="x-email">
            Email (optional)
          </label>
          <input id="x-email" name="contactEmail" type="email" className={field} />
        </div>
        <div>
          <label className={labelClass} htmlFor="x-from">
            Currency you are sending
          </label>
          <CurrencySelect id="x-from" name="fromCurrency" defaultValue="ZMW" />
        </div>
        <div>
          <label className={labelClass} htmlFor="x-to">
            Currency you want
          </label>
          <CurrencySelect id="x-to" name="toCurrency" defaultValue="USD" />
        </div>
        <div>
          <label className={labelClass} htmlFor="x-amount">
            Amount
          </label>
          <input
            id="x-amount"
            name="amount"
            inputMode="decimal"
            className={field}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="x-method">
            How you would pay us
          </label>
          <select
            id="x-method"
            name="preferredMethod"
            className={field}
            defaultValue="Cash"
          >
            {["Cash", "Bank transfer", "Mobile money"].map((method) => (
              <option key={method} value={method} className="bg-[hsl(var(--ink))]">
                {method}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="x-purpose">
            What it is for (optional)
          </label>
          <input
            id="x-purpose"
            name="purpose"
            className={field}
            placeholder="Stock purchase, school fees, supplier deposit…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="x-notes">
            Anything else
          </label>
          <textarea id="x-notes" name="notes" rows={3} className={area} />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        {type === "MONEY_EXCHANGE" ? "Book money exchange" : "Request a quotation"}
      </button>

      <p className="text-xs text-white/45">
        Submitting this form does not transfer any money. It puts a request in
        front of our finance desk, who will confirm the rate with you first.
      </p>
    </form>
  );
}

/**
 * Pay a supplier in China, or send money for a purchase.
 *
 * Collects the recipient, because that is the whole difference from the form
 * above — and the server refuses either of these two types without one. The
 * bank details field is free text on purpose: a Chinese bank line, an Alipay id
 * and a WeChat handle share no structure, and a form that insists on one gets
 * filled with nonsense.
 */
export function SupplierPaymentRequestForm() {
  const [state, action] = useActionState(submitExchangeRequest, undefined);
  const [type, setType] = useState<"SUPPLIER_PAYMENT" | "SEND_MONEY_CHINA">(
    "SUPPLIER_PAYMENT"
  );

  if (state?.ok && state.data) {
    return (
      <Done
        reference={state.data.reference}
        title="Payment request received"
        body="Our China desk will check the details and confirm the amount with you before paying anything out."
      />
    );
  }

  return (
    <form action={action} className="space-y-5">
      <FormError state={state} />
      <input type="hidden" name="type" value={type} />

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["SUPPLIER_PAYMENT", "Pay my supplier"],
            ["SEND_MONEY_CHINA", "Send money for a purchase"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            aria-pressed={type === value}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              type === value
                ? "border-gold bg-gold text-gold-foreground"
                : "border-white/15 text-white/70 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="s-name">
            Your name
          </label>
          <input id="s-name" name="contactName" className={field} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="s-phone">
            Phone / WhatsApp
          </label>
          <input
            id="s-phone"
            name="contactPhone"
            type="tel"
            inputMode="tel"
            placeholder="+260 9…"
            className={field}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="s-email">
            Email (optional)
          </label>
          <input id="s-email" name="contactEmail" type="email" className={field} />
        </div>
        <div>
          <label className={labelClass} htmlFor="s-from">
            Currency you are paying in
          </label>
          <CurrencySelect id="s-from" name="fromCurrency" defaultValue="ZMW" />
        </div>
        <div>
          <label className={labelClass} htmlFor="s-to">
            Currency the supplier receives
          </label>
          <CurrencySelect id="s-to" name="toCurrency" defaultValue="CNY" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="s-amount">
            Amount
          </label>
          <input
            id="s-amount"
            name="amount"
            inputMode="decimal"
            className={field}
            required
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="s-recipient">
            Supplier / recipient name
          </label>
          <input id="s-recipient" name="recipientName" className={field} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="s-recipient-contact">
            Their phone or WeChat
          </label>
          <input id="s-recipient-contact" name="recipientContact" className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="s-details">
            Their bank / Alipay / WeChat payment details
          </label>
          <textarea
            id="s-details"
            name="recipientDetails"
            rows={3}
            className={area}
            placeholder="Account name, account number, bank and branch — or the Alipay/WeChat id"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="s-purpose">
            What the payment is for
          </label>
          <input
            id="s-purpose"
            name="purpose"
            className={field}
            placeholder="Order number, deposit, balance…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="s-doc">
            Order, invoice or screenshot (optional)
          </label>
          <input
            id="s-doc"
            name="document"
            type="file"
            accept="image/*,application/pdf"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="s-notes">
            Anything else
          </label>
          <textarea id="s-notes" name="notes" rows={3} className={area} />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center rounded-xl bg-gold px-6 text-sm font-semibold text-gold-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        Submit payment request
      </button>

      <p className="text-xs text-white/45">
        Nothing is paid until our China desk has checked the details and
        confirmed the amount with you.
      </p>
    </form>
  );
}
