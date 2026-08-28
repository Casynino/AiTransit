import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AcceptTermsForm } from "@/components/portal/accept-terms-form";
import { AitransitLockup } from "@/components/brand/logo";
import { requireCustomer } from "@/lib/portal";
import { TERMS_VERSION } from "@/lib/terms";

export const metadata: Metadata = { title: "Our terms — AITRANSIT" };

/**
 * The gate every existing customer meets once.
 *
 * WHY IT LIVES OUTSIDE /portal. The portal layout holds the terms check, so an
 * acceptance page inside it would bounce itself to itself forever. Putting it
 * at the top level solves that and is the better design anyway: a blocking gate
 * should have nothing to navigate away into. There is no sidebar here, no
 * bottom bar, and one way forward.
 *
 * IT IS NOT A DIALOG. A modal over a page a customer can see but not use reads
 * as an obstacle to dismiss, and the browser back button escapes it. This is a
 * page, and the only page they have.
 *
 * ALREADY ACCEPTED, ALREADY GONE. Somebody who lands here with the current
 * version stored — a stale tab, a bookmark, the back button after accepting —
 * is sent straight on rather than asked to agree to the same thing twice.
 */
export default async function AcceptTermsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireCustomer();
  const sp = await searchParams;

  /*
    Where to go afterwards. Only a path inside the portal is accepted — a `next`
    from a query string is attacker-controlled, and an unchecked one turns this
    page into an open redirect that lends our domain to somebody else's link.
  */
  const raw = typeof sp.next === "string" ? sp.next : "";
  const next = raw.startsWith("/portal") && !raw.startsWith("//") ? raw : "/portal";

  if (viewer.termsVersion === TERMS_VERSION) redirect(next);

  return (
    <div
      className="ai-site flex min-h-screen flex-col"
      style={{ background: "hsl(var(--ai-stone))" }}
    >
      <header
        className="border-b"
        style={{ borderColor: "hsl(var(--ai-stone-3))" }}
      >
        <div className="ai-wrap flex h-[4.5rem] items-center">
          <AitransitLockup />
        </div>
      </header>

      <main className="ai-wrap flex-1 py-12 md:py-16">
        <AcceptTermsForm
          firstName={viewer.name.split(" ")[0] ?? viewer.name}
          returning={viewer.termsVersion !== null}
          next={next}
        />
      </main>
    </div>
  );
}
