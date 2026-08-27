"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { registerCustomer } from "@/lib/actions/portal";
import type { ActionResult } from "@/lib/actions/types";

const field =
  "h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-brand focus:bg-white/10";
const labelClass = "mb-1.5 block text-sm font-medium text-white/80";

function FormError({ state }: { state: ActionResult<unknown> | undefined }) {
  if (!state || state.ok) return null;
  return (
    <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {state.error}
    </p>
  );
}

/**
 * Customer registration.
 *
 * The phone number matters more than it looks. Most people signing up here have
 * already shipped with AITRANSIT, and the Guangzhou counter created a customer
 * record for them at the time. The server matches on this number and attaches
 * the new account to that record — so a returning customer signs in and finds
 * their cargo history already there, instead of an empty portal beside a second
 * customer record nobody will ever reconcile. The label says so, because a
 * customer who types a different number gets the empty portal.
 */
export function RegisterForm() {
  const [state, action] = useActionState(registerCustomer, undefined);

  if (state?.ok && state.data) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h3 className="mt-4 font-display text-2xl font-bold text-white">
          Account created
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
          Sign in with {state.data.email} to see your cargo, your invoices and
          your requests.
        </p>
        <Link
          href="/login?callbackUrl=/portal"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-signal px-6 text-sm font-semibold text-signal-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <FormError state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="r-name">
            Your full name
          </label>
          <input id="r-name" name="name" className={field} required autoComplete="name" />
        </div>
        <div>
          <label className={labelClass} htmlFor="r-phone">
            Phone / WhatsApp
          </label>
          <input
            id="r-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+260 9…"
            className={field}
            required
            autoComplete="tel"
          />
          <p className="mt-1.5 text-xs text-white/45">
            Use the number you have shipped with before — we will attach your
            existing cargo to this account.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="r-city">
            Town / city
          </label>
          <input id="r-city" name="city" className={field} placeholder="Lusaka" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="r-email">
            Email
          </label>
          <input
            id="r-email"
            name="email"
            type="email"
            className={field}
            required
            autoComplete="email"
          />
          <p className="mt-1.5 text-xs text-white/45">
            This is what you will sign in with.
          </p>
        </div>
        <div>
          <label className={labelClass} htmlFor="r-password">
            Password
          </label>
          <input
            id="r-password"
            name="password"
            type="password"
            className={field}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="mt-1.5 text-xs text-white/45">At least 8 characters.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="r-confirm">
            Confirm password
          </label>
          <input
            id="r-confirm"
            name="confirmPassword"
            type="password"
            className={field}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-12 items-center justify-center rounded-xl bg-signal px-6 text-sm font-semibold text-signal-foreground transition-transform hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
      >
        Create my account
      </button>

      <p className="text-sm text-white/55">
        Already registered?{" "}
        <Link href="/login?callbackUrl=/portal" className="text-signal underline">
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
