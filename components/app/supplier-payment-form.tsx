"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { CustomerPicker } from "@/components/app/customer-picker";
import { FormError, SubmitButton } from "@/components/app/form-feedback";
import { useT } from "@/components/app/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AccountOption } from "@/lib/accounts";
import { recordSupplierPayment } from "@/lib/actions/exchange";

/**
 * Recording money paid to a supplier in China.
 *
 * The ACCOUNT is required and the form says why: this is the record that money
 * left the business, and a payout nobody can tie to an account is the one thing
 * reconciliation cannot resolve.
 *
 * The exchange rate is optional but consequential, and the helper text says
 * that too — without it the USD column stays empty and the payment cannot be
 * added into a company-wide total. Better an honest gap than a converted guess.
 */
export function SupplierPaymentForm({ accounts }: { accounts: AccountOption[] }) {
  const t = useT();
  const [state, action] = useActionState(recordSupplierPayment, undefined);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("");

  const amountValue = Number(amount.replace(/,/g, ""));
  const rateValue = Number(rate.replace(/,/g, ""));
  const usd =
    Number.isFinite(amountValue) &&
    amountValue > 0 &&
    Number.isFinite(rateValue) &&
    rateValue > 0
      ? amountValue / rateValue
      : null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-brand-foreground"
      >
        <Plus className="h-4 w-4" />
        {t("Record a supplier payment")}
      </button>
    );
  }

  if (state?.ok && state.data) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-5 text-sm text-success">
        <p className="font-medium">
          {t("Recorded")} — {state.data.reference}.
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-3 inline-flex h-9 items-center rounded-lg border border-success/40 px-3"
        >
          {t("Done")}
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <h3 className="font-display text-base font-semibold">
        {t("Record a supplier payment")}
      </h3>
      <FormError state={state} />

      <CustomerPicker />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="sp-supplier">{t("Supplier name")}</Label>
          <Input id="sp-supplier" name="supplierName" required autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-contact">{t("Supplier contact")}</Label>
          <Input id="sp-contact" name="supplierContact" autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-amount">{t("Amount sent")}</Label>
          <Input
            id="sp-amount"
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-currency">{t("Currency")}</Label>
          <select
            id="sp-currency"
            name="currency"
            defaultValue="CNY"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {["CNY", "USD", "ZMW"].map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-rate">{t("Rate to USD")}</Label>
          <Input
            id="sp-rate"
            name="exchangeRate"
            inputMode="decimal"
            value={rate}
            onChange={(event) => setRate(event.target.value)}
            placeholder="7.2"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            {usd === null
              ? t(
                  "Units of the currency above per one US dollar. Without it this payment cannot be added into a company-wide total."
                )
              : `${t("Which is")} USD ${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-fee">{t("Our fee (USD)")}</Label>
          <Input
            id="sp-fee"
            name="serviceFeeUsd"
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-account">{t("Account it left")}</Label>
          <select
            id="sp-account"
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
          <Label htmlFor="sp-status">{t("Status")}</Label>
          <select
            id="sp-status"
            name="status"
            defaultValue="PAID"
            className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
          >
            {["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"].map((s) => (
              <option key={s} value={s}>
                {t(s.charAt(0) + s.slice(1).toLowerCase())}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-supplier-ref">{t("Supplier's order number")}</Label>
          <Input id="sp-supplier-ref" name="supplierReference" autoComplete="off" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sp-payment-ref">{t("Our transfer reference")}</Label>
          <Input id="sp-payment-ref" name="paymentReference" autoComplete="off" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sp-proof">{t("Transfer proof")}</Label>
        <input
          id="sp-proof"
          name="proof"
          type="file"
          accept="image/*,application/pdf"
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sp-notes">{t("Notes")}</Label>
        <Textarea id="sp-notes" name="notes" rows={2} />
      </div>

      <div className="flex flex-wrap gap-2">
        <SubmitButton pendingLabel="Recording…">{t("Record payment")}</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 items-center rounded-lg border px-4 text-sm"
        >
          {t("Cancel")}
        </button>
      </div>
    </form>
  );
}
