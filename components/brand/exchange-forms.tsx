"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, CheckCircle2, ShieldCheck } from "lucide-react";

import { submitExchangeRequest } from "@/lib/actions/exchange";
import type { ActionResult } from "@/lib/actions/types";
import type { FxBoardRow } from "@/lib/exchange";

/**
 * The public money desk: a calculator and two request forms.
 *
 * THE ONE THING THESE MUST NEVER DO is imply money has moved. A submitted form
 * returns a reference number and the sentence "we will confirm the rate with
 * you" — never a receipt, never a fixed rate, never the word "sent". The server
 * enforces the same rule: the only row the public action can write is an
 * ExchangeRequest in status NEW.
 *
 * The calculator is presentational for the same reason. It multiplies the
 * published board so somebody can see roughly what they would get, says so, and
 * stores nothing.
 */

const CURRENCIES = ["ZMW", "USD", "CNY", "ZAR", "GBP", "EUR"] as const;

function Done({
  reference,
  title,
  body,
}: {
  reference: string;
  title: string;
  body: string;
}) {
  return (
    <div className="ai-card text-center">
      <CheckCircle2
        className="mx-auto h-9 w-9"
        style={{ color: "hsl(var(--ai-emerald))" }}
      />
      <h3 className="ai-display mt-5">{title}</h3>
      <p
        className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        {body}
      </p>
      <p
        className="mt-7 inline-block rounded-[var(--ai-radius)] px-6 py-4"
        style={{ background: "hsl(var(--ai-emerald-soft))" }}
      >
        <span
          className="block text-[0.68rem] font-bold uppercase tracking-[0.18em]"
          style={{ color: "hsl(var(--ai-emerald))" }}
        >
          Your reference
        </span>
        <span className="ai-num mt-1.5 block text-xl font-semibold">
          {reference}
        </span>
      </p>
      <p
        className="mx-auto mt-6 flex max-w-sm items-start gap-2 text-left text-xs leading-relaxed"
        style={{ color: "hsl(var(--ai-charcoal-soft))" }}
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Nothing has been transferred. Our finance desk confirms the rate and the
        amount with you before any money moves.
      </p>
    </div>
  );
}

function Err({ state }: { state: ActionResult<unknown> | undefined }) {
  if (!state || state.ok) return null;
  return <p className="ai-notice ai-notice-error">{state.error}</p>;
}

function CurrencySelect(props: {
  id: string;
  name: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const { onChange, ...rest } = props;
  return (
    <select
      {...rest}
      className="ai-field"
      required
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
    >
      {CURRENCIES.map((code) => (
        <option key={code} value={code}>
          {code}
        </option>
      ))}
    </select>
  );
}

/**
 * What a customer would get at today's board.
 *
 * Picks the rate the way the counter does. If the board carries the pair asked
 * for, it sells the quote currency at `sell`. If it only carries the pair the
 * other way round, it divides — a USD/ZMW board answers "how much USD for my
 * kwacha" perfectly well, and making somebody publish both directions of every
 * pair guarantees the two eventually disagree.
 *
 * Returns null rather than a guess when the board cannot answer, and the UI
 * then says so instead of printing a zero.
 */
function convert(board: FxBoardRow[], from: string, to: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0 || from === to) return null;
  const direct = board.find((r) => r.base === from && r.quote === to);
  if (direct?.sellValue)
    return { result: amount * direct.sellValue, rate: direct.sellValue, derived: false };
  const rev = board.find((r) => r.base === to && r.quote === from);
  const back = rev?.buyValue ?? rev?.sellValue;
  if (back) return { result: amount / back, rate: 1 / back, derived: true };
  return null;
}

