import Link from "next/link";
import { LogOut } from "lucide-react";

import { AitransitLockup } from "@/components/brand/logo";
import { PortalNav } from "@/components/portal/portal-nav";
import { SiteFooter } from "@/components/brand/site-footer";
import { ThemeSwitch } from "@/components/brand/theme-switch";
import { requireCustomer } from "@/lib/portal";

/**
 * The customer portal's shell.
 *
 * ONE PRODUCT WITH THE PUBLIC SITE. `.ai-site` is the same class the marketing
 * pages carry, so the portal inherits the same tokens, type and primitives — a
 * customer who registers on the website and signs in should not feel handed
 * over to a different company's software, which is exactly what happens when a
 * portal is built out of the internal admin's components.
 *
 * It is NOT the staff app. That has a permission-built sidebar, a notification
 * bell and a locale switcher, none of which mean anything to a customer whose
 * role holds no permissions at all.
 *
 * The guard sits here as well as on every page beneath it. `requireCustomer`
 * resolves the session to exactly one Customer id and redirects anybody else,
 * so no portal page can render for the wrong person even if one forgets to call
 * it — and they all call it anyway, because they each need the id to filter by.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireCustomer();

  return (
    <div className="ai-site flex min-h-screen flex-col">
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          borderColor: "hsl(var(--ai-stone-3))",
          background: "hsl(var(--ai-stone) / 0.88)",
        }}
      >
        <div className="ai-wrap flex h-[4.5rem] items-center justify-between gap-4">
          <Link href="/portal" aria-label="AITRANSIT — my account">
            <AitransitLockup />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSwitch />
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold leading-tight">
                {viewer.name}
              </span>
              <span
                className="ai-num block text-xs"
                style={{ color: "hsl(var(--ai-charcoal-soft))" }}
              >
                {viewer.code}
              </span>
            </span>
            {/* NextAuth owns the sign-out route; the portal has no reason to
                keep its own copy of that flow. */}
            <Link
              href="/api/auth/signout"
              className="ai-btn ai-btn-outline ai-btn-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
          </div>
        </div>
        <PortalNav />
      </header>

      <main className="ai-wrap flex-1 py-10 md:py-14">{children}</main>

      <SiteFooter />
    </div>
  );
}
