import Link from "next/link";
import { ArrowLeft, Building2, Coins, PackageSearch, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { AitransitLockup } from "@/components/brand/logo";
import { SignInForm } from "@/components/brand/sign-in-form";
import { RouteGlobe } from "@/components/brand/route-globe";
import { StarField } from "@/components/brand/star-field";
import { ThemeSwitch } from "@/components/brand/theme-switch";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * One door into everything.
 *
 * Admin, finance, both warehouses, support and customers all sign in here, and
 * the role on the account decides where they land — middleware sends a customer
 * to /portal and everybody else to their dashboard. The page therefore says
 * nothing about who it is for, because asking a visitor to classify themselves
 * before they have typed an email is how people end up hunting for a second
 * login that was never built.
 *
 * The sky behind it is the same one the marketing pages use, and it follows the
 * theme like the rest of the site. It used to be pinned dark on the reasoning
 * that a warehouse reads it at six in the morning — which was true and still
 * left somebody on a bright phone in a market squinting at a black screen. The
 * toggle is right there instead.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="ai-site relative flex min-h-dvh flex-col overflow-hidden">
      <StarField />

      {/*
        The corridor, behind the sign-in.

        This page was a form on an empty field — correct, and completely
        characterless, which is the wrong first impression for the screen a
        warehouse clerk opens every morning. The globe gives it the same
        atmosphere the rest of the site has, placed low and left so it sits
        under the copy rather than behind the form, where it would fight the
        inputs for attention.

        Lower opacity in daylight: on cream a dark sphere at full strength
        reads as a hole in the page, and on navy the same value reads as
        distance.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] items-center justify-center lg:flex"
      >
        <RouteGlobe className="ai-login-globe pointer-events-auto w-[42rem] max-w-none -translate-x-[26%] translate-y-[8%]" />
      </div>

      <header className="relative z-10">
        <div className="ai-wrap flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/" aria-label="AITRANSIT — home">
            <AitransitLockup />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitch />
            <Link href="/" className="ai-btn ai-btn-sm ai-btn-outline">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center py-10">
        <div className="ai-wrap grid w-full items-center gap-14 lg:grid-cols-[1.05fr_minmax(0,26rem)]">
          {/* The welcome. Hidden on a phone: somebody opening this on a handset
              is signing in, not being introduced to the company. */}
          <div className="hidden lg:block">
            <p className="ai-eyebrow ai-eyebrow-copper">
              Guangzhou · Hong Kong → Lusaka
            </p>
            <h1 className="ai-display-xl mt-5">Welcome back</h1>
            <p className="ai-lede mt-6 max-w-lg">
              One account for everything AITRANSIT does — your cargo, your
              invoices, your bookings and your money. Staff and customers sign in
              in the same place; we will take you where you belong.
            </p>

            <ul className="mt-12 grid max-w-lg gap-x-8 gap-y-6 sm:grid-cols-2">
              {[
                [PackageSearch, "Track every consignment", "China warehouse to Makeni counter"],
                [Coins, "Rates and money requests", "Quoted, confirmed, recorded"],
                [Building2, "Two warehouses, one record", "Guangzhou and Lusaka"],
                [ShieldCheck, "Released only against a scan", "QR on every box"],
              ].map(([Icon, title, hint]) => {
                const I = Icon as typeof PackageSearch;
                return (
                  <li key={title as string} className="flex gap-3">
                    <I
                      className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0"
                      style={{ color: "hsl(var(--ai-emerald))" }}
                    />
                    <span>
                      <span className="block text-sm font-semibold">
                        {title as string}
                      </span>
                      <span className="ai-muted block text-sm">
                        {hint as string}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <p
              className="mt-12 text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: "hsl(var(--ai-copper))" }}
            >
              {COMPANY.tagline}
            </p>
          </div>

          {/* The form. */}
          <div className="ai-card w-full">
            {/* On a phone this is the whole page, so the wordmark comes with it
                — otherwise the card floats with nothing identifying it. */}
            <div className="mb-7 lg:hidden">
              <AitransitLockup />
            </div>

            <h2 className="ai-display">Sign in</h2>
            <p className="ai-muted mt-2 text-[0.95rem]">
              Customers and staff, same place. Your dashboard opens
              automatically.
            </p>

            <div className="mt-7">
              <SignInForm callbackUrl={callbackUrl} />
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 py-8">
        <div className="ai-wrap">
          <p className="ai-muted text-xs">
            © {new Date().getFullYear()} {COMPANY.name}. Trouble signing in?{" "}
            <a
              href={`https://wa.me/${COMPANY.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ai-link"
            >
              Message us
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
