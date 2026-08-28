"use client";

import { useActionState } from "react";

import {
  FileField,
  FormError,
  FormOk,
  SelectField,
  Submit,
  TextArea,
} from "@/components/portal/form";
import { raiseClaim, replyToClaim } from "@/lib/actions/portal-account";
import { CLAIM_KINDS } from "@/lib/portal-labels";

/**
 * Raising a claim, and replying on one.
 *
 * THE PHOTO IS ASKED FOR IN WORDS, NOT REQUIRED IN CODE. A damage claim without
 * a photograph is settled on somebody's memory, so the form says so plainly —
 * but a customer whose cargo never arrived has nothing to photograph, and
 * making it mandatory would block the one claim type that most needs raising.
 */
export function RaiseClaimForm({
  cargo,
  presetCargoId,
}: {
  cargo: { id: string; trackingNumber: string; description: string }[];
  presetCargoId?: string;
}) {
  const [state, action] = useActionState(raiseClaim, undefined);

  if (state?.ok) {
    return (
      <FormOk>
        Logged. Our team will investigate and you will see every update on this
        page. We will tell you as soon as there is news.
      </FormOk>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FormError state={state} />

      <SelectField
        label="Which cargo?"
        name="shipmentId"
        required
        defaultValue={presetCargoId}
        placeholder="Choose a consignment"
        options={cargo.map((c) => ({
          value: c.id,
          label: `${c.trackingNumber} — ${c.description}`,
        }))}
      />

      <SelectField
        label="What is wrong?"
        name="type"
        required
        placeholder="Choose the kind of problem"
        options={CLAIM_KINDS.map((k) => ({ value: k.value, label: k.label }))}
      />

      <TextArea
        label="Tell us what happened"
        name="description"
        required
        rows={5}
        hint="What you expected, what you got, and when you noticed. The more specific, the faster we can settle it."
      />

      <FileField
        label="Photograph"
        name="photo"
        hint="If the cargo is damaged, photograph it before you move it. This is usually what a claim turns on."
      />

      <Submit pending="Logging…">Raise this issue</Submit>
    </form>
  );
}

export function ClaimReplyForm({ claimId }: { claimId: string }) {
  const [state, action] = useActionState(replyToClaim, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="claimId" value={claimId} />
      {state?.ok ? <FormOk>Sent. Our team will see it.</FormOk> : null}
      <FormError state={state} />
      <TextArea
        label="Add to this claim"
        name="body"
        required
        rows={3}
        placeholder="Anything new, or an answer to what we asked."
      />
      <Submit pending="Sending…">Send</Submit>
    </form>
  );
}
