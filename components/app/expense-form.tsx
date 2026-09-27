"use client";

import { useActionState, useRef, useState } from "react";
import { ChevronDown, Paperclip, Plus, X } from "lucide-react";

import {
  FormError,
  FormSuccess,
  SubmitButton,
} from "@/components/app/form-feedback";
import { useT } from "@/components/app/locale-provider";
import { UnsavedGuard, confirmDiscard } from "@/components/app/unsaved-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  ExpensePicker,
  PickedCost,
  type PickerBatch,
  type PickerChoice,
  type PickerItem,
  type PickerPerson,
} from "@/components/app/expense-picker";
import { recordExpense } from "@/lib/actions/expenses";
import {
  EXPENSE_CLASSES,
  EXPENSE_CLASS_LABELS,
  EXPENSE_CLASS_HINTS,
} from "@/lib/expenses";
import { EXPENSE_CATEGORY_LABELS } from "@/lib/expenses";
import type { ActionResult } from "@/lib/actions/types";

export type ExpenseAccount = {
  id: string;
  name: string;
  currency: string;
  accountNumber: string | null;
};

export type ExpenseDispatch = { id: string; label: string };
export type QuickExpense = { label: string; category: string };

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Recording what the business spent.
 *
 * The costs an air-cargo operation pays are the same ones every week — fuel,
 * the clearing agent, customs, the warehouse rent — and every one of them was
 * four fields and a category chosen from eighteen. The quick picks fill the
 * description AND the category together, which removes the typing and also
 * stops one cost being filed under three different categories by three
 * different people.
 *
 * The receipt is a first-class field, not something behind a disclosure. A
 * typed amount is a claim; the photo of the receipt is what settles an argument
 * about it in four months, and the moment it is easiest to attach is the moment
 * the cost is being recorded.
 */
