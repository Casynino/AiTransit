"use client";

import { useActionState } from "react";

import {
  CheckField,
  FormError,
  FormOk,
  Submit,
  TextArea,
  TextField,
} from "@/components/portal/form";
import { changePassword, updateProfile } from "@/lib/actions/portal-account";

/**
 * The two things a customer may change about themselves.
 *
 * SEPARATE FORMS, SEPARATE ACTIONS. A password change requires proving you know
 * the current one; a change of address does not. Putting both behind one Save
 * would either make somebody type their password to correct a typo in a city
 * name, or let a password through without the check.
 */
export function ProfileForm({
  customer,
}: {
  customer: {
    altPhone: string | null;
    city: string | null;
    address: string | null;
    notifyWhatsapp: boolean;
    notifyEmail: boolean;
    notifySms: boolean;
  };
}) {
  const [state, action] = useActionState(updateProfile, undefined);

  return (
    <form action={action} className="space-y-5">
      {state?.ok ? <FormOk>Saved.</FormOk> : null}
      <FormError state={state} />

      <TextField
        label="Second phone number"
        name="altPhone"
        defaultValue={customer.altPhone ?? ""}
        hint="Someone else we can reach you on."
      />

      <TextField
        label="City"
        name="city"
        defaultValue={customer.city ?? ""}
      />

      <TextArea
        label="Address"
        name="address"
        rows={3}
        defaultValue={customer.address ?? ""}
        hint="Where a driver would find you, if we ever deliver to you."
      />

      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">
          How would you like to be contacted?
        </legend>
        <CheckField
          label="WhatsApp"
          name="notifyWhatsapp"
          defaultChecked={customer.notifyWhatsapp}
        />
        <CheckField
          label="Email"
          name="notifyEmail"
          defaultChecked={customer.notifyEmail}
        />
        <CheckField
          label="SMS"
          name="notifySms"
          hint="Costs us per message — we only use it if you ask."
          defaultChecked={customer.notifySms}
        />
      </fieldset>

      <Submit pending="Saving…">Save changes</Submit>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.ok ? <FormOk>Your password has been changed.</FormOk> : null}
      <FormError state={state} />

      <TextField
        label="Current password"
        name="current"
        type="password"
        required
        autoComplete="current-password"
      />
      <TextField
        label="New password"
        name="next"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 8 characters."
      />
      <TextField
        label="New password again"
        name="confirm"
        type="password"
        required
        autoComplete="new-password"
      />

      <Submit pending="Changing…">Change my password</Submit>
    </form>
  );
}
