"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";

import { submitPaymentProof } from "@/lib/actions/portal";

/**
 * "I have paid — here is the screenshot."
 *
 * Collapsed until asked for, because most invoices on the page do not need it
 * and a form under every row turns a list into a wall.
 *
 * The wording is careful and it is careful on purpose. Nothing this form does
 * settles an invoice: it files a claim into the same queue Finance already
 * works, and the balance above it does not move until somebody has matched the
 * money to an account. Telling a customer their payment is "recorded" would be
 * the one lie this portal must not tell, because they would arrive at the
 * warehouse expecting to collect.
 */
export function PaymentProofForm({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string;
  invoiceNumber: string;
}) {
  const [state, action] = useActionState(submitPaymentProof, undefined);
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm text-success">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        Sent to our finance desk. They will check it against the account and
        update {invoiceNumber} once the money is confirmed.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Upload className="h-4 w-4" />
        I have paid — send proof
      </button>
    );
  }

  return (
    <form action={action} className="mt-4 space-y-3 rounded-lg border bg-muted/30 p-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      {state && !state.ok ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Amount paid</span>
          <input
            name="amount"
            inputMode="decimal"
            className="h-11 w-full rounded-lg border bg-background px-3"
            placeholder="Leave blank for the full amount"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Reference</span>
          <input
            name="reference"
            className="h-11 w-full rounded-lg border bg-background px-3"
            placeholder="Mobile money ID or bank slip number"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Screenshot or receipt</span>
        <input
          name="proof"
          type="file"
          accept="image/*,application/pdf"
          required
          className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium">Anything else</span>
        <textarea
          name="note"
          rows={2}
          className="w-full rounded-lg border bg-background px-3 py-2"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground"
        >
          Send proof
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-10 items-center rounded-lg border px-4 text-sm"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        This does not settle the invoice on its own. Our finance desk checks it
        against the account the money landed in, and the balance updates when
        they confirm it.
      </p>
    </form>
  );
}
