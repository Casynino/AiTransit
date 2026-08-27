"use client";

import { useActionState } from "react";

import { FormError, SubmitButton } from "@/components/app/form-feedback";
import { useT } from "@/components/app/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publishFxRate } from "@/lib/actions/exchange";

/**
 * Publishing one pair onto the public board.
 *
 * Upserts on the pair, so correcting this morning's number edits the row rather
 * than stacking a second one behind it — a board is a current statement of
 * price, and its history lives in the audit log where a history belongs.
 *
 * Pre-filled when editing an existing pair so the currencies cannot be
 * accidentally retyped into a different one, which would leave the old pair
 * live on the website alongside the new.
 */
export function FxBoardForm({
  base,
  quote,
  buy,
  sell,
  note,
  sortOrder,
  active = true,
}: {
  base?: string;
  quote?: string;
  buy?: string;
  sell?: string;
  note?: string;
  sortOrder?: number;
  active?: boolean;
}) {
  const t = useT();
  const [state, action] = useActionState(publishFxRate, undefined);
  const editing = Boolean(base && quote);

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <FormError state={state} />
      {state?.ok ? (
        <p className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
          {t("Published to the website.")}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor={`fx-base-${base ?? "new"}`}>{t("Base")}</Label>
          <Input
            id={`fx-base-${base ?? "new"}`}
            name="baseCurrency"
            defaultValue={base}
            readOnly={editing}
            maxLength={3}
            required
            placeholder="USD"
            className={editing ? "bg-muted" : undefined}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fx-quote-${base ?? "new"}`}>{t("Quote")}</Label>
          <Input
            id={`fx-quote-${base ?? "new"}`}
            name="quoteCurrency"
            defaultValue={quote}
            readOnly={editing}
            maxLength={3}
            required
            placeholder="ZMW"
            className={editing ? "bg-muted" : undefined}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fx-buy-${base ?? "new"}`}>{t("We buy at")}</Label>
          <Input
            id={`fx-buy-${base ?? "new"}`}
            name="buyRate"
            defaultValue={buy}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fx-sell-${base ?? "new"}`}>{t("We sell at")}</Label>
          <Input
            id={`fx-sell-${base ?? "new"}`}
            name="sellRate"
            defaultValue={sell}
            inputMode="decimal"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`fx-note-${base ?? "new"}`}>{t("Note on the card")}</Label>
          <Input
            id={`fx-note-${base ?? "new"}`}
            name="note"
            defaultValue={note}
            placeholder={t("e.g. cash only, minimum USD 500")}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fx-order-${base ?? "new"}`}>{t("Order")}</Label>
          <Input
            id={`fx-order-${base ?? "new"}`}
            name="sortOrder"
            inputMode="numeric"
            defaultValue={sortOrder ?? 0}
            autoComplete="off"
          />
        </div>
      </div>

      {editing ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={active}
            className="h-4 w-4"
          />
          {t("Show this pair on the website")}
        </label>
      ) : null}

      <SubmitButton pendingLabel="Publishing…">
        {editing ? t("Update rate") : t("Publish pair")}
      </SubmitButton>
    </form>
  );
}
