"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";

import { submitChinaRequest } from "@/lib/actions/portal";

/**
 * The China services a customer can ask for, in the words AITRANSIT's own flyer
 * uses.
 *
 * The values are SourcingType — the same enum and the same queue the support
 * desk already works from. The five AITRANSIT services were added to that enum
 * rather than given a table of their own; see the note on it in the schema.
 */
const TYPES: { value: string; label: string; hint: string }[] = [
  {
    value: "INSPECT_GOODS",
    label: "Inspect my goods",
    hint: "We check the goods against your order before they are packed.",
  },
  {
    value: "COLLECT_FROM_SUPPLIER",
    label: "Collect from my supplier",
    hint: "Give us the address and we collect in Guangzhou.",
  },
  {
    value: "PACKING",
    label: "Pack my goods",
    hint: "Repacked and reinforced for the flight, free of charge.",
  },
  {
    value: "SEND_IN_ADVANCE",
    label: "Send in advance, no deposit",
    hint: "Ship first and settle later.",
  },
  {
    value: "PAY_ON_COLLECTION",
    label: "Pay freight on collection",
    hint: "Settle the freight when you collect in Lusaka.",
  },
  {
    value: "FIND_SUPPLIER",
    label: "Find me a supplier",
    hint: "Tell us the product and we will source it.",
  },
  {
    value: "REQUEST_QUOTATION",
    label: "Get me a quotation",
    hint: "We will price it with the supplier for you.",
  },
  {
    value: "VERIFY_SUPPLIER",
    label: "Check a supplier",
    hint: "We verify a supplier before you send them money.",
  },
];

export function ChinaRequestForm() {
  const [state, action] = useActionState(submitChinaRequest, undefined);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(TYPES[0].value);

  if (state?.ok && state.data) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-sm text-success">
        <CheckCircle2 className="h-6 w-6" />
        <p className="mt-3 font-medium">
          Request {state.data.reference} is with our China desk.
        </p>
        <p className="mt-1 text-success/80">
          It will appear in the list below once they pick it up.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
      >
        <Plus className="h-4 w-4" />
        New China request
      </button>
    );
  }

  const selected = TYPES.find((t) => t.value === type);

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-6">
      {state && !state.ok ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">What do you need?</span>
        <select
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="h-11 w-full rounded-lg border bg-background px-3"
        >
          {TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {selected ? (
          <span className="mt-1.5 block text-xs text-muted-foreground">
            {selected.hint}
          </span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">The goods</span>
        <input
          name="product"
          required
          className="h-11 w-full rounded-lg border bg-background px-3"
          placeholder="Hair bundles, phone cases, kitchen scales…"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Details</span>
        <textarea
          name="description"
          rows={4}
          required
          className="w-full rounded-lg border bg-background px-3 py-2"
          placeholder="Supplier name and address, quantities, model numbers, anything we need to know."
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Budget in USD (optional)</span>
        <input
          name="budgetUsd"
          inputMode="decimal"
          className="h-11 w-full rounded-lg border bg-background px-3"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground"
        >
          Send request
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-11 items-center rounded-xl border px-5 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
