"use client";

import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

import type { ActionResult } from "@/lib/actions/types";

/**
 * The portal's form parts.
 *
 * Deliberately small and deliberately native. The staff app has a component
 * library with its own Input, Label and NativeSelect; the portal uses plain
 * elements styled with the public site's tokens instead, for two reasons. It
 * keeps a customer inside one visual product with the marketing site, and a
 * native <select> and <input type="date"> are the controls a phone renders best
 * — a custom dropdown is a worse date picker than the one Android already has.
 *
 * Every field takes `label` and renders a real <label>, so the whole portal is
 * usable with a screen reader without anybody remembering to add one.
 */

/* ------------------------------------------------------------------ status */

export function FormError({ state }: { state?: ActionResult<unknown> }) {
  if (!state || state.ok || !state.error) return null;
  return (
    <p
      className="flex items-start gap-2 rounded-[var(--ai-radius)] border px-3.5 py-2.5 text-sm"
      style={{
        borderColor: "hsl(348 80% 55% / 0.4)",
        background: "hsl(348 80% 55% / 0.08)",
        color: "hsl(348 70% 38%)",
      }}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      {state.error}
    </p>
  );
}

export function FormOk({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-start gap-2 rounded-[var(--ai-radius)] border px-3.5 py-2.5 text-sm"
      style={{
        borderColor: "hsl(var(--ai-emerald) / 0.4)",
        background: "hsl(var(--ai-emerald) / 0.08)",
        color: "hsl(var(--ai-emerald))",
      }}
      role="status"
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * A submit button that cannot be pressed twice.
 *
 * `useFormStatus` rather than a piece of state, so it disables during the
 * server action without the parent having to thread anything down. Double
 * submission on these forms means two pickup bookings or two claims, and the
 * actions guard against that too — but the cheapest place to stop it is here.
 */
export function Submit({
  children,
  pending: pendingLabel,
  full,
}: {
  children: React.ReactNode;
  pending?: string;
  full?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`ai-btn ai-btn-primary ${full ? "w-full" : ""} disabled:opacity-60`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel ?? "Sending…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ fields */

const CONTROL =
  "w-full rounded-[var(--ai-radius)] border px-3.5 py-2.5 text-sm outline-none focus:ring-2";

const controlStyle = {
  borderColor: "hsl(var(--ai-stone-3))",
  background: "hsl(var(--ai-white))",
} as const;

function Wrapper({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required ? (
          <span style={{ color: "hsl(var(--ai-copper))" }} aria-hidden>
            {" "}
            *
          </span>
        ) : null}
      </span>
      {children}
      {hint ? (
        <span
          className="mt-1 block text-xs"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function TextField({
  label,
  name,
  hint,
  required,
  type = "text",
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper label={label} hint={hint} required={required}>
      <input
        name={name}
        type={type}
        required={required}
        className={CONTROL}
        style={controlStyle}
        {...rest}
      />
    </Wrapper>
  );
}

export function TextArea({
  label,
  name,
  hint,
  required,
  rows = 4,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  rows?: number;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper label={label} hint={hint} required={required}>
      <textarea
        name={name}
        rows={rows}
        required={required}
        className={CONTROL}
        style={controlStyle}
        {...rest}
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  name,
  hint,
  required,
  options,
  placeholder,
  ...rest
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper label={label} hint={hint} required={required}>
      <select
        name={name}
        required={required}
        className={CONTROL}
        style={controlStyle}
        {...rest}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

/**
 * One optional attachment.
 *
 * `accept` allows images and PDFs, which between them cover every real answer
 * to "have you got the paperwork" — a photograph of a receipt, a WeChat
 * screenshot, a supplier's invoice. The 4 MB ceiling is the server's, stated
 * here so the refusal does not arrive after the upload.
 */
export function FileField({
  label,
  name,
  hint,
  required,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <Wrapper
      label={label}
      required={required}
      hint={hint ?? "A photo or a PDF, up to 4 MB."}
    >
      <input
        name={name}
        type="file"
        accept="image/*,application/pdf"
        required={required}
        className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
      />
    </Wrapper>
  );
}

export function CheckField({
  label,
  name,
  hint,
  defaultChecked,
}: {
  label: string;
  name: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint ? (
          <span
            className="block text-xs"
            style={{ color: "hsl(var(--ai-charcoal-soft))" }}
          >
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}
