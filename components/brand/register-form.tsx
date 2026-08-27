"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { registerCustomer } from "@/lib/actions/portal";

/**
 * Customer registration.
 *
 * THE PHONE NUMBER MATTERS MORE THAN IT LOOKS. Most people signing up here have
 * already shipped with us, and the Guangzhou counter created a customer record
 * for them at the time. The server matches on this number and attaches the new
 * account to that record — so a returning customer signs in and finds their
 * history already there, instead of an empty portal beside a second customer
 * record nobody will ever reconcile. The hint says so, because somebody who
 * types a different number gets the empty portal and no explanation.
 */
export function RegisterForm() {
  const [state, action] = useActionState(registerCustomer, undefined);

  if (state?.ok && state.data) {
    return (
      <div className="ai-card text-center">
        <CheckCircle2
          className="mx-auto h-9 w-9"
          style={{ color: "hsl(var(--ai-emerald))" }}
        />
        <h2 className="ai-display mt-5">Account created</h2>
        <p
          className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed"
          style={{ color: "hsl(var(--ai-charcoal-soft))" }}
        >
          Sign in with {state.data.email} to see your cargo, your invoices and
          your requests.
        </p>
        <Link
          href="/login?callbackUrl=/portal"
          className="ai-btn ai-btn-primary mt-7"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="ai-card space-y-5">
      {state && !state.ok ? (
        <p className="ai-notice ai-notice-error">{state.error}</p>
      ) : null}

      <div>
        <label htmlFor="r-name" className="ai-label">
          Your full name
        </label>
        <input
          id="r-name"
          name="name"
          className="ai-field"
          required
          autoComplete="name"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="r-phone" className="ai-label">
            Phone / WhatsApp
          </label>
          <input
            id="r-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+260 9…"
            className="ai-field"
            required
            autoComplete="tel"
          />
          <p className="ai-hint">
            Use the number you have shipped with before — we will attach your
            existing cargo to this account.
          </p>
        </div>
        <div>
          <label htmlFor="r-city" className="ai-label">
            Town / city
          </label>
          <input
            id="r-city"
            name="city"
            className="ai-field"
            placeholder="Lusaka"
          />
        </div>
      </div>

      <div>
        <label htmlFor="r-email" className="ai-label">
          Email
        </label>
        <input
          id="r-email"
          name="email"
          type="email"
          className="ai-field"
          required
          autoComplete="email"
        />
        <p className="ai-hint">This is what you will sign in with.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="r-password" className="ai-label">
            Password
          </label>
          <input
            id="r-password"
            name="password"
            type="password"
            className="ai-field"
            required
            minLength={8}
            autoComplete="new-password"
          />
          <p className="ai-hint">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="r-confirm" className="ai-label">
            Confirm password
          </label>
          <input
            id="r-confirm"
            name="confirmPassword"
            type="password"
            className="ai-field"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
      </div>

      <button type="submit" className="ai-btn ai-btn-primary w-full">
        Create my account
      </button>

      <p className="ai-hint text-center">
        Already registered?{" "}
        <Link href="/login?callbackUrl=/portal" className="ai-link">
          Sign in
        </Link>
      </p>
    </form>
  );
}