const money = (v: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function CurrencyCalculator({ board }: { board: FxBoardRow[] }) {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("ZMW");
  const [amount, setAmount] = useState("100");

  const quote = useMemo(
    () => convert(board, from, to, Number(amount.replace(/,/g, ""))),
    [board, from, to, amount]
  );

  return (
    <div className="ai-card">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div>
          <label htmlFor="fx-from" className="ai-label">
            From
          </label>
          <CurrencySelect id="fx-from" name="fxFrom" value={from} onChange={setFrom} />
        </div>
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Swap currencies"
          className="mb-1 grid h-11 w-11 place-items-center justify-self-center rounded-full border transition-colors"
          style={{ borderColor: "hsl(var(--ai-stone-3))" }}
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
        <div>
          <label htmlFor="fx-to" className="ai-label">
            To
          </label>
          <CurrencySelect id="fx-to" name="fxTo" value={to} onChange={setTo} />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="fx-amount" className="ai-label">
          Amount in {from}
        </label>
        <input
          id="fx-amount"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="ai-field ai-num"
        />
      </div>

      <div
        className="mt-6 rounded-[var(--ai-radius)] p-6"
        style={{ background: "hsl(var(--ai-ink))", color: "hsl(var(--ai-stone))" }}
      >
        {quote ? (
          <>
            <p
              className="text-[0.68rem] font-bold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--ai-copper))" }}
            >
              You would receive about
            </p>
            <p className="ai-num mt-2 text-3xl font-semibold">
              {to} {money(quote.result)}
            </p>
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{ color: "hsl(var(--ai-stone)/0.6)" }}
            >
              At 1 {from} = {to}{" "}
              {quote.rate.toLocaleString("en-US", {
                minimumFractionDigits: quote.rate >= 1 ? 2 : 4,
                maximumFractionDigits: quote.rate >= 1 ? 2 : 4,
              })}
              {quote.derived ? " (derived from the published pair)" : ""}.
              Indicative and subject to confirmation.
            </p>
          </>
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ color: "hsl(var(--ai-stone)/0.7)" }}
          >
            We have not published a rate for that pair. Send a quotation request
            below and we will price it for you.
          </p>
        )}
      </div>
    </div>
  );
}

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
    <form action={action} className="ai-card">
      <input type="hidden" name="type" value={type} />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["MONEY_EXCHANGE", "Book an exchange"],
            ["EXCHANGE_QUOTE", "Just get a quotation"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            aria-pressed={type === value}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            style={
              type === value
                ? {
                    background: "hsl(var(--ai-emerald))",
                    borderColor: "hsl(var(--ai-emerald))",
                    color: "white",
                  }
                : {
                    borderColor: "hsl(var(--ai-stone-3))",
                    color: "hsl(var(--ai-charcoal-soft))",
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <Err state={state} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="x-name" className="ai-label">
              Your name
            </label>
            <input id="x-name" name="contactName" className="ai-field" required />
          </div>
          <div>
            <label htmlFor="x-phone" className="ai-label">
              Phone / WhatsApp
            </label>
            <input
              id="x-phone"
              name="contactPhone"
              type="tel"
              inputMode="tel"
              placeholder="+260 9…"
              className="ai-field"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="x-email" className="ai-label">
            Email <span className="font-normal">(optional)</span>
          </label>
          <input id="x-email" name="contactEmail" type="email" className="ai-field" />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="x-from" className="ai-label">
              You send
            </label>
            <CurrencySelect id="x-from" name="fromCurrency" defaultValue="ZMW" />
          </div>
          <div>
            <label htmlFor="x-to" className="ai-label">
              You want
            </label>
            <CurrencySelect id="x-to" name="toCurrency" defaultValue="USD" />
          </div>
          <div>
            <label htmlFor="x-amount" className="ai-label">
              Amount
            </label>
            <input
              id="x-amount"
              name="amount"
              inputMode="decimal"
              className="ai-field ai-num"
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="x-method" className="ai-label">
              How you would pay us
            </label>
            <select
              id="x-method"
              name="preferredMethod"
              className="ai-field"
              defaultValue="Cash"
            >
              {["Cash", "Bank transfer", "Mobile money"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="x-purpose" className="ai-label">
              What it is for <span className="font-normal">(optional)</span>
            </label>
            <input
              id="x-purpose"
              name="purpose"
              className="ai-field"
              placeholder="Stock purchase, school fees…"
            />
          </div>
        </div>

        <div>
          <label htmlFor="x-notes" className="ai-label">
            Anything else
          </label>
          <textarea id="x-notes" name="notes" rows={3} className="ai-field" />
        </div>

        <button type="submit" className="ai-btn ai-btn-primary w-full">
          {type === "MONEY_EXCHANGE" ? "Book money exchange" : "Request a quotation"}
        </button>

        <p className="ai-hint">
          Submitting this does not transfer any money. It puts a request in front
          of our finance desk, who confirm the rate with you first.
        </p>
      </div>
    </form>
  );
}

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
    <form action={action} className="ai-card">
      <input type="hidden" name="type" value={type} />

      <div className="mb-6 flex flex-wrap gap-2">
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
            className="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
            style={
              type === value
                ? {
                    background: "hsl(var(--ai-copper))",
                    borderColor: "hsl(var(--ai-copper))",
                    color: "hsl(var(--ai-ink))",
                  }
                : {
                    borderColor: "hsl(var(--ai-stone-3))",
                    color: "hsl(var(--ai-charcoal-soft))",
                  }
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-5">
        <Err state={state} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="s-name" className="ai-label">
              Your name
            </label>
            <input id="s-name" name="contactName" className="ai-field" required />
          </div>
          <div>
            <label htmlFor="s-phone" className="ai-label">
              Phone / WhatsApp
            </label>
            <input
              id="s-phone"
              name="contactPhone"
              type="tel"
              inputMode="tel"
              placeholder="+260 9…"
              className="ai-field"
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="s-from" className="ai-label">
              You pay in
            </label>
            <CurrencySelect id="s-from" name="fromCurrency" defaultValue="ZMW" />
          </div>
          <div>
            <label htmlFor="s-to" className="ai-label">
              They receive
            </label>
            <CurrencySelect id="s-to" name="toCurrency" defaultValue="CNY" />
          </div>
          <div>
            <label htmlFor="s-amount" className="ai-label">
              Amount
            </label>
            <input
              id="s-amount"
              name="amount"
              inputMode="decimal"
              className="ai-field ai-num"
              required
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="s-recipient" className="ai-label">
              Supplier name
            </label>
            <input
              id="s-recipient"
              name="recipientName"
              className="ai-field"
              required
            />
          </div>
          <div>
            <label htmlFor="s-rcontact" className="ai-label">
              Their phone or WeChat
            </label>
            <input id="s-rcontact" name="recipientContact" className="ai-field" />
          </div>
        </div>

        <div>
          <label htmlFor="s-details" className="ai-label">
            Their bank, Alipay or WeChat details
          </label>
          <textarea
            id="s-details"
            name="recipientDetails"
            rows={3}
            className="ai-field"
            placeholder="Account name, account number, bank and branch — or the Alipay / WeChat id"
          />
          <p className="ai-hint">
            Copy these exactly as your supplier sent them. We check before paying,
            but we cannot correct a digit nobody can see is wrong.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="s-purpose" className="ai-label">
              What the payment is for
            </label>
            <input
              id="s-purpose"
              name="purpose"
              className="ai-field"
              placeholder="Order number, deposit, balance…"
            />
          </div>
          <div>
            <label htmlFor="s-doc" className="ai-label">
              Order or invoice <span className="font-normal">(optional)</span>
            </label>
            <input
              id="s-doc"
              name="document"
              type="file"
              accept="image/*,application/pdf"
              className="ai-field pt-3.5 text-sm"
            />
          </div>
        </div>

        <button type="submit" className="ai-btn ai-btn-copper w-full">
          Submit payment request
        </button>

        <p className="ai-hint">
          Nothing is paid until our China desk has checked the details and
          confirmed the amount with you.{" "}
          <Link href="/portal" className="ai-link">
            Signed-in customers
          </Link>{" "}
          get the request attached to their account and cargo automatically.
        </p>
      </div>
    </form>
  );
}
