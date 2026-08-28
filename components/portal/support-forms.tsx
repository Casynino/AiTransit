"use client";

import { useActionState, useState } from "react";
import { MessageSquarePlus, X } from "lucide-react";

import {
  FormError,
  FormOk,
  SelectField,
  Submit,
  TextArea,
  TextField,
} from "@/components/portal/form";
import { openTicket, replyToTicket } from "@/lib/actions/portal-account";
import { TICKET_CATEGORY, TICKET_CATEGORY_OPTIONS } from "@/lib/portal-labels";

/**
 * Starting a conversation, and replying in one.
 *
 * NO PRIORITY FIELD. A customer choosing their own urgency means every thread
 * is urgent, and the desk then has no way to see which one actually is. Support
 * raises it when it should be — see openTicket, which writes NORMAL and says
 * why.
 */
export function NewTicketForm({
  cargo,
}: {
  cargo: { id: string; trackingNumber: string }[];
}) {
  const [state, action] = useActionState(openTicket, undefined);
  const [open, setOpen] = useState(false);

  if (state?.ok) {
    return (
      <FormOk>
        Sent. Our support desk will reply here, and you will get a notification
        when they do.
      </FormOk>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ai-btn ai-btn-primary"
      >
        <MessageSquarePlus className="h-4 w-4" />
        Start a conversation
      </button>
    );
  }

  return (
    <section
      className="rounded-[var(--ai-radius-lg)] border p-5"
      style={{
        borderColor: "hsl(var(--ai-stone-3))",
        background: "hsl(var(--ai-white))",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Start a conversation</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="ai-btn ai-btn-outline ai-btn-sm"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <form action={action} className="space-y-4">
        <FormError state={state} />

        <SelectField
          label="What is it about?"
          name="category"
          required
          options={TICKET_CATEGORY_OPTIONS.map((c) => ({
            value: c,
            label: TICKET_CATEGORY[c] ?? c,
          }))}
        />

        <SelectField
          label="Related cargo"
          name="shipmentId"
          placeholder="None in particular"
          options={cargo.map((c) => ({
            value: c.id,
            label: c.trackingNumber,
          }))}
        />

        <TextField
          label="Subject"
          name="subject"
          required
          placeholder="A short line so we know what this is"
        />

        <TextArea label="Your message" name="body" required rows={5} />

        <Submit pending="Sending…">Send this message</Submit>
      </form>
    </section>
  );
}

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState(replyToTicket, undefined);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      {state?.ok ? <FormOk>Sent.</FormOk> : null}
      <FormError state={state} />
      <TextArea label="Reply" name="body" required rows={3} />
      <Submit pending="Sending…">Send reply</Submit>
    </form>
  );
}
