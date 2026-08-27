"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { loginAction, type LoginState } from "@/lib/actions/auth";

/**
 * Signing in.
 *
 * ONE FORM FOR EVERYONE — admin, finance, both warehouses, support and
 * customers. The role on the account decides where the person lands, so nobody
 * has to know which door is theirs before they have typed anything. That is the
 * whole reason this replaced a page headed "STAFF ACCESS ONLY": a customer who
 * read that went looking for a second login that does not exist, and a member
 * of staff who read "Customer portal" in the header assumed the same.
 *
 * The error is deliberately vague — "incorrect email or password" — and it says
 * the same thing whether the address exists or not. Telling somebody which half
 * they got wrong is telling an attacker which addresses are real.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ai-btn ai-btn-primary w-full"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Signing you in…
        </>
      ) : (
        <>
          Sign in
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );
}

export function SignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />

      <div>
        <label htmlFor="email" className="ai-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="you@example.com"
          className="ai-field"
          required
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="password" className="ai-label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className="ai-field"
          required
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="ai-notice ai-notice-error flex items-start gap-2"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </p>
      ) : null}

      <SubmitButton />

      <p className="ai-hint text-center">
        New customer?{" "}
        <Link href="/register" className="ai-link">
          Create an account
        </Link>
      </p>
    </form>
  );
}
