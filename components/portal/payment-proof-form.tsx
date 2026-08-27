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
      <p className="ai-notice ai-notice-ok mt-4 flex items-start gap-2">
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
        className="ai-btn ai-btn-outline ai-btn-sm mt-4"
      >
        <Upload className="h-4 w-4" />
        I have paid — send proof
      </button>
    );
  }

  return (
    <form action={action} className="ai-card ai-rows mt-4 space-y-3 !p-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      {state && !state.ok ? (
        <p className="ai-notice ai-notice-error">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="ai-label">Amount paid</span>
          <input
            name="amount"
            inputMode="decimal"
            className="ai-field"
            placeholder="Leave blank for the full amount"
          />
        </label>
        <label className="block text-sm">
          <span className="ai-label">Reference</span>
          <input
            name="reference"
            className="ai-field"
            placeholder="Mobile money ID or bank slip number"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="ai-label">Screenshot or receipt</span>
        <input
          name="proof"
          type="file"
          accept="image/*,application/pdf"
          required
          className="ai-field pt-3.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="ai-label">Anything else</span>
        <textarea
          name="note"
          rows={2}
          className="ai-field"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="ai-btn ai-btn-primary ai-btn-sm"
        >
          Send proof
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ai-btn ai-btn-outline ai-btn-sm"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs ai-muted">
        This does not settle the invoice on its own. Our finance desk checks it
        against the account the money landed in, and the balance updates when
        they confirm it.
      </p>
    </form>
  );
}