export function ExpenseForm({
  categories,
  accounts,
  dispatches,
  quick,
  usedMost = [],
  pickerBatches = [],
  people = [],
  rate,
  alwaysOpen = false,
  fixedDispatch,
}: {
  /** Empty means "use the shared list" — the ledger has no reason to pass it. */
  categories?: { value: string; label: string }[];
  accounts: ExpenseAccount[];
  dispatches?: ExpenseDispatch[];
  /**
   * Recording from inside one flight's own page.
   *
   * The dispatch is not a choice there — it is the thing being looked at — so
   * it is carried rather than asked for. Offering a picker that defaults to
   * "not one batch" on a page about one flight is how a customs charge ends
   * up attributed to nothing and the flight reads as pure profit.
   */
  fixedDispatch?: ExpenseDispatch;
  /** Most-recorded first, then the seeded common costs. */
  quick: QuickExpense[];
  /**
   * What this business has actually recorded in the last six months, with how
   * many times. Drives the picker's "Used most" rail.
   *
   * Optional, and empty is a fine answer — a business on its first day has no
   * history, and the picker simply opens on Batch operations instead.
   */
  usedMost?: PickerItem[];
  /**
   * Flights a cost can be attached to, with how many each already has.
   *
   * Separate from `dispatches`, which is the plain list behind the "which
   * batch" select on step two. This one carries the COUNT, which is what lets
   * the picker put the flights with nothing recorded at the top — and those are
   * the ones somebody is looking for.
   */
  pickerBatches?: PickerBatch[];
  /** Staff, for the "who was paid" and "whose draw" modes. */
  people?: PickerPerson[];
  rate: number | null;
  /** Rendered inside something that already decided it is open. */
  alwaysOpen?: boolean;
}) {
  const t = useT();
  const [state, action] = useActionState<
    ActionResult<{ expenseNumber: string }>,
    FormData
  >(recordExpense, { ok: true });

  const [open, setOpen] = useState(alwaysOpen);
  const [more, setMore] = useState(false);
  const [currency, setCurrency] = useState("ZMW");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const amountRef = useRef<HTMLInputElement>(null);

  /*
    TWO STEPS: what, then how much.

    `choice` is null on step one and set on step two, so it is both the answer
    and the position — there is no second flag to get out of step with it.
    Starting at null means the picker is what somebody meets, which is the whole
    point: the category was previously chosen last, hurriedly, from a list of
    thirty-one.
  */
  const [choice, setChoice] = useState<PickerChoice | null>(null);
  const [batchId, setBatchId] = useState("");
  const [vendor, setVendor] = useState("");
  const [expenseClass, setExpenseClass] = useState<"OPERATING" | "NON_OPERATING">(
    "OPERATING"
  );

  /*
    WHAT FILLS THE "USED MOST" RAIL.

    `usedMost` when a page has gone to the trouble of counting; otherwise
    `quick`, which is the same history without the counts followed by the
    seeded common costs. Every existing caller already passes `quick`, so the
    picker has something real to show everywhere without three pages each
    learning about a new prop — and a page that later wants the counts adds
    one.
  */
  const rail: PickerItem[] =
    usedMost.length > 0
      ? usedMost
      : quick.map((q) => ({ label: q.label, category: q.category }));

  /* Picking fills BOTH fields, which is the half that matters — it is not the
     typing that costs the business, it is one cost filed three ways. */
  const choose = (picked: PickerChoice) => {
    setChoice(picked);
    setDescription(picked.label);
    setCategory(picked.category);
    /*
      The flight and the person come through too, and both are the reason the
      mode existed. A cost picked under "A flight" that then had to have its
      batch chosen again on step two would be a picker that asked a question
      and threw the answer away.
    */
    setBatchId(picked.batchId ?? "");
    setVendor(picked.vendor ?? "");
    setExpenseClass(picked.expenseClass ?? "OPERATING");
    /* Anything with a person or a flight on it has details worth seeing. */
    if (picked.vendor || picked.batchId) setMore(true);
    /* The amount is the only thing still unknown, so put the cursor in it. */
    window.setTimeout(() => amountRef.current?.focus(), 30);
  };

  const eligible = accounts.filter((a) => a.currency === currency);

  const categoryOptions =
    categories && categories.length > 0
      ? categories
      : Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        }));

  const panel = (
    <section className="overflow-hidden rounded-xl border bg-card shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b px-5 py-3">
        {/*
          The two steps, always both visible.

          A progress indicator that only shows where you are tells you nothing;
          showing both tells somebody on step one that there IS a step two and
          that it is short — which is what stops a picker feeling like a detour
          on the way to a form.
        */}
        <div className="flex items-center gap-2">
          {[t("What"), t("How much")].map((label, i) => {
            const on = (i === 0) === (choice === null);
            return (
              <span key={label} className="flex items-center gap-2">
                {i === 1 ? (
                  <span aria-hidden className="h-px w-4 bg-border" />
                ) : null}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
                    on
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="tabular-nums">{i + 1}</span>
                  {label}
                </span>
              </span>
            );
          })}
        </div>
        {alwaysOpen ? null : (
          <button
            type="button"
            /* Closing throws the form away as completely as navigating off it
               does, and this ✕ sits a thumb-width from the amount field. */
            onClick={() => confirmDiscard(() => setOpen(false))}
            className="focus-ring rounded-md p-1 text-muted-foreground hover:text-foreground"
            aria-label={t("Close")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/*
        STEP ONE. The quick-chip strip that used to sit here — a dozen pills
        above a thirty-one-item dropdown — is gone into this. The chips only
        ever covered the top twelve and the dropdown still had to be read for
        everything else, so the common case was fast and the uncommon one was
        the same list nobody finishes.
      */}
      {/*
        A DEFINITE HEIGHT ON THE PICKER, not a max.

        It is a flex column whose middle scrolls and whose footer — "Something
        else" — is pinned below it. `h-full` inside a max-height box resolves
        to auto, so the list grew past the panel and took the footer off the
        bottom edge with it. A fixed height would be wrong on a phone, hence
        the viewport-relative cap.
      */}
      {choice === null ? (
        <div className="flex h-[min(32rem,70vh)] flex-col">
          <ExpensePicker
            usedMost={rail}
            batches={pickerBatches}
            people={people}
            onPick={choose}
          />
        </div>
      ) : (
      <form action={action} className="p-5">
        {/* What was chosen, and the way back to change it. */}
        <div className="mb-5">
          <PickedCost choice={choice} onBack={() => setChoice(null)} />
        </div>

        {/* Re-baselined on the expense number the action hands back, so the tap
            straight after recording a cost is not met with "discard changes?"
            about a cost already in the ledger. */}
        <UnsavedGuard
          savedKey={state.ok && state.data ? state.data.expenseNumber : null}
        />

        {/* Carried, not asked for — this form is already inside the flight. */}
        {fixedDispatch ? (
          <input type="hidden" name="batchId" value={fixedDispatch.id} />
        ) : null}

        {/*
          THE PICKED FLIGHT, WHEN THERE IS NO SELECT TO HOLD IT.

          The batch select below only renders when this form was given a list of
          dispatches — the cash page is not — and it lives inside a disclosure.
          A flight chosen in the picker and then silently dropped on submit is
          the worst version of this: the cost is recorded, it looks right, and
          the flight's profit is still wrong. This carries it either way.
        */}
        {!fixedDispatch && batchId && !(dispatches && dispatches.length > 0) ? (
          <input type="hidden" name="batchId" value={batchId} />
        ) : null}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="space-y-1.5 lg:col-span-4">
            <Label htmlFor="description" className="text-xs">
              {t("What was it for")}
            </Label>
            <Input
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("Fuel, customs, a repair…")}
              required
            />
          </div>

          <div className="space-y-1.5 lg:col-span-4">
            <Label htmlFor="expenseAmount" className="text-xs">
              {t("Amount")}
            </Label>
            <div className="flex gap-2">
              <MoneyInput
                id="expenseAmount"
                ref={amountRef}
                name="amount"
                className="min-w-0"
                required
              />
              <NativeSelect
                name="currency"
                aria-label={t("Currency")}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-[5.5rem] shrink-0"
              >
                <option value="ZMW">K</option>
                <option value="USD">USD</option>
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-1.5 lg:col-span-4">
            <Label htmlFor="expenseAccount" className="text-xs">
              {t("Paid from")}
            </Label>
            <NativeSelect id="expenseAccount" name="accountId" defaultValue="">
              <option value="">{t("Not paid yet")}</option>
              {eligible.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              {t(
                "Name it and the cost is paid in one step. Leave it and you choose the account when you settle it."
              )}
            </p>
          </div>

          <div className="space-y-1.5 lg:col-span-5">
            <Label htmlFor="category" className="text-xs">
              {t("Category")}
            </Label>
            <NativeSelect
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.label)}
                </option>
              ))}
            </NativeSelect>
          </div>

          {/* First class, not behind a disclosure: the moment the receipt is
              easiest to attach is the moment the cost is being recorded. */}
          <div className="space-y-1.5 lg:col-span-7">
            <Label htmlFor="receipt" className="flex items-center gap-1.5 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
              {t("Receipt or photo")}
            </Label>
            <Input
              id="receipt"
              name="receipt"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              className="file:mr-3 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
            />
          </div>

          <div className="lg:col-span-12">
            <button
              type="button"
              onClick={() => setMore((v) => !v)}
              className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${more ? "rotate-180" : ""}`}
              />
              {more
                ? t("Fewer details")
                : t("Who was paid, which batch, what date")}
            </button>
          </div>

          {more ? (
            <>
              <div className="space-y-1.5 lg:col-span-4">
                <Label htmlFor="vendor" className="text-xs">
                  {t("Paid to")}
                </Label>
                <Input
                  id="vendor"
                  name="vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder={t("Who received it")}
                />
              </div>
              {!fixedDispatch && dispatches && dispatches.length > 0 ? (
                <div className="space-y-1.5 lg:col-span-4">
                  <Label htmlFor="expenseBatch" className="text-xs">
                    {t("Against a dispatch")}
                  </Label>
                  <NativeSelect
                    id="expenseBatch"
                    name="batchId"
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    <option value="">{t("Not one batch")}</option>
                    {dispatches.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              ) : null}
              <div className="space-y-1.5 lg:col-span-4">
                <Label htmlFor="incurredAt" className="text-xs">
                  {t("Date")}
                </Label>
                <Input id="incurredAt" name="incurredAt" type="date" max={TODAY} />
              </div>
              {/*
                Operating or special.

                Defaulted to operating because almost everything is, and put
                behind "more" for the same reason — the one desk that needs the
                other option knows it needs it.
              */}
              <div className="space-y-1.5 lg:col-span-4">
                <Label htmlFor="expenseClass" className="text-xs">
                  {t("Counts towards profit")}
                </Label>
                <NativeSelect
                  id="expenseClass"
                  name="expenseClass"
                  value={expenseClass}
                  onChange={(e) =>
                    setExpenseClass(e.target.value as "OPERATING" | "NON_OPERATING")
                  }
                >
                  {EXPENSE_CLASSES.map((value) => (
                    <option key={value} value={value}>
                      {t(EXPENSE_CLASS_LABELS[value])}
                    </option>
                  ))}
                </NativeSelect>
                <p className="text-[11px] text-muted-foreground">
                  {t(EXPENSE_CLASS_HINTS.NON_OPERATING)}
                </p>
              </div>
            </>
          ) : null}
        </div>

        <FormError state={state} />
        <FormSuccess
          message={
            state.ok && state.data
              ? `${t("Recorded")} ${state.data.expenseNumber}`
              : null
          }
        />

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
          <SubmitButton variant="brand" size="sm" pendingLabel={t("Recording…")}>
            {t("Record cost")}
          </SubmitButton>
          {/* Nothing waits for a signature any more; see recordExpense. What
              is worth saying is the one thing still true of a blank account. */}
          <p className="text-xs text-muted-foreground">
            {t("Leave the account blank and it is recorded as still to pay.")}
          </p>
        </div>
      </form>
      )}
    </section>
  );

  /*
    INLINE WHERE IT IS THE PAGE'S SUBJECT, OVER IT WHERE IT IS NOT.

    `alwaysOpen` means a caller has already given this a place — the cash page's
    "pay something out of cash" section, or RecordCostButton's own overlay — so
    it renders as a plain panel and does not wrap itself in a second one.

    Everywhere else it is the action on a page header, and the header's action
    slot is a narrow column at the top right. The old form fitted there because
    it was a stack of fields; step one is two columns and was squeezed to half
    a name per row. A modal is the honest answer: this is a task, it takes over
    until it is done, and the page it came from is still behind it.
  */
  if (alwaysOpen) return panel;

  return (
    <>
      <Button variant="brand" className="rounded-lg" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {t("Record a cost")}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-background/70 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={t("Record a cost")}
          onClick={(e) => {
            /* Only the backdrop itself closes. A click that started inside the
               panel and drifted out while selecting text must not. */
            if (e.target === e.currentTarget) confirmDiscard(() => setOpen(false));
          }}
        >
          <div className="mx-auto max-w-4xl">{panel}</div>
        </div>
      ) : null}
    </>
  );
}
