"use client";

import { useActionState, useState } from "react";

import { FormError, SubmitButton } from "@/components/app/form-feedback";
import { useT } from "@/components/app/locale-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { decideAppointment } from "@/lib/actions/appointments";

/**
 * Working one booking.
 *
 * The date field appears only for the two statuses that need one, because a
 * confirmed slot with no date is the state this control exists to prevent — and
 * a date box sitting greyed out beside "Cancelled" invites somebody to fill it
 * in anyway.
 */
const STATUSES = [
  { value: "CONFIRMED", label: "Confirm", hint: "Agreed. The customer is expected." },
  { value: "RESCHEDULED", label: "Reschedule", hint: "Moved to a different slot." },
  { value: "COMPLETED", label: "Completed", hint: "It happened." },
  { value: "CANCELLED", label: "Cancel", hint: "Not going ahead. A reason is required." },
];

export function AppointmentDecision({
  appointmentId,
  defaultDate,
  defaultTime,
}: {
  appointmentId: string;
  /** The day they asked for, pre-filled so confirming is one click. */
  defaultDate: string;
  defaultTime: string | null;
}) {
  const t = useT();
  const [state, action] = useActionState(decideAppointment, undefined);
  const [status, setStatus] = useState("CONFIRMED");
  const needsSlot = status === "CONFIRMED" || status === "RESCHEDULED";

  return (
    <form action={action} className="space-y-4 rounded-xl border bg-card p-5">
      <h3 className="font-display text-base font-semibold">
        {t("Work this booking")}
      </h3>
      <FormError state={state} />
      {state?.ok ? (
        <p className="rounded-md border border-success/30 bg-success/5 p-3 text-sm text-success">
          {t("Updated.")}
        </p>
      ) : null}

      <input type="hidden" name="id" value={appointmentId} />

      <div className="space-y-1.5">
        <Label htmlFor="a-status">{t("What is happening")}</Label>
        <select
          id="a-status"
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

      {needsSlot ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="a-date">{t("Confirmed for")}</Label>
            <Input
              id="a-date"
              name="confirmedFor"
              type="date"
              defaultValue={defaultDate}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a-time">{t("Time")}</Label>
            <Input
              id="a-time"
              name="confirmedTime"
              defaultValue={defaultTime ?? ""}
              placeholder={t("e.g. 10:00–12:00")}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="a-note">
          {t("Note to the customer")}
          {status === "CANCELLED" ? ` — ${t("required")}` : ""}
        </Label>
        <Textarea id="a-note" name="staffNote" rows={2} />
      </div>

      <SubmitButton pendingLabel="Saving…">{t("Save")}</SubmitButton>
    </form>
  );
}
