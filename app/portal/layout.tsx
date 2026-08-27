import Link from "next/link";

import { PortalNav } from "@/components/portal/portal-nav";
import { BrandLockup } from "@/components/brand-mark";
import { SiteFooter } from "@/components/site/site-footer";
import { requireCustomer } from "@/lib/portal";

/**
 * The customer portal's shell.
 *
 * A separate tree from /app on purpose. The staff shell carries a sidebar built
 * from permissions, a notification bell, a locale switcher and a mobile tab bar
 * — none of which mean anything to a customer, and all of which are wired to a
 * role that holds no permissions at all.
 *
 * The guard is here as well as on every page beneath it. `requireCustomer`
 * resolves the session to exactly one Customer id and redirects anybody who is
 * not a signed-in customer, so no portal page can render for the wrong person
 * even if one of them forgets to call it. Every page calls it anyway, because
 * they each need the id to filter by — see the note in lib/portal.ts.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireCustomer();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/portal" className="shrink-0">
            <BrandLockup subtitle={false} />
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:block">
              <span className="block font-medium leading-tight">
                {viewer.name}
              </span>
              <span className="block font-mono text-xs text-muted-foreground">
                {viewer.code}
              </span>
            </span>
            {/* A plain link, not a form: signing out is NextAuth's own route and
                the portal has no reason to own a copy of that flow. */}
            <Link
              href="/api/auth/signout"
              className="rounded-lg border px-3 py-2 transition-colors hover:bg-muted"
            >
              Sign out
            </Link>
          </div>
        </div>
        <PortalNav />
      </header>

      <main className="container flex-1 py-8">{children}</main>

      <SiteFooter />
    </div>
  );
}
