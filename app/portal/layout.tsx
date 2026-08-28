import { PortalShell } from "@/components/portal/portal-shell";
import { headers } from "next/headers";

import { portalBadges, requireAcceptedTerms } from "@/lib/portal";

/**
 * The customer portal's shell.
 *
 * ONE PRODUCT WITH THE PUBLIC SITE. `.ai-site` is the same class the marketing
 * pages carry, so the portal inherits the same tokens, type and primitives — a
 * customer who registers on the website and signs in should not feel handed
 * over to a different company's software, which is exactly what happens when a
 * portal is built out of the internal admin's components.
 *
 * It is NOT the staff app. That has a permission-built sidebar and a locale
 * switcher, neither of which means anything to a customer whose role holds no
 * permissions at all.
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
  /*
    THE TERMS GATE, HERE, ONCE.

    In the layout rather than on twenty-three pages, because a gate you have to
    remember to add to each new page is a gate that is missing from the next
    one somebody writes. `requireAcceptedTerms` redirects to /accept-terms,
    which deliberately sits OUTSIDE this layout — a gate inside it would bounce
    itself to itself forever.

    The path comes from a header the middleware sets, so somebody who followed a
    link to an invoice lands back on that invoice after agreeing rather than on
    the overview wondering where the link went.
  */
  const path = (await headers()).get("x-pathname") ?? undefined;
  const viewer = await requireAcceptedTerms(path);
  const badges = await portalBadges(viewer.customerId, viewer.userId);

  return (
    <PortalShell viewer={{ name: viewer.name, code: viewer.code }} badges={badges}>
      {children}
    </PortalShell>
  );
}
