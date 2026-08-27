"use client";

import { useActionState, useState } from "react";

import { FormError, SubmitButton } from "@/components/app/form-feedback";
import { useT } from "@/components/app/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeExchangeRequest,
  decideExchangeRequest,
} from "@/lib/actions/exchange";
import type { AccountOption } from "@/lib/accounts";

/**
 * The two controls on a money request, kept apart on purpose.
 *
 * DECIDING is a judgement — under review, quoted, agreed, refused. COMPLETING
 * is a statement that money physically moved, and it demands an account. They
 * are two forms and two server actions gated on two different permissions
 * (`fx.manage` and `payment.record`), which is the same split already drawn
 * between pricing an invoice and confirming its payment.
 *
 * Collapsing them into one form with a status dropdown would have made
 * "completed" one option among six, reachable by the desk that quotes — and a
 * completed transfer nobody can tie to an account is the exact hole the finance
 * section of this system exists to close.
 */

const STATUSES: { value: string; label: string; hint: string }[] = [
  { value: "UNDER_REVIEW", label: "Under review", hint: "Picked up, being looked at." },
  { value: "QUOTED", label: "Quoted", hint: "A rate has been put to the customer." },
  {
    value: "AWAITING_PAYMENT",
    label: "Awaiting payment",
    hint: "Agreed — waiting for their funds.",
  },
  { value: "CONFIRMED", label: "Confirmed", hint: "Funds received, rate fixed." },
  { value: "REJECTED", label: "Rejected", hint: "Refused. A reason is required." },
  { value: "CANCELLED", label: "Cancelled", hint: "Withdrawn by the customer." },
];

export function ExchangeDecision({
  requestId,
  fromCurrency,
  toCurrency,
  amount,
  canComplete,
  accounts,
  closed,
}: {
  requestId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  /** payment.record — the authority to say money moved. */
  canComplete: boolean;
  accounts: AccountOption[];
  closed: boolean;
}) {
  const t = useT();
  const [state, action] = useActionState(decideExchangeRequest, undefined);
  const [completeState, completeAction] = useActionState(
    completeExchangeRequest,
    undefined
  );
  const [status, setStatus] = useState("UNDER_REVIEW");
  const [rate, setRate] = useState("");

  /* Shows the customer's side of the arithmetic as the rate is typed. The
     mistake this catches is a digit — 2.74 for 27.4 — which is far easier to
     see as "they receive K 274" than as a number in a box. */
  const rateValue = Number(rate.replace(/,/g, ""));
  const preview =
    Number.isFinite(rateValue) && rateValue > 0 ? amount * rateValue : null;

  if (closed) {
    return (
      <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
        {t("This request is closed. Nothing further can be recorded against it.")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
        <h3 className="font-display text-base font-semibold">
          {t("Move this request on")}
        </h3>
        <FormError state={state} />
        {state?.ok ? (
          <p className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
            {t("Updated.")}
          </p>
        ) : null}

        <input type="hidden" name="id" value={requestId} />

        <div className="space-y-1.5">
          <Label htmlFor="x-status">{t("Status")}</Label>
          <select
            id="x-status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.label)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            {t(STATUSES.find((s) => s.value === status)?.hint ?? "")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="x-rate">
              {t("Agreed rate")} — 1 {fromCurrency} = {toCurrency}
            </Label>
            <Input
              id="x-rate"
              name="agreedRate"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="x-agreed">
              {t("They receive")} ({toCurrency})
            </Label>
            <Input
              id="x-agreed"
              name="agreedAmount"
              inputMode="decimal"
              placeholder={
                preview === null
                  ? undefined
                  : preview.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
              }
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="x-fee">
              {t("Our fee")} ({fromCurrency})
            </Label>
            <Input
              id="x-fee"
              name="feeAmount"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
        </div>

        {preview !== null ? (
          <p className="rounded-lg border bg-muted/40 p-3 text-sm">
            {t("At that rate")} {fromCurrency}{" "}
            {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
            {t("becomes")}{" "}
            <span className="font-mono font-semibold tabular-nums">
              {toCurrency}{" "}
              {preview.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            .
          </p>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="x-note">
            {t("Note to the customer")}
            {status === "REJECTED" ? ` — ${t("required")}` : ""}
          </Label>
          <Textarea id="x-note" name="decisionNote" rows={2} />
        </div>

        <SubmitButton pendingLabel="Saving…">{t("Save decision")}</SubmitButton>
      </form>

      {canComplete ? (
        <form
          action={completeAction}
          className="space-y-4 rounded-xl border border-success/30 bg-success/5 p-5"
        >
          <h3 className="font-display text-base font-semibold">
            {t("The money has moved")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(
              "Only after the transfer has actually been made. Recording it here marks the request complete and names the account it went through — record the movement itself on the Transactions screen against the same account."
            )}
          </p>
          <FormError state={completeState} />
          {completeState?.ok ? (
            <p className="rounded-md border border-success/30 bg-success/10 p-3 text-sm text-success">
              {t("Completed.")}
            </p>
          ) : null}

          <input type="hidden" name="id" value={requestId} />

          <div className="space-y-1.5">
            <Label htmlFor="x-account">{t("Account it moved through")}</Label>
            <select
              id="x-account"
              name="accountId"
              required
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
            >
              <option value="">{t("Choose an account…")}</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.currency})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="x-proof">{t("Transfer proof")}</Label>
            <input
              id="x-proof"
              name="proof"
              type="file"
              accept="image/*,application/pdf"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <SubmitButton pendingLabel="Recording…" variant="signal">
            {t("Mark completed")}
          </SubmitButton>
        </form>
      ) : null}
    </div>
  );
}
